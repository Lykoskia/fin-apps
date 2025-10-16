import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PaymentForm from "@/components/PaymentForm"
import LoadingSpinner from "@/components/LoadingSpinner"

export const metadata = {
  title: "HUB3 Generator Barkoda",
  description: "Generirajte HUB3 barkodove za plaćanje koje mogu skenirati bankarske aplikacije za trenutna plaćanja računa",
}

export default function BarcodeGeneratorPage() {
  return (
    <main className="min-h-screen w-full p-4 xl:p-6">
      <div className="space-y-8">

        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex-col items-center space-x-3">
            <h1 className="text-3xl font-bold text-foreground text-center">HUB3 Generator Barkoda</h1>
            <p className="text-muted-foreground text-center">
              Generirajte HUB3 barkodove za plaćanje koje mogu skenirati bankarske aplikacije za trenutna plaćanja računa
            </p>
          </div>
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
