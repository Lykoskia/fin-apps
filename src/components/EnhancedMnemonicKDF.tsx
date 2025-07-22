"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Key,
  Shield,
  Zap,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

// Ethereum Logo Component
const EthereumLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 417" className={className} fill="currentColor">
    <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fill="#343434" />
    <path d="M127.961 0L0 212.32l127.961 75.639V154.158z" fill="#8C8C8C" />
    <path d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z" fill="#3C3C3B" />
    <path d="M127.961 416.905v-104.72L0 236.585z" fill="#8C8C8C" />
    <path d="M127.961 287.958l127.96-75.637-127.96-58.162z" fill="#141414" />
    <path d="M0 212.32l127.961 75.638v-133.8z" fill="#393939" />
  </svg>
);

// Tron Logo Component
const TronLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor">
    <path d="M61.55,19.28c-3-2.77-7.15-7-10.53-10l-.2-.14a3.82,3.82,0,0,0-1.11-.62l0,0C41.56,7,3.63-.09,2.89,0a1.4,1.4,0,0,0-.58.22L2.12.37a2.23,2.23,0,0,0-.52.84l-.05.13v.71l0,.11C5.82,14.05,22.68,53,26,62.14c.2.62.58,1.8,1.29,1.86h.16c.38,0,2-2.14,2-2.14S58.41,26.74,61.34,23a9.46,9.46,0,0,0,1-1.48A2.41,2.41,0,0,0,61.55,19.28ZM36.88,23.37,49.24,13.12l7.25,6.68Zm-4.8-.67L10.8,5.26l34.43,6.35ZM34,27.27l21.78-3.51-24.9,30ZM7.91,7,30.3,26,27.06,53.78Z" />
  </svg>
);

// Crypto libraries interface with flexible types that match actual libraries
interface BIP39Library {
  mnemonicToEntropy: (mnemonic: string) => string;
  mnemonicToSeedSync: (mnemonic: string) => Buffer;
  validateMnemonic: (mnemonic: string) => boolean;
  wordlists?: {
    english?: string[];
    EN?: string[];
    [key: string]: string[] | undefined;
  } | string[];
  [key: string]: unknown;
}

interface HDKeyLibrary {
  fromMasterSeed: (seed: Buffer) => unknown;
  [key: string]: unknown;
}

interface HDKeyInstance {
  privateKey?: Buffer;
  publicKey?: Buffer;
  derivePath: (path: string) => unknown;
  getPrivateKey?: () => Buffer;
  getPublicKey?: () => Buffer;
  getWallet?: () => {
    getPrivateKey?: () => Buffer;
    getPublicKey?: () => Buffer;
  };
  [key: string]: unknown;
}

interface KeccakFunction {
  (algorithm: string): {
    update: (data: Buffer) => {
      digest: () => Buffer;
    };
  };
  (data: Buffer): Buffer;
  keccak256?: (data: Buffer) => Buffer;
  [key: string]: unknown;
}

interface BS58CheckFunction {
  encode: (data: Buffer) => string;
  decode: (data: string) => Buffer;
  [key: string]: unknown;
}

interface CryptoLibs {
  bip39: BIP39Library;
  hdkey: HDKeyLibrary;
  keccak256: KeccakFunction;
  bs58check: BS58CheckFunction;
  Buffer: typeof Buffer;
}

// Global crypto libs state
let cryptoLibs: CryptoLibs | null = null;
let englishWordlist: string[] = [];

