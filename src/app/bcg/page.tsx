import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PaymentForm from "@/components/PaymentForm"
import LoadingSpinner from "@/components/LoadingSpinner"
import { QrCode, Zap, Shield, Download } from "lucide-react"

export const metadata = {
  title: "HUB3 Generator Barkoda",
  description: "Generirajte HUB3 barkodove za plaćanje koje mogu skenirati bankarske aplikacije za trenutna plaćanja računa",
}

const features = [
  {
    icon: Zap,
    title: "Trenutno Generiranje",
    description: "Generirajte HUB3 barkodove u stvarnom vremenu dok tipkate"
  },
  {
    icon: Shield,
    title: "Kompatibilno s Bankama", 
    description: "Potpuno usklađeno s hrvatskim bankarskim standardima"
  },
  {
    icon: Download,
    title: "Spremno za Izvoz",
    description: "Preuzmite kao PNG ili podijelite direktno"
  }
]

export default function BarcodeGeneratorPage() {
  return (
    <main className="min-h-screen p-4 xl:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">HUB3 Generator Barkoda</h1>
              <p className="text-muted-foreground">
                Generirajte HUB3 barkodove za plaćanje koje mogu skenirati bankarske aplikacije za trenutna plaćanja računa
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="text-center border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Payment Form */}
        <Card className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Podaci za Plaćanje</CardTitle>
            <CardDescription>
              Unesite informacije o plaćanju za generiranje vašeg HUB3 barkoda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <PaymentForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}