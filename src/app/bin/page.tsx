import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import LoadingSpinner from "@/components/LoadingSpinner"
import BINChecker from "@/components/BINChecker"
import { getBankingStatistics } from "@/app/actions/card-validation"
import { Database, CreditCard, Building, TrendingUp } from "lucide-react"

export default async function BINCheckerPage() {
  const stats = await getBankingStatistics()

  return (
    <main className="min-h-screen p-4 xl:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Hrvatska BIN Provjera</h1>
              <p className="text-muted-foreground">
                Napredni alat za validaciju kartica za hrvatski bankarski sustav s opsežnom BIN bazom podataka
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <Card className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-primary" />
              <span>Statistike Baze Podataka</span>
            </CardTitle>
            <CardDescription>
              Uvidi u stvarnom vremenu u hrvatsku bankarsku BIN bazu podataka
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalBanks}</span>
                </div>
                <p className="text-sm text-muted-foreground">Hrvatskih Banki</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalBINs}</span>
                </div>
                <p className="text-sm text-muted-foreground">BIN Brojeva</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Object.keys(stats.cardTypes).length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Tipova Kartica</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{Object.keys(stats.cardCategories).length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Kategorije Kartica</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Distribucija Tipova Kartica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.cardTypes).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{type}</span>
                      <Badge variant="secondary" className="text-xs">
                        {count} BIN-ova
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Kategorije Kartica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.cardCategories).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {count} BIN-ova
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* BIN Checker Component */}
        <Card className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Alat za Validaciju Kartica</CardTitle>
            <CardDescription>
              Unesite broj kartice za validaciju strukture, provjeru Luhn algoritma i identifikaciju izdavajuće banke
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <BINChecker className="space-y-6" />
            </Suspense>
          </CardContent>
        </Card>

        {/* Card Structure Example */}
        <Card className="bg-green-500/5 border-green-200/50 dark:border-green-800/50">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100">Primjer Strukture Kartice</CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Razumijevanje kako su strukturirani brojevi kreditnih kartica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-card p-6 rounded-lg border space-y-4">
              <div className="text-lg font-bold text-center font-mono">4159 4828 4759 3853</div>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded text-center">
                  <div className="font-mono font-bold">4</div>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded text-center">
                  <div className="font-mono font-bold">15948</div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded text-center">
                  <div className="font-mono font-bold">284759385</div>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded text-center">
                  <div className="font-mono font-bold">3</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs text-center text-muted-foreground">
                <div>MII (Industrija)</div>
                <div>ID Izdavatelja</div>
                <div>ID Računa</div>
                <div>Kontrolna Znamenka</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}