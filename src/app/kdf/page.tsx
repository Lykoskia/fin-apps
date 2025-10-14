import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import EnhancedMnemonicKDF from '@/components/EnhancedMnemonicKDF';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Key, Shield, Zap, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const metadata = {
  title: 'Funkcije Izvođenja Ključeva',
  description:
    'Kriptografski alati za generiranje sigurnih ključeva i upravljanje digitalnim sredstvima pomoću BIP-39 mnemoničkih fraza',
};

const features = [
  {
    icon: Shield,
    title: 'BIP-39 Standard',
    description: 'Industrijski standard za generiranje i validaciju mnemoničkih fraza',
  },
  {
    icon: Key,
    title: 'Podrška za Više Blockchain-ova',
    description:
      'Generirajte ključeve za Ethereum, Tron, Bitcoin (Legacy, SegWit, Taproot) i Solana',
  },
  {
    icon: Zap,
    title: 'Validacija u Stvarnom Vremenu',
    description: 'Trenutna povratna informacija o valjanosti i strukturi mnemoničke fraze',
  },
];

export default function KDFPage() {
  return (
    <main className="min-h-screen p-4 xl:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Funkcije Izvođenja Ključeva
              </h1>
              <p className="text-muted-foreground">
                Kriptografski alati za generiranje sigurnih ključeva i
                upravljanje digitalnim sredstvima pomoću BIP-39 mnemoničkih
                fraza
              </p>
            </div>
          </div>
        </div>

        {/* Security Warning */}
        <Alert className="border-red-200/50 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/50">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <span className="font-medium">Sigurnosno Upozorenje:</span> Nikada
            ne unosite svoju pravu mnemoničku frazu na bilo koju web stranicu.
            Ovaj alat je samo u obrazovne svrhe. Za stvarno izvođenje ključeva
            koristite offline alate ili hardverske novčanike.
          </AlertDescription>
        </Alert>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* KDF Tool */}
        <Card className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Mnemonično Izvođenje Ključeva</CardTitle>
            <CardDescription>
              Unesite 12-riječi BIP-39 mnemoničku frazu za izvođenje
              kriptografskih ključeva za više blockchain-ova
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <EnhancedMnemonicKDF />
            </Suspense>
          </CardContent>
        </Card>

        {/* Educational Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-blue-500/5 border-blue-200/50 dark:border-blue-800/50">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">
                Kako BIP-39 Funkcionira
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                <div>
                  <span className="font-medium">1. Generiranje Entropije:</span>{' '}
                  128 bitova nasumičnosti
                </div>
                <div>
                  <span className="font-medium">2. Checksum:</span> Zadnja 4
                  bita za validaciju
                </div>
                <div>
                  <span className="font-medium">3. Mapiranje Riječi:</span> 132
                  bita → 12 riječi iz liste od 2048 riječi
                </div>
                <div>
                  <span className="font-medium">4. Izvođenje Seed-a:</span>{' '}
                  PBKDF2 s 2048 iteracija
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/5 border-green-200/50 dark:border-green-800/50">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">
                Podržani Blockchain-ovi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-green-800 dark:text-green-200">
                <div className="flex justify-between">
                  <span className="font-medium">Bitcoin (Legacy):</span>
                  <span className="font-mono text-xs">m/44&apos;/0&apos;/0&apos;/0/0</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Bitcoin (SegWit):</span>
                  <span className="font-mono text-xs">m/84&apos;/0&apos;/0&apos;/0/0</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Bitcoin (Taproot):</span>
                  <span className="font-mono text-xs">m/86&apos;/0&apos;/0&apos;/0/0</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Ethereum:</span>
                  <span className="font-mono text-xs">m/44&apos;/60&apos;/0&apos;/0/0</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Solana:</span>
                  <span className="font-mono text-xs">m/44&apos;/501&apos;/0&apos;</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tron:</span>
                  <span className="font-mono text-xs">m/44&apos;/195&apos;/0&apos;/0/0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-3">
                  Svaki blockchain koristi jedinstvenu putanju izvođenja za
                  osiguravanje izolirane generacije ključeva
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="bg-purple-500/5 border-purple-200/50 dark:border-purple-800/50">
          <CardHeader>
            <CardTitle className="text-purple-900 dark:text-purple-100">
              Tehnička Implementacija
            </CardTitle>
            <CardDescription className="text-purple-700 dark:text-purple-300">
              Ovaj alat demonstrira moderne kriptografske standarde i sigurno
              izvođenje ključeva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-medium text-purple-800 dark:text-purple-200">
                  Korištene Biblioteke
                </h3>
                <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                  <li>• bip39 - Mnemonička validacija</li>
                  <li>• ethereumjs-wallet - HD izvođenje (za EVM/Tron)</li>
                  <li>• bip32, bitcoinjs-lib - HD izvođenje (za Bitcoin)</li>
                  <li>• ed25519-hd-key - HD izvođenje (za Solana)</li>
                  <li>• pbkdf2 - Rastezanje ključeva</li>
                  <li>• keccak - Ethereum/Tron hashing</li>
                  <li>• tiny-secp256k1-asmjs - Kriptografija za Bitcoin</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-purple-800 dark:text-purple-200">
                  Sigurnosne Značajke
                </h3>
                <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                  <li>• Samo client-side procesiranje</li>
                  <li>• Nema prijenosa podataka</li>
                  <li>• Validacija u stvarnom vremenu</li>
                  <li>• Industrijski standardi</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-purple-800 dark:text-purple-200">
                  Izlazni Formati
                </h3>
                <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                  <li>• Heksadecimalni privatni ključevi</li>
                  <li>• Komprimirani javni ključevi</li>
                  <li>• Checksummed adrese</li>
                  <li>• Putanje izvođenja</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}