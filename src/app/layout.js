import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/provider/theme-provider"
import "./globals.css";


const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: "Crunchy Bites - Restaurant Management System",
  description: "Complete restaurant management system with POS, order management, and analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
