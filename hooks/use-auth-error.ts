import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export function useAuthError() {
  const { logout } = useAuth()
  const { toast } = useToast()

  const handleAuthError = (error: any) => {
    if (error?.name === "AuthenticationError" || 
        error?.message?.includes("Authentication failed")) {
      // Don't show toast for authentication errors as they're handled by the auth context
      logout()
      return true
    }
    return false
  }

  return { handleAuthError }
}

export function useAuthErrorHandler() {
  const { handleAuthError } = useAuthError()

  const handleError = (error: any) => {
    if (!handleAuthError(error)) {
      // Handle other errors
      console.error("API Error:", error)
      throw error
    }
  }

  return { handleError }
} 