"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      
      // Set up auth error handler for API client
      apiClient.setAuthErrorHandler(() => {
        // Clear state and redirect without throwing errors
        setUser(null)
        setToken(null)
        apiClient.clearToken()
        // Use setTimeout to avoid navigation during render
        setTimeout(() => {
          router.push("/login")
        }, 0)
      })
    }
    setLoading(false)
  }, [router])

  const login = async (email: string, password: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error("Login failed")
    }

    const data = await response.json()
    setToken(data.token)
    setUser(data.user)
    apiClient.updateToken(data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
    
    // Set up auth error handler for API client
    apiClient.setAuthErrorHandler(() => {
      // Clear state and redirect without throwing errors
      setUser(null)
      setToken(null)
      apiClient.clearToken()
      // Use setTimeout to avoid navigation during render
      setTimeout(() => {
        router.push("/login")
      }, 0)
    })
  }

  const register = async (email: string, password: string, name: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    })

    if (!response.ok) {
      throw new Error("Registration failed")
    }

    const data = await response.json()
    setToken(data.token)
    setUser(data.user)
    apiClient.updateToken(data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
    
    // Set up auth error handler for API client
    apiClient.setAuthErrorHandler(() => {
      // Clear state and redirect without throwing errors
      setUser(null)
      setToken(null)
      apiClient.clearToken()
      // Use setTimeout to avoid navigation during render
      setTimeout(() => {
        router.push("/login")
      }, 0)
    })
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    apiClient.clearToken()
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
