import { createContext, useContext } from "react"

export const AuthSessionContext = createContext("checking")

export function useAuthSession() {
  return useContext(AuthSessionContext)
}
