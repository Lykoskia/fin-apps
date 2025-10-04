"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

import * as bitcoin from 'bitcoinjs-lib';
import { BIP32API } from 'bip32';
import { Keypair } from '@solana/web3.js';
import * as ed25519 from 'ed25519-hd-key';
import bs58 from 'bs58';

// SVG Logos
const BitcoinLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 4091.27 4091.73"
    className={className}
    fill="currentColor"
  >
    <path
      fillRule="nonzero"
      d="M4030.06 2540.77c-273.24,1096.01 -1383.32,1763.02 -2479.46,1489.71 -1095.68,-273.24 -1762.69,-1383.39 -1489.33,-2479.31 273.12,-1096.13 1383.2,-1763.19 2479,-1489.95 1096.06,273.24 1763.03,1383.51 1489.76,2479.57l0.02 -0.02z"
    />
    <path
      fill="white"
      fillRule="nonzero"
      d="M2947.77 1754.38c40.72,-272.26 -166.56,-418.61 -450,-516.24l91.95 -368.8 -224.5 -55.94 -89.51 359.09c-59.02,-14.72 -119.63,-28.59 -179.87,-42.34l90.16 -361.46 -224.36 -55.94 -92 368.68c-48.84,-11.12 -96.81,-22.11 -143.35,-33.69l0.26 -1.16 -309.59 -77.31 -59.72 239.78c0,0 166.56,38.18 163.05,40.53 90.91,22.69 107.35,82.87 104.62,130.57l-104.74 420.15c6.26,1.59 14.38,3.89 23.34,7.49 -7.49,-1.86 -15.46,-3.89 -23.73,-5.87l-146.81 588.57c-11.11,27.62 -39.31,69.07 -102.87,53.33 2.25,3.26 -163.17,-40.72 -163.17,-40.72l-111.46 256.98 292.15 72.83c54.35,13.63 107.61,27.89 160.06,41.3l-92.9 373.03 224.24 55.94 92 -369.07c61.26,16.63 120.71,31.97 178.91,46.43l-91.69 367.33 224.51 55.94 92.89 -372.33c382.82,72.45 670.67,43.24 791.83,-303.02 97.63,-278.78 -4.86,-439.58 -206.26,-544.44 146.69,-33.83 257.18,-130.31 286.64,-329.61l-0.07 -0.05zm-512.93 719.26c-69.38,278.78 -538.76,128.08 -690.94,90.29l123.28 -494.2c152.17,37.99 640.17,113.17 567.67,403.91zm69.43 -723.3c-63.29,253.58 -453.96,124.75 -580.69,93.16l111.77 -448.21c126.73,31.59 534.85,90.55 468.94,355.05l-0.02 0z"
    />
  </svg>
);

const EthereumLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 784.37 1277.39" className={className} fill="currentColor">
    <polygon
      fill="#343434"
      points="392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54 "
    />
    <polygon
      fill="#8C8C8C"
      points="392.07,0 -0,650.54 392.07,882.29 392.07,472.33 "
    />
    <polygon
      fill="#3C3C3B"
      points="392.07,956.52 387.24,962.41 387.24,1263.28 392.07,1277.38 784.37,724.89 "
    />
    <polygon
      fill="#8C8C8C"
      points="392.07,1277.38 392.07,956.52 -0,724.89 "
    />
    <polygon
      fill="#141414"
      points="392.07,882.29 784.13,650.54 392.07,472.33 "
    />
    <polygon fill="#393939" points="0,650.54 392.07,882.29 392.07,472.33 " />
  </svg>
);

const TronLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor">
    <path d="M61.55,19.28c-3-2.77-7.15-7-10.53-10l-.2-.14a3.82,3.82,0,0,0-1.11-.62l0,0C41.56,7,3.63-.09,2.89,0a1.4,1.4,0,0,0-.58.22L2.12.37a2.23,2.23,0,0,0-.52.84l-.05.13v.71l0,.11C5.82,14.05,22.68,53,26,62.14c.2.62.58,1.8,1.29,1.86h.16c.38,0,2-2.14,2-2.14S58.41,26.74,61.34,23a9.46,9.46,0,0,0,1-1.48A2.41,2.41,0,0,0,61.55,19.28ZM36.88,23.37,49.24,13.12l7.25,6.68Zm-4.8-.67L10.8,5.26l34.43,6.35ZM34,27.27l21.78-3.51-24.9,30ZM7.91,7,30.3,26,27.06,53.78Z" />
  </svg>
);

const SolanaLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 397.7 311.7" className={className}>
    <defs>
      <linearGradient
        id="sol_grad"
        gradientUnits="userSpaceOnUse"
        x1="360.8791"
        y1="-37.4553"
        x2="141.213"
        y2="383.2936"
      >
        <stop offset="0" style={{ stopColor: '#00FFA3' }} />
        <stop offset="1" style={{ stopColor: '#DC1FFF' }} />
      </linearGradient>
    </defs>
    <path
      fill="url(#sol_grad)"
      d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5 c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"
    />
    <path
      fill="url(#sol_grad)"
      d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5 c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"
    />
    <path
      fill="url(#sol_grad)"
      d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4 c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"
    />
  </svg>
);

// Crypto libraries interface
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
  (algorithm: string): { update: (data: Buffer) => { digest: () => Buffer } };
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
  bip32: BIP32API;
  bitcoin: typeof bitcoin;
  ed25519: typeof ed25519;
  bs58: typeof bs58;
  ecc: any; // tiny-secp256k1
}

let cryptoLibs: CryptoLibs | null = null;
let englishWordlist: string[] = [];

const initCrypto = async (): Promise<boolean> => {
  try {
    const libs: Partial<CryptoLibs> = {
      Buffer: (await import('buffer')).Buffer,
    };
    try {
      libs.bip39 = await import('bip39');
      if (
        libs.bip39.wordlists &&
        typeof libs.bip39.wordlists === 'object' &&
        !Array.isArray(libs.bip39.wordlists)
      ) {
        const wordlists = libs.bip39.wordlists as {
          english?: string[];
          EN?: string[];
          [key: string]: string[] | undefined;
        };
        englishWordlist = wordlists.english || wordlists.EN || [];
      } else if (Array.isArray(libs.bip39.wordlists)) {
        englishWordlist = libs.bip39.wordlists;
      }
      if (englishWordlist.length === 0)
        throw new Error('Cannot find English wordlist in bip39 library');
    } catch (error) {
      throw new Error('Cannot load bip39: ' + (error as Error).message);
    }
    try {
      libs.hdkey = (await import('ethereumjs-wallet')).hdkey;
    } catch {
      throw new Error('Cannot load ethereumjs-wallet');
    }
    try {
      const keccakModule = await import('keccak');
      libs.keccak256 = (keccakModule.default || keccakModule) as KeccakFunction;
    } catch {
      throw new Error('Cannot load keccak');
    }
    try {
      const bs58checkModule = await import('bs58check');
      libs.bs58check = (bs58checkModule.default ||
        bs58checkModule) as BS58CheckFunction;
    } catch {
      throw new Error('Cannot load bs58check');
    }
    try {
      libs.ecc = await import('@bitcoin-js/tiny-secp256k1-asmjs');
      const bip32Factory = (await import('bip32')).default;
      libs.bip32 = bip32Factory(libs.ecc);
      libs.bitcoin = await import('bitcoinjs-lib');
      libs.bitcoin.initEccLib(libs.ecc);
    } catch (e) {
      throw new Error(
        'Cannot load bip32, bitcoinjs-lib, or @bitcoin-js/tiny-secp256k1-asmjs: ' +
          (e as Error).message,
      );
    }
    try {
      libs.ed25519 = await import('ed25519-hd-key');
      libs.bs58 = (await import('bs58')).default;
    } catch {
      throw new Error('Cannot load solana dependencies');
    }

    if (typeof window !== 'undefined') {
      (window as any).Buffer = libs.Buffer!;
    }
    cryptoLibs = libs as CryptoLibs;
    return true;
  } catch (error) {
    console.error('Crypto initialization error:', error);
    throw error;
  }
};

