import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Toaster } from "@/components/ui/toaster"
import Navbar from "@/components/Navbar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Financijski i Crypto Alati",
    template: "%s | Financijski Alati"
  },
  description: "Profesionalni alati za plaćanja, bankarstvo i kriptovalute. HUB3 generator barkodova, hrvatski BIN provjera i funkcije izvođenja ključeva.",
  keywords: [
    "HUB3 generator barkoda",
    "BIN provjera", 
    "validacija kartica",
    "alati za plaćanje",
    "izvođenje ključeva",
    "crypto alati",
  ],
  authors: [{ name: "Financijski Alati Hub" }],
  creator: "Financijski Alati Hub",
  openGraph: {
    type: "website",
    locale: "hr_HR",
    url: "https://finapps.vercel.app",
    title: "Financijski i Crypto Alati",
    description: "Profesionalni alati za plaćanja, bankarstvo i kriptovalute.",
    siteName: "Financijski Alati Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "Financijski i Crypto Alati",
    description: "Profesionalni alati za plaćanja, bankarstvo i kriptovalute.",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem 
          disableTransitionOnChange
        >
          {/* Theme Toggle - Fixed position */}
          <div className="fixed top-4 right-4 z-50">
            <ModeToggle />
          </div>
          
          {/* Main Content with Navbar */}
          <div className="min-h-screen bg-background">
            <Navbar />
            
            {/* Main content area */}
            <main className="container mx-auto px-1 md:px-4">
              {children}
            </main>
          </div>
          
          {/* Toast Notifications */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}