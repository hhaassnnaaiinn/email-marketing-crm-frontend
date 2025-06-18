"use client"

import type React from "react"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Footer } from "@/components/footer"
import { AuthGuard } from "@/components/auth-guard"
import { ErrorBoundary } from "@/components/error-boundary"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-col min-h-screen">
              {/* Mobile top spacing to account for hamburger button */}
              <div className="lg:hidden h-16"></div>
              <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8">{children}</main>
              <Footer />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    </ErrorBoundary>
  )
}