enum WordValidationState {
  EMPTY = 'empty',
  INVALID = 'invalid',
  VALID = 'valid',
}
interface ValidationStep {
  description: string;
  calculation?: string;
  result?: string;
  type: 'info' | 'calculation' | 'success' | 'error';
  explanation?: string;
}
interface BtcKeys {
  path: string;
  privateKey: string;
  publicKey: string;
  address: string;
}
interface DerivedKeys {
  entropy: string;
  seed: string;
  ethereum: BtcKeys;
  tron: BtcKeys;
  legacy: BtcKeys;
  segwit: BtcKeys;
  taproot: BtcKeys;
  solana: BtcKeys;
}

const ValidationStepDisplay = ({ step }: { step: ValidationStep }) => (
  <div
    className={cn(
      'p-3 rounded-lg border-l-4 space-y-2',
      step.type === 'success' && 'border-l-green-500 bg-green-500/5',
      step.type === 'error' && 'border-l-red-500 bg-red-500/5',
      step.type === 'calculation' && 'border-l-blue-500 bg-blue-500/5',
      step.type === 'info' && 'border-l-gray-400 bg-gray-500/5',
    )}
  >
    <div className="font-medium text-sm text-foreground">
      {step.description}
    </div>
    {step.explanation && (
      <div className="text-xs text-muted-foreground italic">
        {step.explanation}
      </div>
    )}
    {step.calculation && (
      <div className="font-mono text-xs text-muted-foreground bg-muted p-2 rounded border">
        {step.calculation}
      </div>
    )}
    {step.result && (
      <div className="font-medium text-sm text-foreground">→ {step.result}</div>
    )}
  </div>
);

