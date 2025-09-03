"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { QrCode, CreditCard, Key, Home, Shield } from "lucide-react"

const navigationItems = [
  {
    href: "/",
    label: "",
    icon: Home,
    description: "Nadzorna ploča"
  },
  {
    href: "/bcg",
    label: "Barkod Generator",
    icon: QrCode,
    description: "HUB3 Kodovi za Plaćanje"
  },
  {
    href: "/bin",
    label: "BIN Provjera",
    icon: CreditCard,
    description: "Validacija Kartica"
  },
  {
    href: "/oib",
    label: "OIB",
    icon: Shield,
    description: "OIB Provjera"
  },
  {
    href: "/kdf",
    label: "Crypto",
    icon: Key,
    description: "Crypto Alati"
  }
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <Card className="mb-6 p-4 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 border-border/50 sticky top-0 z-10">
      <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label && (
                <>
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.label.split(" ")[0]}</span>
                </>
              )}
            </Link>
          )
        })}
      </nav>
    </Card>
  )
}