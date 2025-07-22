declare module "next-themes" {
  import type { ReactNode } from "react"

  interface ThemeProviderProps {
    children: ReactNode
    attribute?: string
    defaultTheme?: string
    enableSystem?: boolean
    disableTransitionOnChange?: boolean
  }

  interface UseThemeProps {
    theme: string
    setTheme: (theme: string) => void
    systemTheme?: string
    themes: string[]
  }

  export function ThemeProvider(props: ThemeProviderProps): JSX.Element
  export function useTheme(): UseThemeProps
}