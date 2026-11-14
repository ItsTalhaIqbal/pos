/**
 * printReceipt(order, options)
 * Generates a printer-friendly receipt HTML sized for thermal printers (e.g., 58mm or 80mm)
 * and opens a print window which auto-triggers printing and closes.
 *
 * order: {
 *   orderNumber, customerName, customerPhone, tableNumber, items: [{name, price, quantity, notes}],
 *   subtotal, tax, discount, total, paymentMethod, createdAt, notes
 * }
 *
 * options:
 *  - paperWidthMm: 58 | 80 (default 80)
 *  - brand: { name, address, phone }
 *  - autoClose: boolean (close window after print; default true)
 *  - scale: number (receipt ka size; default 1.5, bara karna ho to 1.8 ya 2)
 */

export function printReceipt(order = {}, options = {}) {
	if (typeof window === "undefined") return

	const { paperWidthMm = 80, brand = {}, autoClose = true, scale = 1.5 } = options

	const widthPx = paperWidthMm === 58 ? 232 : 320 // approximate px width at 96dpi
	const bodyWidth = Math.round(widthPx * scale)
	const fs = (n) => Math.round(n * scale) // font size helper

	function fmtCurrency(n) {
		if (typeof n !== "number") return "-"
		return n.toLocaleString(undefined, { style: "currency", currency: "PKR", maximumFractionDigits: 2 })
	}

	function fmtDate(d) {
		if (!d) return "-"
		const dt = typeof d === "string" || typeof d === "number" ? new Date(d) : d
		return dt.toLocaleString()
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

	function escapeHtml(str) {
		if (str === null || str === undefined) return ""
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;")
	}

	const items = Array.isArray(order.items) ? order.items : []

	// Build HTML
	const html = `
	<!doctype html>
	<html>
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width,initial-scale=1" />
		<title>Receipt</title>
		<style>
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

			.receipt {
				padding: ${fs(8)}px ${fs(10)}px;
				box-sizing: border-box;
			}

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
		</style>
	</head>
	<body>
		<div class="receipt">
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
				${order.tableNumber ? `<div class="small"><strong>Table:</strong> ${escapeHtml(String(order.tableNumber))}</div>` : ""}
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
				<div style="display:flex;justify-content:space-between"><div class="muted">Subtotal</div><div class="muted">${escapeHtml(fmtCurrency(order.subtotal ?? calcSubtotal(items)))}</div></div>
				<div style="display:flex;justify-content:space-between"><div class="muted">Tax</div><div class="muted">${escapeHtml(fmtCurrency(order.tax ?? 0))}</div></div>
				<div style="display:flex;justify-content:space-between"><div class="muted">Discount</div><div class="muted">-${escapeHtml(fmtCurrency(order.discount ?? 0))}</div></div>
				<div style="display:flex;justify-content:space-between;margin-top:6px"><div class="bold">Total</div><div class="bold">${escapeHtml(fmtCurrency(order.total ?? calcTotal(items, order)))}</div></div>
			</div>

			<div class="line"></div>

			<div class="small center">
				Payment: ${escapeHtml(order.paymentMethod ?? "-")}<br/>
				${order.notes ? `<div class="muted">${escapeHtml(order.notes)}</div>` : ""}
			</div>

			<div style="height:24px"></div>
		</div>
		<script>
			(function(){
				function closeAfterPrint(){
					setTimeout(function(){ window.close(); }, 500);
				}
				if (window.matchMedia) {
					window.matchMedia('print').addListener(function(mql){ if(!mql.matches){ ${autoClose ? 'closeAfterPrint()' : ''} } });
				}
				window.onload = function(){ window.focus(); window.print(); ${autoClose ? 'closeAfterPrint()' : ''} }
			})()
		</script>
	</body>
	</html>
	`

	const printWindow = window.open("", "_blank", `width=${bodyWidth + 40},height=800`) // popup
	if (!printWindow) {
		console.warn("Unable to open print window. Please allow popups for this site.")
		return
	}

	printWindow.document.open()
	printWindow.document.write(html)
	printWindow.document.close()
}

export default printReceipt
