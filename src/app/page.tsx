import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, CreditCard, Key, ArrowRight, Zap, Shield, Database } from "lucide-react"

const apps = [
  {
    title: "HUB3 Generator Barkoda",
    description: "Generirajte HUB3 PDF417 barkodove za plaćanje koje mogu skenirati bankarske aplikacije za trenutna plaćanja računa",
    href: "/bcg",
    icon: QrCode,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    status: "Aktivno"
  },
  {
    title: "BIN Generator / Validator",
    description: "Napredni alat za generiranje testnih i validaciju stvarnih kreditnih / debitnih kartica s opsežnom BIN bazom podataka",
    href: "/bin",
    icon: CreditCard,
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
    status: "Aktivno"
  },
  {
    title: "Funkcije Izvođenja Ključeva",
    description: "Kriptografski alati za provjeru mnemoničkih fraza i generiranje crypto ključeva za Ethereum, Tron i druge blockchain-ove",
    href: "/kdf",
    icon: Key,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    status: "Aktivno"
  }
]

const stats = [
  { label: "Ukupno Alata", value: "3", icon: Zap },
  { label: "Hrvatskih Banaka", value: "20+", icon: Database },
  { label: "Razina Sigurnosti", value: "Visoka", icon: Shield }
]

export default function HomePage() {
  return (
    <main className="min-h-screen p-4 xl:p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Fin Apps
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Alati za brza plaćanja, validaciju kartica i generiranje crypto ključeva
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{stat.value}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {apps.map((app, index) => {
            const Icon = app.icon;
            return (
              <Card
                key={index}
                className="h-full flex flex-col group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${app.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary">{app.status}</Badge>
                  </div>
                  <div>
                    <CardTitle className="text-xl mb-2">{app.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {app.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 mt-auto">
                  <Link href={app.href}>
                    <Button className="w-full transition-all duration-200 hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
                      Otvori
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Napravljeno s Next.js 15 • React Server Components • TypeScript • Tailwind CSS
          </p>
        </div>
      </div>
    </main>
  )
}