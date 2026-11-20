/**
 * printReceipt(order, options)
 * Thermal printer (58mm / 80mm) ke liye slip banata hai aur print window khol kar print karta hai.
 *
 * options:
 *  - type: 'customer' | 'kitchen'  (default 'customer')
 *      customer = prices + total wali slip
 *      kitchen  = sirf items/qty/notes (koi price nahi), bara font
 *  - paperWidthMm: 58 | 80 (default 80)
 *  - brand: { name, address, phone }
 *  - autoClose: boolean (print ke baad window band; default true)
 *  - scale: number (slip ka size; default 1.5, bara karna ho to 1.8 ya 2)
 *
 * printWorkPeriodSummary(workPeriod, options)
 * Work period end hone par Z-report slip.
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function fmtCurrency(n) {
  if (typeof n !== "number") return "-"
  return n.toLocaleString(undefined, { style: "currency", currency: "PKR", maximumFractionDigits: 2 })
}

function fmtDate(d) {
  if (!d) return "-"
  const dt = typeof d === "string" || typeof d === "number" ? new Date(d) : d
  return dt.toLocaleString()
}

// Table number: populated tableId ko priority do, warna purana tableNumber
function getTableNumber(order) {
  return order?.tableId?.number ?? order?.tableNumber ?? null
}

function calcSubtotal(items) {
  return items.reduce((s, it) => s + (Number(it.price ?? 0) * Number(it.quantity ?? 1)), 0)
}

function calcTotal(items, order) {
  const subtotal = order.subtotal ?? calcSubtotal(items)
  const tax = order.tax ?? 0
  const discount = order.discount ?? 0
  return subtotal + tax - discount
}

function getSizes(paperWidthMm, scale) {
  const widthPx = paperWidthMm === 58 ? 232 : 320 // approximate px width at 96dpi
  return {
    bodyWidth: Math.round(widthPx * scale),
    fs: (n) => Math.round(n * scale)
  }
}

function baseStyles({ paperWidthMm, bodyWidth, fs }) {
  return `
    @media print {
      @page { size: ${paperWidthMm}mm auto; margin: 0; }
      html, body { margin: 0; padding: 0; }
      body { width: 100% !important; max-width: none !important; }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
      width: ${bodyWidth}px;
      margin: 0 auto;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
    }

    .receipt { padding: ${fs(8)}px ${fs(10)}px; box-sizing: border-box; }
    .center { text-align: center }
    .right { text-align: right; white-space: nowrap }
    .muted { color: #222; font-size: ${fs(10)}px }
    h1 { font-size: ${fs(16)}px; margin: 4px 0 2px }
    h2 { font-size: ${fs(12)}px; margin: 3px 0 }
    .items { width: 100%; border-collapse: collapse; margin-top: 6px }
    .items td { padding: 3px 0; vertical-align: top; font-size: ${fs(11)}px }
    .line { border-top: 1px dashed #000; margin: ${fs(6)}px 0; }
    .small { font-size: ${fs(10)}px; line-height: 1.5 }
    .bold { font-weight: 700; font-size: ${fs(13)}px }
    .row { display: flex; justify-content: space-between }

    /* kitchen slip */
    .k-title { font-size: ${fs(18)}px; font-weight: 800; letter-spacing: 2px; margin: 2px 0 }
    .k-order { font-size: ${fs(22)}px; font-weight: 800; margin: 2px 0 }
    .k-type { font-size: ${fs(14)}px; font-weight: 700; text-transform: uppercase; margin: 2px 0 }
    .k-items td { padding: 4px 0; vertical-align: top; font-size: ${fs(15)}px; font-weight: 700 }
    .k-note { font-size: ${fs(11)}px; font-weight: 400; padding: 0 0 4px 18px !important }
  `
}

function openPrintWindow(html, bodyWidth, autoClose) {
  const script = `
    <script>
      (function(){
        function closeAfterPrint(){ setTimeout(function(){ window.close(); }, 500); }
        if (window.matchMedia) {
          window.matchMedia('print').addListener(function(mql){ if(!mql.matches){ ${autoClose ? "closeAfterPrint()" : ""} } });
        }
        window.onload = function(){ window.focus(); window.print(); ${autoClose ? "closeAfterPrint()" : ""} }
      })()
    </script>`

  const printWindow = window.open("", "_blank", `width=${bodyWidth + 40},height=800`) // popup
  if (!printWindow) {
    console.warn("Unable to open print window. Please allow popups for this site.")
    return
  }

  printWindow.document.open()
  printWindow.document.write(html.replace("</body>", `${script}</body>`))
  printWindow.document.close()
}

function customerBody(order, items, brand) {
  return `
    <div class="center">
      ${brand.name ? `<h1>${escapeHtml(brand.name)}</h1>` : ""}
      ${brand.address ? `<div class="muted">${escapeHtml(brand.address)}</div>` : ""}
      ${brand.phone ? `<div class="muted">${escapeHtml(brand.phone)}</div>` : ""}
    </div>

    <div class="line"></div>

    <div>
      <div class="small"><strong>Order:</strong> ${escapeHtml(order.orderNumber ?? "-")}</div>
      <div class="small"><strong>Date:</strong> ${escapeHtml(fmtDate(order.createdAt))}</div>
      <div class="small"><strong>Customer:</strong> ${escapeHtml(order.customerName ?? "-")}</div>
      ${getTableNumber(order) ? `<div class="small"><strong>Table:</strong> ${escapeHtml(String(getTableNumber(order)))}</div>` : ""}
      ${order.customerPhone ? `<div class="small"><strong>Phone:</strong> ${escapeHtml(order.customerPhone)}</div>` : ""}
    </div>

    <table class="items">
      <tbody>
        ${items.map(it => `
          <tr>
            <td style="width:70%">${escapeHtml(String(it.quantity ?? 1))}x ${escapeHtml(it.name)}</td>
            <td style="width:30%" class="right">${escapeHtml(fmtCurrency((it.price ?? 0) * (it.quantity ?? 1)))}</td>
          </tr>
          ${it.notes ? `<tr><td colspan="2" class="muted small">Notes: ${escapeHtml(it.notes)}</td></tr>` : ""}
        `).join("")}
      </tbody>
    </table>

    <div class="line"></div>

    <div>
      <div class="row"><div class="muted">Subtotal</div><div class="muted">${escapeHtml(fmtCurrency(order.subtotal ?? calcSubtotal(items)))}</div></div>
      <div class="row"><div class="muted">Tax</div><div class="muted">${escapeHtml(fmtCurrency(order.tax ?? 0))}</div></div>
      <div class="row"><div class="muted">Discount</div><div class="muted">-${escapeHtml(fmtCurrency(order.discount ?? 0))}</div></div>
      <div class="row" style="margin-top:6px"><div class="bold">Total</div><div class="bold">${escapeHtml(fmtCurrency(order.total ?? calcTotal(items, order)))}</div></div>
    </div>

    <div class="line"></div>

    <div class="small center">
      Payment: ${escapeHtml(order.paymentMethod ?? "-")}<br/>
      ${order.notes ? `<div class="muted">${escapeHtml(order.notes)}</div>` : ""}
      <div style="margin-top:6px">Thank you!</div>
    </div>
  `
}

function kitchenBody(order, items) {
  const table = getTableNumber(order)
  const typeLabel = order.orderType === "dine-in"
    ? `Dine-in${table ? ` - Table ${table}` : ""}`
    : (order.orderType ?? "")

  return `
    <div class="center">
      <div class="k-title">KITCHEN</div>
      <div class="k-order">#${escapeHtml(order.orderNumber ?? "-")}</div>
      <div class="k-type">${escapeHtml(typeLabel)}</div>
      <div class="muted">${escapeHtml(fmtDate(order.createdAt))}</div>
      ${order.orderType && order.orderType !== "dine-in" && order.customerName
        ? `<div class="muted">${escapeHtml(order.customerName)}</div>` : ""}
    </div>

    <div class="line"></div>

    <table class="items k-items">
      <tbody>
        ${items.map(it => `
          <tr>
            <td style="width:18%">${escapeHtml(String(it.quantity ?? 1))}x</td>
            <td>${escapeHtml(it.name)}</td>
          </tr>
          ${it.notes ? `<tr><td></td><td class="k-note">** ${escapeHtml(it.notes)}</td></tr>` : ""}
        `).join("")}
      </tbody>
    </table>

    <div class="line"></div>

    ${order.notes ? `<div class="small"><strong>Note:</strong> ${escapeHtml(order.notes)}</div><div class="line"></div>` : ""}
    <div class="small center">Total items: ${items.reduce((s, it) => s + Number(it.quantity ?? 1), 0)}</div>
  `
}

export function printReceipt(order = {}, options = {}) {
  if (typeof window === "undefined") return

  const { type = "customer", paperWidthMm = 80, brand = {}, autoClose = true, scale = 1.5 } = options
  const { bodyWidth, fs } = getSizes(paperWidthMm, scale)
  const items = Array.isArray(order.items) ? order.items : []

  const body = type === "kitchen" ? kitchenBody(order, items) : customerBody(order, items, brand)

  const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${type === "kitchen" ? "Kitchen Slip" : "Receipt"}</title>
    <style>${baseStyles({ paperWidthMm, bodyWidth, fs })}</style>
  </head>
  <body>
    <div class="receipt">
      ${body}
      <div style="height:24px"></div>
    </div>
  </body>
  </html>`

  openPrintWindow(html, bodyWidth, autoClose)
}