const MnemonicWordInput = ({
  words,
  onChange,
  wordValidation,
  isLoading,
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

  const handlePaste = (
    event: React.ClipboardEvent<HTMLInputElement>,
    startIndex: number,
  ) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text');
    const pastedWords = pastedText.trim().split(/\s+/);
    const newWords = [...words];
    for (let i = 0; i < pastedWords.length; i++) {
      const targetIndex = startIndex + i;
      if (targetIndex < 12) {
        newWords[targetIndex] = pastedWords[i].toLowerCase().trim();
      }
    }
    onChange(newWords);
  };

  const getValidationIcon = (index: number) => {
    if (isLoading) return <LoadingSpinner />;
    switch (wordValidation[index]) {
      case WordValidationState.VALID:
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case WordValidationState.INVALID:
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };
  const getInputClassName = (index: number) => {
    const baseClass = 'text-sm transition-all duration-200';
    if (focusedIndex === index) return cn(baseClass, 'ring-2 ring-blue-500');
    switch (wordValidation[index]) {
      case WordValidationState.VALID:
        return cn(baseClass, 'border-green-500 bg-green-500/5');
      case WordValidationState.INVALID:
        return cn(baseClass, 'border-red-500 bg-red-500/5');
      default:
        return cn(baseClass, 'border-gray-300');
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
              onPaste={(e) => handlePaste(e, i)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              className={getInputClassName(i)}
              placeholder={`riječ ${i + 1}`}
              disabled={isLoading}
            />
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <div>
          Lista riječi učitana:{' '}
          {englishWordlist.length > 0
            ? `${englishWordlist.length} riječi`
            : 'Nije učitano'}
        </div>
        <div>
          Valjane riječi:{' '}
          {
            Object.values(wordValidation).filter(
              (v) => v === WordValidationState.VALID,
            ).length
          }
        </div>
        <div>
          Nevaljane riječi:{' '}
          {
            Object.values(wordValidation).filter(
              (v) => v === WordValidationState.INVALID,
            ).length
          }
        </div>
      </div>
    </div>
  );
};

const KeyDisplay = ({
  label,
  value,
  isPrivate = false,
  canCopy = true,
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
        /* silent fail */
      }
    }
  };
  const displayValue = isVisible
    ? value
    : '•'.repeat(Math.min(value?.length || 0, 64));
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
              {isVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
          {canCopy && value && value !== 'Nema generirane vrijednosti' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className={
                copied
                  ? 'text-green-600'
                  : 'text-muted-foreground hover:text-foreground'
              }
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div
        className={cn(
          'font-mono text-xs p-3 rounded border break-all transition-all duration-200',
          isPrivate && !isVisible && 'bg-muted/50 text-muted-foreground',
          isPrivate && isVisible && 'bg-red-500/5 border-red-500/20',
          !isPrivate && 'bg-muted/20 border-muted',
          (!value || value === 'Nema generirane vrijednosti') &&
            'text-red-500',
        )}
      >
        {displayValue || 'Nema generirane vrijednosti'}
      </div>
    </div>
  );
};

const BlockchainCard = ({
  name,
  icon,
  data,
  color,
}: {
  name: string;
  icon: React.ReactNode;
  data: BtcKeys;
  color: string;
}) => (
  <Card className="border-2 transition-all duration-200">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {icon}
        <span>{name}</span>
        <Badge
          variant="outline"
          className={`text-${color}-600 border-${color}-600`}
        >
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

const generateEthereumAddress = (publicKeyHex: string): string => {
  try {
    if (!cryptoLibs?.keccak256 || !cryptoLibs?.Buffer)
      return 'Nedostaju crypto biblioteke';
    const publicKeyBuffer = cryptoLibs.Buffer.from(publicKeyHex, 'hex');
    const keyToHash =
      publicKeyBuffer.length === 65
        ? publicKeyBuffer.slice(1)
        : publicKeyBuffer;
    const hash = (cryptoLibs.keccak256 as any)('keccak256')
      .update(keyToHash)
      .digest();
    return '0x' + hash.slice(-20).toString('hex');
  } catch (error) {
    return 'Generiranje adrese neuspješno: ' + (error as Error).message;
  }
};

const generateTronAddress = (publicKeyHex: string): string => {
  try {
    if (!cryptoLibs?.keccak256 || !cryptoLibs?.Buffer || !cryptoLibs?.bs58check)
      return 'Nedostaju crypto biblioteke';
    const publicKeyBuffer = cryptoLibs.Buffer.from(publicKeyHex, 'hex');
    const keyToHash =
      publicKeyBuffer.length === 65
        ? publicKeyBuffer.slice(1)
        : publicKeyBuffer;
    const hash = (cryptoLibs.keccak256 as any)('keccak256')
      .update(keyToHash)
      .digest();
    const addressHex = '41' + hash.slice(-20).toString('hex');
    return cryptoLibs.bs58check.encode(
      cryptoLibs.Buffer.from(addressHex, 'hex'),
    );
  } catch (error) {
    return 'Generiranje adrese neuspješno: ' + (error as Error).message;
  }
};

const generateBitcoinLegacyAddress = (publicKeyHex: string): string => {
  try {
    if (!cryptoLibs?.bitcoin || !cryptoLibs?.Buffer) {
      return 'Nedostaje bitcoinjs-lib';
    }
    const { bitcoin, Buffer } = cryptoLibs;
    const pubKeyBuffer = Buffer.from(publicKeyHex, 'hex');
    const { address } = bitcoin.payments.p2pkh({ pubkey: pubKeyBuffer });
    return address || 'Generiranje adrese neuspješno';
  } catch (error) {
    return 'Generiranje Legacy adrese neuspješno: ' + (error as Error).message;
  }
};

const generateBitcoinSegwitAddress = (publicKeyHex: string): string => {
  try {
    if (!cryptoLibs?.bitcoin || !cryptoLibs?.Buffer) {
      return 'Nedostaje bitcoinjs-lib';
    }
    const { bitcoin, Buffer } = cryptoLibs;
    const pubKeyBuffer = Buffer.from(publicKeyHex, 'hex');
    const { address } = bitcoin.payments.p2wpkh({ pubkey: pubKeyBuffer });
    return address || 'Generiranje adrese neuspješno';
  } catch (error) {
    return 'Generiranje SegWit adrese neuspješno: ' + (error as Error).message;
  }
};

const generateBitcoinTaprootAddress = (publicKeyHex: string): string => {
  try {
    if (!cryptoLibs?.bitcoin || !cryptoLibs?.Buffer) {
      return 'Nedostaje bitcoinjs-lib';
    }
    const { bitcoin, Buffer } = cryptoLibs;
    const pubKeyBuffer = Buffer.from(publicKeyHex, 'hex');
    const internalPubkey = pubKeyBuffer.slice(1);
    const { address } = bitcoin.payments.p2tr({ internalPubkey });
    return address || 'Generiranje adrese neuspješno';
  } catch (error) {
    return 'Generiranje Taproot adrese neuspješno: ' + (error as Error).message;
  }
};

const deriveKeysFromMnemonic = (mnemonic: string): DerivedKeys => {
  if (!cryptoLibs) throw new Error('Crypto biblioteke nisu učitane');
  const { bip39, hdkey, bip32, Buffer, ed25519, bs58, ecc } = cryptoLibs;
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  // EVM and Tron Derivation
  const evmMaster = hdkey.fromMasterSeed(seed) as HDKeyInstance;
  const deriveEvm = (path: string) => {
    const child = evmMaster.derivePath(path) as HDKeyInstance;
    const rawPrivateKey = child.privateKey || child.getPrivateKey?.();
    const rawPublicKey = child.publicKey || child.getPublicKey?.();
    let privateKey = rawPrivateKey
      ? Buffer.from(rawPrivateKey).toString('hex')
      : '';
    let publicKey = rawPublicKey
      ? Buffer.from(rawPublicKey).toString('hex')
      : '';
    if ((!privateKey || !publicKey) && child.getWallet) {
      const wallet = child.getWallet();
      if (!privateKey) {
        const walletPrivKey = wallet?.getPrivateKey?.();
        if (walletPrivKey)
          privateKey = Buffer.from(walletPrivKey).toString('hex');
      }
      if (!publicKey) {
        const walletPubKey = wallet?.getPublicKey?.();
        if (walletPubKey)
          publicKey = Buffer.from(walletPubKey).toString('hex');
      }
    }
    return { privateKey, publicKey };
  };

  const ethPath = "m/44'/60'/0'/0/0";
  const { privateKey: ethPrivateKey, publicKey: ethPublicKey } =
    deriveEvm(ethPath);
  const ethAddress = ethPublicKey
    ? generateEthereumAddress(ethPublicKey)
    : 'Nema javnog ključa';

  const tronPath = "m/44'/195'/0'/0/0";
  const { privateKey: tronPrivateKey, publicKey: tronPublicKey } =
    deriveEvm(tronPath);
  const tronAddress = tronPublicKey
    ? generateTronAddress(tronPublicKey)
    : 'Nema javnog ključa';

  // Bitcoin Derivations
  const btcMaster = bip32.fromSeed(seed);

  // BIP-44 for Legacy (1...)
  const legacyPath = "m/44'/0'/0'/0/0";
  const legacyChild = btcMaster.derivePath(legacyPath);
  const legacyPrivateKey = legacyChild.privateKey
    ? Buffer.from(legacyChild.privateKey).toString('hex')
    : 'Greška';
  const legacyPublicKey = Buffer.from(legacyChild.publicKey).toString('hex');
  const legacyAddress = legacyPublicKey
    ? generateBitcoinLegacyAddress(legacyPublicKey)
    : 'Nema javnog ključa';

  // BIP-84 for SegWit (bc1q...)
  const segwitPath = "m/84'/0'/0'/0/0";
  const segwitChild = btcMaster.derivePath(segwitPath);
  const segwitPrivateKey = segwitChild.privateKey
    ? Buffer.from(segwitChild.privateKey).toString('hex')
    : 'Greška';
  const segwitPublicKey = Buffer.from(segwitChild.publicKey).toString('hex');
  const segwitAddress = segwitPublicKey
    ? generateBitcoinSegwitAddress(segwitPublicKey)
    : 'Nema javnog ključa';

  // BIP-86 for Taproot (bc1p...)
  const taprootPath = "m/86'/0'/0'/0/0";
  const taprootChild = btcMaster.derivePath(taprootPath);
  let taprootPrivateKey = taprootChild.privateKey;
  let taprootPublicKey = taprootChild.publicKey;

  if (taprootPublicKey[0] === 3 && taprootPrivateKey) {
    taprootPrivateKey = ecc.privateNegate(taprootPrivateKey);
    taprootPublicKey = Buffer.from(ecc.pointFromScalar(taprootPrivateKey, true));
  }
  const taprootPrivateKeyHex = taprootPrivateKey
    ? Buffer.from(taprootPrivateKey).toString('hex')
    : 'Greška';
  const taprootPublicKeyHex = Buffer.from(taprootPublicKey).toString('hex');
  const taprootAddress = generateBitcoinTaprootAddress(taprootPublicKeyHex);

  // Solana Derivation (SLIP-0010)
  // --- FIX --- Use the correct derivation path for main Solana accounts
  const solanaPath = "m/44'/501'/0'";
  const solanaSeed = ed25519.derivePath(solanaPath, seed.toString('hex')).key;
  const solanaKeyPair = Keypair.fromSeed(solanaSeed);
  const solanaAddress = solanaKeyPair.publicKey.toBase58();
  const solanaPrivateKey = bs58.encode(solanaKeyPair.secretKey);

  return {
    entropy: bip39.mnemonicToEntropy(mnemonic),
    seed: seed.toString('hex'),
    ethereum: {
      path: ethPath,
      privateKey: ethPrivateKey || 'Greška',
      publicKey: ethPublicKey || 'Greška',
      address: ethAddress,
    },
    tron: {
      path: tronPath,
      privateKey: tronPrivateKey || 'Greška',
      publicKey: tronPublicKey || 'Greška',
      address: tronAddress,
    },
    legacy: {
      path: legacyPath,
      privateKey: legacyPrivateKey,
      publicKey: legacyPublicKey,
      address: legacyAddress,
    },
    segwit: {
      path: segwitPath,
      privateKey: segwitPrivateKey,
      publicKey: segwitPublicKey,
      address: segwitAddress,
    },
    taproot: {
      path: taprootPath,
      privateKey: taprootPrivateKeyHex,
      publicKey: taprootPublicKeyHex,
      address: taprootAddress,
    },
    solana: {
      path: solanaPath,
      privateKey: solanaPrivateKey,
      publicKey: solanaAddress,
      address: solanaAddress,
    },
  };
};

export default function EnhancedMnemonicKDF() {
  const [mnemonic, setMnemonic] = useState('');
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [derivationResult, setDerivationResult] = useState<DerivedKeys | null>(
    null,
  );
  const [wordValidation, setWordValidation] = useState<
    Record<number, WordValidationState>
  >({});
  const [showSteps, setShowSteps] = useState(true);
  const [validationSteps, setValidationSteps] = useState<ValidationStep[]>([]);
  const [error, setError] = useState<string>('');
  const [cryptoLoaded, setCryptoLoaded] = useState(false);
  const [cryptoLoading, setCryptoLoading] = useState(true);

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

  useEffect(() => {
    if (!cryptoLoaded || englishWordlist.length === 0) {
      const validation: Record<number, WordValidationState> = {};
      words.forEach((word, index) => {
        validation[index] = word.trim()
          ? WordValidationState.INVALID
          : WordValidationState.EMPTY;
      });
      setWordValidation(validation);
      return;
    }
    const validation: Record<number, WordValidationState> = {};
    words.forEach((word, index) => {
      const trimmedWord = word.trim().toLowerCase();
      if (trimmedWord === '') validation[index] = WordValidationState.EMPTY;
      else if (englishWordlist.includes(trimmedWord))
        validation[index] = WordValidationState.VALID;
      else validation[index] = WordValidationState.INVALID;
    });
    setWordValidation(validation);
  }, [words, cryptoLoaded]);

  useEffect(() => {
    if (!cryptoLoaded || !cryptoLibs?.bip39) return;
    const mnemonicString = words.filter((w) => w.trim()).join(' ');
    setMnemonic(mnemonicString);
    setError('');
    const steps: ValidationStep[] = [];
    if (mnemonicString.trim() === '') {
      steps.push({
        description: 'Čekanje unosa mnemonika',
        result: 'Unesite svoju 12-riječi frazu za oporavak',
        type: 'info',
        explanation: 'Svaka riječ mora biti iz BIP-39 liste riječi',
      });
      setValidationSteps(steps);
      setDerivationResult(null);
      return;
    }
    const wordArray = mnemonicString.trim().split(/\s+/);
    steps.push({
      description: '1. Validacija Broja Riječi',
      calculation: `Uneseno: ${wordArray.length} riječi`,
      result:
        wordArray.length === 12
          ? '✓ Ispravno (12 riječi)'
          : `✗ Neispravno (potrebno 12, uneseno ${wordArray.length})`,
      type: wordArray.length === 12 ? 'success' : 'error',
      explanation:
        'BIP-39 standard zahtijeva točno 12 riječi za 128-bitnu entropiju',
    });
    if (wordArray.length !== 12) {
      setValidationSteps(steps);
      setDerivationResult(null);
      return;
    }
    const invalidWords = wordArray.filter(
      (word) => !englishWordlist.includes(word.toLowerCase()),
    );
    steps.push({
      description: '2. Validacija BIP-39 Liste Riječi',
      calculation:
        invalidWords.length > 0
          ? `Neispravne riječi: ${invalidWords.join(', ')}`
          : 'Sve riječi pronađene u BIP-39 listi',
      result:
        invalidWords.length === 0
          ? '✓ Sve riječi valjane'
          : `✗ ${invalidWords.length} neispravnih riječi`,
      type: invalidWords.length === 0 ? 'success' : 'error',
      explanation:
        'Svaka riječ mora postojati u standardiziranoj BIP-39 engleskoj listi riječi',
    });
    if (invalidWords.length > 0) {
      setValidationSteps(steps);
      setDerivationResult(null);
      return;
    }
    const isValidMnemonic = cryptoLibs.bip39.validateMnemonic(mnemonicString);
    steps.push({
      description: '3. Validacija Kontrolne Sume',
      calculation: isValidMnemonic
        ? 'Validacija kontrolne sume entropije...'
        : 'Validacija kontrolne sume neuspješna',
      result: isValidMnemonic
        ? '✓ Kontrolna suma valjana'
        : '✗ Neispravna kontrolna suma',
      type: isValidMnemonic ? 'success' : 'error',
      explanation:
        'Zadnja riječ sadrži kontrolnu sumu koja validira cijeli mnemonik',
    });
    if (!isValidMnemonic) {
      setValidationSteps(steps);
      setDerivationResult(null);
      return;
    }
    steps.push({
      description: '4. Ekstraktiranje Entropije',
      calculation: 'Pretvaranje mnemonika u 128-bitnu entropiju',
      result: '✓ Entropija ekstraktirana',
      type: 'calculation',
      explanation:
        'Mnemonične riječi se pretvaraju u binarni oblik i entropija se ekstraktira',
    });
    steps.push({
      description: '5. Generiranje Seed-a',
      calculation: "PBKDF2(mnemonik, 'mnemonic' + lozinka, 2048 iteracija)",
      result: '✓ 512-bitni seed generiran',
      type: 'calculation',
      explanation:
        'Koristi PBKDF2 s 2048 iteracija za generiranje kriptografski sigurnog seed-a',
    });
    steps.push({
      description: '6. HD Novčanik Izvođenje',
      calculation:
        'Izvođenje ključeva za podržane blockchaine koristeći BIP-44 putanje',
      result: '✓ Ključevi izvedeni',
      type: 'success',
      explanation:
        'Svaki blockchain koristi jedinstvenu putanju izvođenja za generiranje izoliranih parova ključeva',
    });
    setValidationSteps(steps);
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
      /* silent fail */
    }
  };
  const fillDemoMnemonic = () =>
    setWords([
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'about',
    ]);
  const clearAll = () => {
    setWords(Array(12).fill(''));
    setDerivationResult(null);
    setValidationSteps([]);
    setError('');
  };
  const isValid = cryptoLibs?.bip39
    ? cryptoLibs.bip39.validateMnemonic(mnemonic)
    : false;
  const wordsEntered = words.filter((w) => w.trim()).length;

  if (cryptoLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner />
              <span className="text-muted-foreground">
                Učitavanje crypto biblioteka...
              </span>
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
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-3xl">
            <Key className="h-8 w-8 text-blue-600" />
            Funkcija Izvođenja Ključeva za Više Blockchain-ova
          </CardTitle>
          <p className="text-muted-foreground">
            Unesite svoju 12-riječi mnemoničku frazu za izvođenje kriptografskih
            ključeva za Ethereum, Tron, Bitcoin i BNB
          </p>
        </CardHeader>
      </Card>
      <div className="flex justify-center gap-4">
        <Button
          onClick={fillDemoMnemonic}
          className="transition-all duration-200 hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500"
        >
          <Zap className="h-4 w-4" />
          Demo
        </Button>
        <Button
          onClick={handlePasteFromClipboard}
          variant="outline"
          className="transition-all duration-200 hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500"
        >
          <Copy className="h-4 w-4" />
          Zalijepi
        </Button>
        <Button
          onClick={clearAll}
          variant="outline"
          className="transition-all duration-200 hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500"
        >
          <XCircle className="h-4 w-4" />
          Reset
        </Button>
      </div>
      <Alert className="border-yellow-500/50 bg-yellow-500/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Sigurnosno Upozorenje:</strong> Nikada ne unosite svoj pravi
          mnemonik na bilo koju web stranicu. Ovaj alat je samo u edukacijske
          svrhe. Za stvarno izvođenje ključeva koristite offline alate ili
          hardverske novčanike.
        </AlertDescription>
      </Alert>
      {error && (
        <Alert className="border-red-500/50 bg-red-500/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Greška:</strong> {error}
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Mnemonička Fraza za Oporavak
            </div>
            <Badge variant={isValid ? 'default' : 'secondary'}>
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
                {showSteps ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
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
      {derivationResult && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Glavni Kriptografski Materijal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <KeyDisplay
                label="128-bitna Entropija"
                value={derivationResult.entropy}
              />
              <KeyDisplay
                label="512-bitni Glavni Seed"
                value={derivationResult.seed}
                isPrivate={true}
              />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BlockchainCard
              name="Bitcoin (Legacy)"
              icon={<BitcoinLogo className="w-6 h-6 text-orange-500" />}
              data={derivationResult.legacy}
              color="orange"
            />
            <BlockchainCard
              name="Bitcoin (SegWit)"
              icon={<BitcoinLogo className="w-6 h-6 text-orange-500" />}
              data={derivationResult.segwit}
              color="orange"
            />
            <BlockchainCard
              name="Bitcoin (Taproot)"
              icon={<BitcoinLogo className="w-6 h-6 text-orange-500" />}
              data={derivationResult.taproot}
              color="orange"
            />
            <BlockchainCard
              name="Ethereum"
              icon={<EthereumLogo className="w-6 h-6 text-blue-600" />}
              data={derivationResult.ethereum}
              color="blue"
            />
            <BlockchainCard
              name="Solana"
              icon={<SolanaLogo className="w-6 h-6" />}
              data={derivationResult.solana}
              color="purple"
            />
            <BlockchainCard
              name="Tron"
              icon={<TronLogo className="w-6 h-6 text-red-600" />}
              data={derivationResult.tron}
              color="red"
            />
          </div>
          <Card className="border-2 border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-blue-800 dark:text-blue-200">
                  <span className="text-lg font-bold flex items-center justify-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Kako BIP Izvođenje Ključeva Funkcionira
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
                        Jedinstvene putanje za svaki blockchain
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