// Load crypto libraries with better error handling
const initCrypto = async (): Promise<boolean> => {
  try {
    const libs: Partial<CryptoLibs> = {
      Buffer: (await import('buffer')).Buffer
    };

    // Load bip39
    try {
      libs.bip39 = await import('bip39');
      
      // Extract the wordlist properly - different versions have different APIs
      if (libs.bip39.wordlists && typeof libs.bip39.wordlists === 'object' && !Array.isArray(libs.bip39.wordlists)) {
        const wordlists = libs.bip39.wordlists as { english?: string[]; EN?: string[]; [key: string]: string[] | undefined };
        if (wordlists.english) {
          englishWordlist = wordlists.english;
        } else if (wordlists.EN) {
          englishWordlist = wordlists.EN;
        } else {
          throw new Error('Cannot find English wordlist in bip39 library');
        }
      } else if (Array.isArray(libs.bip39.wordlists)) {
        englishWordlist = libs.bip39.wordlists;
      } else {
        // Try to get it from the default export or other properties
        const bip39Module = libs.bip39 as Record<string, unknown>;
        const defaultModule = bip39Module.default as Record<string, unknown> | undefined;
        const wordlist = defaultModule?.wordlists || bip39Module.english;
        
        if (Array.isArray(wordlist)) {
          englishWordlist = wordlist as string[];
        } else if (wordlist && typeof wordlist === 'object') {
          const wordlistObj = wordlist as Record<string, unknown>;
          if (Array.isArray(wordlistObj.english)) {
            englishWordlist = wordlistObj.english as string[];
          } else {
            throw new Error('Cannot find English wordlist in bip39 library');
          }
        } else {
          throw new Error('Cannot find English wordlist in bip39 library');
        }
      }
      
      console.log('BIP-39 wordlist loaded:', englishWordlist.length, 'words');
    } catch (error) {
      console.error('BIP39 loading error:', error);
      throw new Error('Cannot load bip39: ' + (error as Error).message);
    }

    // Try to load ethereumjs-wallet
    try {
      const wallet = await import('ethereumjs-wallet');
      libs.hdkey = wallet.hdkey;
    } catch {
      throw new Error('Cannot load ethereumjs-wallet');
    }

    // Load keccak
    try {
      const keccakModule = await import('keccak');
      libs.keccak256 = (keccakModule.default || keccakModule) as KeccakFunction;
      
      // Debug: Check what we got
      console.log('Keccak module loaded:', {
        hasDefault: !!keccakModule.default,
        hasKeccak256: !!(keccakModule as Record<string, unknown>).keccak256,
        moduleType: typeof (libs.keccak256),
        isFunction: typeof libs.keccak256 === 'function'
      });
      
    } catch {
      throw new Error('Cannot load keccak');
    }

    // Load bs58check
    try {
      const bs58checkModule = await import('bs58check');
      libs.bs58check = (bs58checkModule.default || bs58checkModule) as BS58CheckFunction;
    } catch {
      throw new Error('Cannot load bs58check');
    }

    // Set global Buffer
    if (typeof window !== 'undefined') {
      (window as typeof globalThis & { Buffer: typeof Buffer }).Buffer = libs.Buffer!;
    }

    cryptoLibs = libs as CryptoLibs;
    return true;

  } catch (error) {
    console.error('Crypto initialization error:', error);
    throw error;
  }
};

// Word validation state enum for clarity
enum WordValidationState {
  EMPTY = 'empty',
  INVALID = 'invalid', 
  VALID = 'valid'
}

interface ValidationStep {
  description: string;
  calculation?: string;
  result?: string;
  type: 'info' | 'calculation' | 'success' | 'error';
  explanation?: string;
}

interface DerivedKeys {
  entropy: string;
  seed: string;
  ethereum: {
    path: string;
    privateKey: string;
    publicKey: string;
    address: string;
  };
  tron: {
    path: string;
    privateKey: string;
    publicKey: string;
    address: string;
  };
}

const ValidationStepDisplay = ({ step }: { step: ValidationStep }) => (
  <div className={cn(
    "p-3 rounded-lg border-l-4 space-y-2 transition-all duration-200",
    step.type === 'success' && "border-l-green-500 bg-green-500/5 dark:bg-green-500/10",
    step.type === 'error' && "border-l-red-500 bg-red-500/5 dark:bg-red-500/10",
    step.type === 'calculation' && "border-l-blue-500 bg-blue-500/5 dark:bg-blue-500/10",
    step.type === 'info' && "border-l-gray-400 bg-gray-500/5 dark:bg-gray-500/10"
  )}>
    <div className="font-medium text-sm text-foreground">{step.description}</div>
    {step.explanation && (
      <div className="text-xs text-muted-foreground italic">{step.explanation}</div>
    )}
    {step.calculation && (
      <div className="font-mono text-xs text-muted-foreground bg-muted p-2 rounded border">
        {step.calculation}
      </div>
    )}
    {step.result && (
      <div className="font-medium text-sm text-foreground">
        → {step.result}
      </div>
    )}
  </div>
);