export function printWorkPeriodSummary(workPeriod = {}, options = {}) {
  if (typeof window === "undefined") return

  const { paperWidthMm = 80, brand = {}, autoClose = true, scale = 1.5 } = options
  const { bodyWidth, fs } = getSizes(paperWidthMm, scale)
  const s = workPeriod.summary ?? {}

  const row = (label, value, strong = false) =>
    `<div class="row"><div class="${strong ? "bold" : "muted"}">${escapeHtml(label)}</div><div class="${strong ? "bold" : "muted"}">${escapeHtml(value)}</div></div>`

  const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Work Period Report</title>
    <style>${baseStyles({ paperWidthMm, bodyWidth, fs })}</style>
  </head>
  <body>
    <div class="receipt">
      <div class="center">
        ${brand.name ? `<h1>${escapeHtml(brand.name)}</h1>` : ""}
        <h2>WORK PERIOD REPORT</h2>
      </div>
      <div class="line"></div>
      ${row("Start", fmtDate(workPeriod.startedAt))}
      ${row("End", fmtDate(workPeriod.endedAt))}
      <div class="line"></div>
      ${row("Orders", String(s.totalOrders ?? 0))}
      ${row("Cancelled", String(s.cancelledOrders ?? 0))}
      ${row("Cash sales", fmtCurrency(s.cashSales ?? 0))}
      ${row("Card sales", fmtCurrency(s.cardSales ?? 0))}
      ${row("Other sales", fmtCurrency(s.otherSales ?? 0))}
      ${row("TOTAL SALES", fmtCurrency(s.totalSales ?? 0), true)}
      <div class="line"></div>
      ${row("Opening cash", fmtCurrency(workPeriod.openingCash ?? 0))}
      ${row("Expected cash", fmtCurrency(s.expectedCash ?? 0))}
      ${row("Counted cash", fmtCurrency(workPeriod.closingCash ?? 0))}
      ${row("Difference", fmtCurrency(s.cashDifference ?? 0), true)}
      <div style="height:24px"></div>
    </div>
  </body>
  </html>`

  openPrintWindow(html, bodyWidth, autoClose)
}

export default printReceipt
