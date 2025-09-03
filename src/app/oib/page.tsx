import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import OIBChecker from "@/components/OIBChecker"
import LoadingSpinner from "@/components/LoadingSpinner"
import { Shield, Calculator, Eye, BookOpen } from "lucide-react"

export const metadata = {
  title: "OIB Provjera - Hrvatski OIB Validator",
  description: "Provjerite ispravnost hrvatskog OIB-a (Osobni identifikacijski broj) s detaljnim prikazom algoritma i korak-po-korak validacijom",
}

const features = [
  {
    icon: Calculator,
    title: "Izračun Kontrolne Znamenke",
    description: "Generirajte 11. znamenku iz prvih 10 brojeva OIB-a"
  },
  {
    icon: Shield,
    title: "Potpuna Validacija", 
    description: "Provjerite ispravnost postojećeg 11-znamenkastog OIB-a"
  },
  {
    icon: Eye,
    title: "Transparentni Algoritam",
    description: "Vidite svaki korak hrvatskog OIB algoritma u realnom vremenu"
  },
  {
    icon: BookOpen,
    title: "Edukacijski Sadržaj",
    description: "Naučite kako funkcionira matematika iza OIB validacije"
  }
]

export default function OIBCheckerPage() {
  return (
    <main className="min-h-screen p-4 xl:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">OIB Provjera</h1>
              <p className="text-muted-foreground">
                Provjerite ispravnost hrvatskog OIB-a (Osobni identifikacijski broj) s detaljnim prikazom algoritma i korak-po-korak validacijom
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* OIB Checker */}
        <Card className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>OIB Validator i Generator</CardTitle>
            <CardDescription>
              Unesite OIB za validaciju ili prvih 10 znamenki za generiranje kontrolne znamenke
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <OIBChecker />
            </Suspense>
          </CardContent>
        </Card>

        {/* Educational Note */}
        <Card className="border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                O hrvatskom OIB algoritmu
              </h3>
              <div className="text-sm text-blue-600 dark:text-blue-300 space-y-2 max-w-4xl mx-auto">
                <p>
                  <strong>OIB (Osobni identifikacijski broj)</strong> je jedinstven 11-znamenkasti broj koji se 
                  dodjeljuje svakoj fizičkoj i pravnoj osobi u Republici Hrvatskoj.
                </p>
                <p>
                  Algoritam koristi <strong>modulo 11 provjeru</strong> s posebnim pravilima za izračun kontrolne znamenke, 
                  što osigurava visoku razinu zaštite od greške u tipkanju i falsificiranju.
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400 pt-2">
                  Napomena: Ova aplikacija služi samo za matematičku provjeru ispravnosti OIB-a. 
                  Ne provjerava postojanje ili vlasništvo OIB-a u stvarnosti.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}