const MnemonicWordInput = ({
  words,
  onChange,
  wordValidation,
  isLoading
}: {
  words: string[];
  onChange: (words: string[]) => void;
  wordValidation: Record<number, WordValidationState>;
  isLoading: boolean;
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value.toLowerCase().trim();
    onChange(newWords);
  };

  const getValidationIcon = (index: number) => {
    const state = wordValidation[index];
    if (isLoading) {
      return <LoadingSpinner />;
    }
    
    switch (state) {
      case WordValidationState.VALID:
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case WordValidationState.INVALID:
        return <XCircle className="h-3 w-3 text-red-600" />;
      case WordValidationState.EMPTY:
      default:
        return null;
    }
  };

  const getInputClassName = (index: number) => {
    const state = wordValidation[index];
    const baseClass = "text-sm transition-all duration-200";
    
    if (focusedIndex === index) {
      return cn(baseClass, "ring-2 ring-blue-500");
    }
    
    switch (state) {
      case WordValidationState.VALID:
        return cn(baseClass, "border-green-500 bg-green-500/5");
      case WordValidationState.INVALID:
        return cn(baseClass, "border-red-500 bg-red-500/5");
      case WordValidationState.EMPTY:
      default:
        return cn(baseClass, "border-gray-300");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="relative">
            <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
              <span>#{i + 1}</span>
              {getValidationIcon(i)}
            </div>
            <Input
              value={words[i] || ''}
              onChange={(e) => handleWordChange(i, e.target.value)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              className={getInputClassName(i)}
              placeholder={`riječ ${i + 1}`}
              disabled={isLoading}
            />
          </div>
        ))}
      </div>
      
      {/* Debug info for learning */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Lista riječi učitana: {englishWordlist.length > 0 ? `${englishWordlist.length} riječi` : 'Nije učitano'}</div>
        <div>Valjane riječi: {Object.values(wordValidation).filter(v => v === WordValidationState.VALID).length}</div>
        <div>Nevaljane riječi: {Object.values(wordValidation).filter(v => v === WordValidationState.INVALID).length}</div>
      </div>
    </div>
  );
};

