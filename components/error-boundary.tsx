"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Don't log authentication errors as they're expected behavior
    if (error.name === "AuthenticationError" || error.message.includes("Authentication failed")) {
      return
    }
    console.error("Uncaught error:", error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  private handleLogout = () => {
    // Clear authentication data
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
  }

  public render() {
    if (this.state.hasError) {
      // Check if it's an authentication error
      const isAuthError = this.state.error?.name === "AuthenticationError" ||
                         this.state.error?.message?.includes("Authentication failed") ||
                         this.state.error?.message?.includes("401") ||
                         this.state.error?.message?.includes("403")

      if (isAuthError) {
        // For authentication errors, just redirect to login without showing error UI
        this.handleLogout()
        return null
      }

      // Default error fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-lg">Something went wrong</CardTitle>
              <CardDescription className="text-sm">
                An unexpected error occurred. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <Button onClick={this.handleRetry} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleLogout} className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
} 