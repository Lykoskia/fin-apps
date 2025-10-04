// types/crypto.d.ts

declare module 'keccak' {
  function keccak256(data: Buffer | Uint8Array | string): Buffer;
  export { keccak256 };
}

declare module 'ethereumjs-wallet' {
  export interface EthereumHDKey {
    privateKey: Buffer;
    publicKey: Buffer;
    derivePath(path: string): EthereumHDKey;
  }
  
  export const hdkey: {
    fromMasterSeed(seed: Buffer): EthereumHDKey;
  };
}

declare module 'bs58check' {
  function encode(buffer: Buffer): string;
  function decode(string: string): Buffer;
  export { encode, decode };
  export default { encode, decode };
}

// Add these lines for the new dependencies
declare module 'crypto-browserify';
declare module 'ripemd160';