const KeyDisplay = ({
  label,
  value,
  isPrivate = false,
  canCopy = true
}: {
  label: string;
  value: string;
  isPrivate?: boolean;
  canCopy?: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(!isPrivate);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (canCopy && value && value !== 'Nema generirane vrijednosti') {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Copy failed silently
      }
    }
  };

  const displayValue = isVisible ? value : '•'.repeat(Math.min(value?.length || 0, 64));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {label}
          {isPrivate && !isVisible && (
            <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
              (Kliknite oko za prikaz)
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {isPrivate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
          {canCopy && value && value !== 'Nema generirane vrijednosti' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className={copied ? "text-green-600" : "text-muted-foreground hover:text-foreground"}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className={cn(
        "font-mono text-xs p-3 rounded border break-all transition-all duration-200",
        isPrivate && !isVisible && "bg-muted/50 text-muted-foreground",
        isPrivate && isVisible && "bg-red-500/5 border-red-500/20",
        !isPrivate && "bg-muted/20 border-muted",
        (!value || value === 'Nema generirane vrijednosti') && "text-red-500"
      )}>
        {displayValue || 'Nema generirane vrijednosti'}
      </div>
    </div>
  );
};

const BlockchainCard = ({
  name,
  icon,
  data,
  color
}: {
  name: string;
  icon: React.ReactNode;
  data: { path: string; privateKey: string; publicKey: string; address?: string };
  color: string;
}) => (
  <Card className="border-2 transition-all duration-200">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {icon}
        <span>{name}</span>
        <Badge variant="outline" className={`text-${color}-600 border-${color}-600`}>
          {data.path}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <KeyDisplay label="Privatni Ključ" value={data.privateKey} isPrivate={true} />
      <KeyDisplay label="Javni Ključ" value={data.publicKey} />
      {data.address && <KeyDisplay label="Adresa" value={data.address} />}
    </CardContent>
  </Card>
);

// Generate Ethereum address from public key
const generateEthereumAddress = (publicKeyHex: string): string => {
  try {
    if (!cryptoLibs?.keccak256 || !cryptoLibs?.Buffer) {
      return 'Nedostaju crypto biblioteke';
    }

    const publicKeyBuffer = cryptoLibs.Buffer.from(publicKeyHex, 'hex');
    const keyToHash = publicKeyBuffer[0] === 0x04 ? publicKeyBuffer.slice(1) : publicKeyBuffer;

    let hash: Buffer;
    try {
      // Try different keccak API patterns with safer type casting
      if (typeof cryptoLibs.keccak256 === 'function') {
        // First try: direct function call keccak256(data)
        try {
          hash = (cryptoLibs.keccak256 as (data: Buffer) => Buffer)(keyToHash);
        } catch {
          // Second try: keccak('keccak256').update(data).digest()
          const keccakConstructor = cryptoLibs.keccak256 as (algorithm: string) => {
            update: (data: Buffer) => { digest: () => Buffer };
          };
          hash = keccakConstructor('keccak256').update(keyToHash).digest();
        }
      } else {
        // Try accessing keccak256 property safely
        const keccakModule = cryptoLibs.keccak256 as Record<string, unknown>;
        if (typeof keccakModule.keccak256 === 'function') {
          hash = (keccakModule.keccak256 as (data: Buffer) => Buffer)(keyToHash);
        } else {
          // Constructor pattern fallback
          const keccakConstructor = cryptoLibs.keccak256 as unknown as (algorithm: string) => {
            update: (data: Buffer) => { digest: () => Buffer };
          };
          hash = keccakConstructor('keccak256').update(keyToHash).digest();
        }
      }
    } catch (error) {
      return 'keccak256 poziv neuspješan: ' + (error as Error).message;
    }

    const address = '0x' + hash.slice(-20).toString('hex');
    return address;
  } catch (error) {
    return 'Generiranje adrese neuspješno: ' + (error as Error).message;
  }
};

// Generate Tron address from public key
const generateTronAddress = (publicKeyHex: string): string => {
  try {
    if (!cryptoLibs?.keccak256 || !cryptoLibs?.Buffer || !cryptoLibs?.bs58check) {
      return 'Nedostaju crypto biblioteke';
    }

    const publicKeyBuffer = cryptoLibs.Buffer.from(publicKeyHex, 'hex');
    const keyToHash = publicKeyBuffer[0] === 0x04 ? publicKeyBuffer.slice(1) : publicKeyBuffer;

    let hash: Buffer;
    try {
      // Try different keccak API patterns with safer type casting
      if (typeof cryptoLibs.keccak256 === 'function') {
        // First try: direct function call keccak256(data)
        try {
          hash = (cryptoLibs.keccak256 as (data: Buffer) => Buffer)(keyToHash);
        } catch {
          // Second try: keccak('keccak256').update(data).digest()
          const keccakConstructor = cryptoLibs.keccak256 as (algorithm: string) => {
            update: (data: Buffer) => { digest: () => Buffer };
          };
          hash = keccakConstructor('keccak256').update(keyToHash).digest();
        }
      } else {
        // Try accessing keccak256 property safely
        const keccakModule = cryptoLibs.keccak256 as Record<string, unknown>;
        if (typeof keccakModule.keccak256 === 'function') {
          hash = (keccakModule.keccak256 as (data: Buffer) => Buffer)(keyToHash);
        } else {
          // Constructor pattern fallback
          const keccakConstructor = cryptoLibs.keccak256 as unknown as (algorithm: string) => {
            update: (data: Buffer) => { digest: () => Buffer };
          };
          hash = keccakConstructor('keccak256').update(keyToHash).digest();
        }
      }
    } catch (error) {
      return 'keccak256 poziv neuspješan: ' + (error as Error).message;
    }

    const last20Bytes = hash.slice(-20);
    const addressHex = '41' + last20Bytes.toString('hex');

    let address: string;
    try {
      if (cryptoLibs.bs58check.encode && typeof cryptoLibs.bs58check.encode === 'function') {
        address = cryptoLibs.bs58check.encode(cryptoLibs.Buffer.from(addressHex, 'hex'));
      } else {
        return 'bs58check enkoder nije pronađen';
      }
    } catch (error) {
      return 'bs58check enkodiranje neuspješno: ' + (error as Error).message;
    }

    return address;
  } catch (error) {
    return 'Generiranje adrese neuspješno: ' + (error as Error).message;
  }
};

const deriveKeysFromMnemonic = (mnemonic: string): DerivedKeys => {
  if (!cryptoLibs) {
    throw new Error('Crypto biblioteke nisu učitane');
  }

  try {
    const entropy = cryptoLibs.bip39.mnemonicToEntropy(mnemonic);
    const seed = cryptoLibs.bip39.mnemonicToSeedSync(mnemonic);

    const master = cryptoLibs.hdkey.fromMasterSeed(seed) as HDKeyInstance;

    // Ethereum derivation
    const ethPath = "m/44'/60'/0'/0/0";
    const ethChild = master.derivePath(ethPath) as HDKeyInstance;

    let ethPrivateKey = '';
    let ethPublicKey = '';

    if (ethChild.privateKey) {
      ethPrivateKey = ethChild.privateKey.toString('hex');
    }
    if (ethChild.publicKey) {
      ethPublicKey = ethChild.publicKey.toString('hex');
    }

    // Try alternative methods if direct access fails
    if (!ethPrivateKey && typeof ethChild.getPrivateKey === 'function') {
      try {
        const privKey = ethChild.getPrivateKey();
        ethPrivateKey = privKey ? privKey.toString('hex') : '';
      } catch {
        // Ignore error
      }
    }

    if (!ethPublicKey && typeof ethChild.getPublicKey === 'function') {
      try {
        const pubKey = ethChild.getPublicKey();
        ethPublicKey = pubKey ? pubKey.toString('hex') : '';
      } catch {
        // Ignore error
      }
    }

    if ((!ethPrivateKey || !ethPublicKey) && ethChild.getWallet) {
      try {
        const wallet = ethChild.getWallet();
        if (wallet && !ethPrivateKey) {
          ethPrivateKey = wallet.getPrivateKey ? wallet.getPrivateKey().toString('hex') : '';
        }
        if (wallet && !ethPublicKey) {
          ethPublicKey = wallet.getPublicKey ? wallet.getPublicKey().toString('hex') : '';
        }
      } catch {
        // Ignore error
      }
    }

    // Tron derivation
    const tronPath = "m/44'/195'/0'/0/0";
    const tronChild = master.derivePath(tronPath) as HDKeyInstance;

    let tronPrivateKey = '';
    let tronPublicKey = '';

    if (tronChild.privateKey) {
      tronPrivateKey = tronChild.privateKey.toString('hex');
    } else if (typeof tronChild.getPrivateKey === 'function') {
      try {
        const privKey = tronChild.getPrivateKey();
        tronPrivateKey = privKey ? privKey.toString('hex') : '';
      } catch {
        // Ignore error
      }
    } else if (tronChild.getWallet) {
      try {
        const wallet = tronChild.getWallet();
        tronPrivateKey = wallet?.getPrivateKey ? wallet.getPrivateKey().toString('hex') : '';
      } catch {
        // Ignore error
      }
    }

    if (tronChild.publicKey) {
      tronPublicKey = tronChild.publicKey.toString('hex');
    } else if (typeof tronChild.getPublicKey === 'function') {
      try {
        const pubKey = tronChild.getPublicKey();
        tronPublicKey = pubKey ? pubKey.toString('hex') : '';
      } catch {
        // Ignore error
      }
    } else if (tronChild.getWallet) {
      try {
        const wallet = tronChild.getWallet();
        tronPublicKey = wallet?.getPublicKey ? wallet.getPublicKey().toString('hex') : '';
      } catch {
        // Ignore error
      }
    }

    // Generate addresses
    const ethAddress = ethPublicKey ? generateEthereumAddress(ethPublicKey) : 'Nema javnog ključa';
    const tronAddress = tronPublicKey ? generateTronAddress(tronPublicKey) : 'Nema javnog ključa';

    const result = {
      entropy,
      seed: seed.toString('hex'),
      ethereum: {
        path: ethPath,
        privateKey: ethPrivateKey || 'Nema generiranog privatnog ključa',
        publicKey: ethPublicKey || 'Nema generiranog javnog ključa',
        address: ethAddress
      },
      tron: {
        path: tronPath,
        privateKey: tronPrivateKey || 'Nema generiranog privatnog ključa',
        publicKey: tronPublicKey || 'Nema generiranog javnog ključa',
        address: tronAddress
      }
    };

    return result;

  } catch (error) {
    throw error;
  }
};

export default function EnhancedMnemonicKDF() {
  const [mnemonic, setMnemonic] = useState('');
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [derivationResult, setDerivationResult] = useState<DerivedKeys | null>(null);
  const [wordValidation, setWordValidation] = useState<Record<number, WordValidationState>>({});
  const [showSteps, setShowSteps] = useState(true);
  const [validationSteps, setValidationSteps] = useState<ValidationStep[]>([]);
  const [error, setError] = useState<string>('');
  const [cryptoLoaded, setCryptoLoaded] = useState(false);
  const [cryptoLoading, setCryptoLoading] = useState(true);

  // Initialize crypto libraries
  useEffect(() => {
    initCrypto()
      .then(() => {
        setCryptoLoaded(true);
        setCryptoLoading(false);
        console.log('Crypto libraries loaded successfully');
      })
      .catch((err) => {
        setError('Neuspješno učitavanje crypto biblioteka: ' + err.message);
        setCryptoLoading(false);
        console.error('Crypto loading failed:', err);
      });
  }, []);

  // FIXED: Real-time word validation with proper state handling
  useEffect(() => {
    if (!cryptoLoaded || englishWordlist.length === 0) {
      // If crypto isn't loaded, mark all non-empty words as unknown/invalid
      const validation: Record<number, WordValidationState> = {};
      words.forEach((word, index) => {
        if (word.trim()) {
          validation[index] = WordValidationState.INVALID; // Can't validate without wordlist
        } else {
          validation[index] = WordValidationState.EMPTY;
        }
      });
      setWordValidation(validation);
      return;
    }

    // Proper validation with loaded wordlist
    const validation: Record<number, WordValidationState> = {};
    words.forEach((word, index) => {
      const trimmedWord = word.trim().toLowerCase();
      if (trimmedWord === '') {
        validation[index] = WordValidationState.EMPTY;
      } else if (englishWordlist.includes(trimmedWord)) {
        validation[index] = WordValidationState.VALID;
      } else {
        validation[index] = WordValidationState.INVALID;
      }
    });
    
    setWordValidation(validation);
    console.log('Word validation updated:', validation);
  }, [words, cryptoLoaded]);

  // Real-time mnemonic validation and derivation
  useEffect(() => {
    if (!cryptoLoaded || !cryptoLibs?.bip39) {
      return;
    }

    const mnemonicString = words.filter(w => w.trim()).join(' ');
    setMnemonic(mnemonicString);
    setError('');

    const steps: ValidationStep[] = [];

    if (mnemonicString.trim() === '') {
      steps.push({
        description: "Čekanje unosa mnemonika",
        result: "Unesite svoju 12-riječi frazu za oporavak",
        type: 'info',
        explanation: "Svaka riječ mora biti iz BIP-39 liste riječi"
      });
      setValidationSteps(steps);
      setDerivationResult(null);
      return;
    }

    const wordArray = mnemonicString.trim().split(/\s+/);

    steps.push({
      description: "1. Validacija Broja Riječi",
      calculation: `Uneseno: ${wordArray.length} riječi`,
      result: wordArray.length === 12 ? "✓ Ispravno (12 riječi)" : `✗ Neispravno (potrebno 12, uneseno ${wordArray.length})`,
      type: wordArray.length === 12 ? 'success' : 'error',
      explanation: "BIP-39 standard zahtijeva točno 12 riječi za 128-bitnu entropiju"
    });

    if (wordArray.length !== 12) {
      setValidationSteps(steps);
      setDerivationResult(null);
      return;
    }

    const invalidWords = wordArray.filter(word => {
      return !englishWordlist.includes(word.toLowerCase());
    });
    
    steps.push({
      description: "2. Validacija BIP-39 Liste Riječi",
      calculation: invalidWords.length > 0 ? `Neispravne riječi: ${invalidWords.join(', ')}` : "Sve riječi pronađene u BIP-39 listi",
      result: invalidWords.length === 0 ? "✓ Sve riječi valjane" : `✗ ${invalidWords.length} neispravnih riječi`,
      type: invalidWords.length === 0 ? 'success' : 'error',
      explanation: "Svaka riječ mora postojati u standardiziranoj BIP-39 engleskoj listi riječi"
    });

    if (invalidWords.length > 0) {
      setValidationSteps(steps);
      setDerivationResult(null);
      return;
    }

    // Validate full mnemonic
    const isValidMnemonic = cryptoLibs.bip39.validateMnemonic(mnemonicString);
    steps.push({
      description: "3. Validacija Kontrolne Sume",
      calculation: isValidMnemonic ? "Validacija kontrolne sume entropije..." : "Validacija kontrolne sume neuspješna",
      result: isValidMnemonic ? "✓ Kontrolna suma valjana" : "✗ Neispravna kontrolna suma",
      type: isValidMnemonic ? 'success' : 'error',
      explanation: "Zadnja riječ sadrži kontrolnu sumu koja validira cijeli mnemonik"
    });

    if (!isValidMnemonic) {
      setValidationSteps(steps);
      setDerivationResult(null);
      return;
    }

    steps.push({
      description: "4. Ekstraktiranje Entropije",
      calculation: "Pretvaranje mnemonika u 128-bitnu entropiju",
      result: "✓ Entropija ekstraktirana",
      type: 'calculation',
      explanation: "Mnemonične riječi se pretvaraju u binarni oblik i entropija se ekstraktira"
    });

    steps.push({
      description: "5. Generiranje Seed-a",
      calculation: "PBKDF2(mnemonik, 'mnemonic' + lozinka, 2048 iteracija)",
      result: "✓ 512-bitni seed generiran",
      type: 'calculation',
      explanation: "Koristi PBKDF2 s 2048 iteracija za generiranje kriptografski sigurnog seed-a"
    });

    steps.push({
      description: "6. HD Novčanik Izvođenje",
      calculation: "Izvođenje ključeva za Ethereum i Tron koristeći BIP-44 putanje",
      result: "✓ Ključevi izvedeni za Ethereum i Tron",
      type: 'success',
      explanation: "Svaki blockchain koristi jedinstvenu putanju izvođenja za generiranje izoliranih parova ključeva"
    });

    setValidationSteps(steps);

    // Perform actual key derivation
    try {
      const result = deriveKeysFromMnemonic(mnemonicString);
      setDerivationResult(result);
    } catch (err) {
      setError('Neuspješno izvođenje ključeva: ' + (err as Error).message);
      setDerivationResult(null);
    }
  }, [words, cryptoLoaded]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const pastedWords = text.trim().split(/\s+/).slice(0, 12);
      const newWords = [...Array(12)].map((_, i) => pastedWords[i] || '');
      setWords(newWords);
    } catch {
      // Paste failed silently
    }
  };

  const fillDemoMnemonic = () => {
    const demoWords = [
      'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon',
      'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'about'
    ];
    setWords(demoWords);
  };

  const clearAll = () => {
    setWords(Array(12).fill(''));
    setDerivationResult(null);
    setValidationSteps([]);
    setError('');
  };

  const isValid = cryptoLibs?.bip39 ? cryptoLibs.bip39.validateMnemonic(mnemonic) : false;
  const wordsEntered = words.filter(w => w.trim()).length;

  if (cryptoLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner />
              <span className="text-muted-foreground">Učitavanje crypto biblioteka...</span>
              <div className="text-xs text-muted-foreground">
                Ovo može potrajati nekoliko sekundi pri prvom učitavanju
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-3xl">
            <Key className="h-8 w-8 text-blue-600" />
            Funkcija Izvođenja Ključeva za Više Blockchain-ova
          </CardTitle>
          <p className="text-muted-foreground">
            Unesite svoju 12-riječi mnemoničku frazu za izvođenje kriptografskih ključeva za Ethereum i Tron
          </p>
        </CardHeader>
      </Card>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        <Button onClick={fillDemoMnemonic} className="transition-all duration-200 hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
          <Zap className="h-4 w-4" />
          Demo
        </Button>
        <Button onClick={handlePasteFromClipboard} variant="outline" className="transition-all duration-200 hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
          <Copy className="h-4 w-4" />
          Zalijepi
        </Button>
        <Button onClick={clearAll} variant="outline" className="transition-all duration-200 hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
          <XCircle className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Warning */}
      <Alert className="border-yellow-500/50 bg-yellow-500/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Sigurnosno Upozorenje:</strong> Nikada ne unosite svoj pravi mnemonik na bilo koju web stranicu. Ovaj alat je samo u edukacijske svrhe.
          Za stvarno izvođenje ključeva koristite offline alate ili hardverske novčanike.
        </AlertDescription>
      </Alert>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-500/50 bg-red-500/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Greška:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Mnemonic Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Mnemonička Fraza za Oporavak
            </div>
            <Badge variant={isValid ? "default" : "secondary"}>
              {wordsEntered}/12 riječi
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MnemonicWordInput
            words={words}
            onChange={setWords}
            wordValidation={wordValidation}
            isLoading={cryptoLoading}
          />
        </CardContent>
      </Card>

      {/* Validation Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Validacija u Stvarnom Vremenu
            </div>
            <div className="flex items-center gap-2">
              {isValid && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Valjan
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSteps(!showSteps)}
              >
                {showSteps ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        {showSteps && (
          <CardContent>
            <div className="space-y-3">
              {validationSteps.map((step, index) => (
                <ValidationStepDisplay key={index} step={step} />
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Key Derivation Results */}
      {derivationResult && (
        <>
          {/* Master Entropy and Seed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Glavni Kriptografski Materijal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <KeyDisplay label="128-bitna Entropija" value={derivationResult.entropy} />
              <KeyDisplay label="512-bitni Glavni Seed" value={derivationResult.seed} isPrivate={true} />
            </CardContent>
          </Card>

          {/* Blockchain Keys */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BlockchainCard
              name="Ethereum"
              icon={<EthereumLogo className="w-6 h-6 text-blue-600" />}
              data={derivationResult.ethereum}
              color="blue"
            />
            <BlockchainCard
              name="Tron"
              icon={<TronLogo className="w-6 h-6 text-red-600" />}
              data={derivationResult.tron}
              color="red"
            />
          </div>

          {/* Educational Information */}
          <Card className="border-2 border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-blue-800 dark:text-blue-200">
                  <span className="text-lg font-bold flex items-center justify-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Kako BIP-44 Izvođenje Ključeva Funkcionira
                  </span>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="font-semibold">Korak 1: Entropija</div>
                      <div className="text-xs text-blue-600 dark:text-blue-300">
                        12 riječi → 128 bitova entropije
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold">Korak 2: Glavni Seed</div>
                      <div className="text-xs text-blue-600 dark:text-blue-300">
                        PBKDF2 s 2048 iteracija
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold">Korak 3: HD Izvođenje</div>
                      <div className="text-xs text-blue-600 dark:text-blue-300">
                        BIP-44 putanje za svaki blockchain
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}