declare module "bwip-js" {
  type BwipRotation = "N" | "R" | "L" | "I"
  type BwipColor = string // Hex RGB, RRGGBB, CCMMYYKK, or CSS-style #RGB, #RRGGBB

  interface BwipOptions {
    bcid: string
    text: string
    scaleX?: number
    scaleY?: number
    scale?: number
    rotate?: BwipRotation
    binarytext?: boolean
    padding?: number
    paddingwidth?: number
    paddingheight?: number
    paddingtop?: number
    paddingleft?: number
    paddingright?: number
    paddingbottom?: number
    backgroundcolor?: BwipColor
    width?: number
    height?: number
    barcolor?: BwipColor
    textcolor?: BwipColor
    bordercolor?: BwipColor
  }

  type BwipCallback = (err: Error | string | null, png: Buffer | Uint8Array) => void

  interface BwipJS {
    toBuffer(options: BwipOptions, callback: BwipCallback): void
  }

  const bwip: BwipJS
  export default bwip
}

