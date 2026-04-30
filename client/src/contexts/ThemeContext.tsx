import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light' | 'hc-black' | 'hc-yellow'
export type FontSize = 'normal' | 'large' | 'xl'
export type FontFamily = 'default' | 'dyslexic'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  fontSize: FontSize
  setFontSize: (s: FontSize) => void
  fontFamily: FontFamily
  setFontFamily: (f: FontFamily) => void
  simpleMode: boolean
  toggleSimpleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) || 'dark'
  )
  const [fontSize, setFontSizeState] = useState<FontSize>(
    () => (localStorage.getItem('fontSize') as FontSize) || 'large'
  )
  const [fontFamily, setFontFamilyState] = useState<FontFamily>(
    () => (localStorage.getItem('fontFamily') as FontFamily) || 'default'
  )
  const [simpleMode, setSimpleMode] = useState<boolean>(
    () => localStorage.getItem('simpleMode') !== 'false'
  )

  useEffect(() => {
    const el = document.documentElement
    el.className = [
      `theme-${theme}`,
      `font-size-${fontSize}`,
      fontFamily === 'dyslexic' ? 'font-dyslexic' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }, [theme, fontSize, fontFamily])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('theme', t)
  }
  const setFontSize = (s: FontSize) => {
    setFontSizeState(s)
    localStorage.setItem('fontSize', s)
  }
  const setFontFamily = (f: FontFamily) => {
    setFontFamilyState(f)
    localStorage.setItem('fontFamily', f)
  }
  const toggleSimpleMode = () => {
    setSimpleMode((prev) => {
      localStorage.setItem('simpleMode', String(!prev))
      return !prev
    })
  }

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, fontSize, setFontSize, fontFamily, setFontFamily, simpleMode, toggleSimpleMode }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
