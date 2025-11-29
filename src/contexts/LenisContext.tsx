import { createContext, useContext, ReactNode, RefObject } from 'react'
import type { LenisRef } from 'lenis/react'

interface LenisContextType {
  lenisRef: RefObject<LenisRef | null> | null
}

export const LenisContext = createContext<LenisContextType>({ lenisRef: null })

export const useLenis = () => {
  const context = useContext(LenisContext)
  // Return context even if null to avoid errors when used outside provider
  return context || { lenisRef: null }
}

interface LenisProviderProps {
  lenisRef: RefObject<LenisRef | null>
  children: ReactNode
}

export const LenisProvider = ({ lenisRef, children }: LenisProviderProps) => {
  return (
    <LenisContext.Provider value={{ lenisRef }}>
      {children}
    </LenisContext.Provider>
  )
}

