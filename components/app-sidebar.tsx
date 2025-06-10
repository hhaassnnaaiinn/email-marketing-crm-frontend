"use client"

import { useState, useEffect } from "react"
import { BarChart3, Users, FileText, Send, Settings, LogOut, Mail, MessageSquare, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Contacts",
    url: "/dashboard/contacts",
    icon: Users,
  },
  {
    title: "Templates",
    url: "/dashboard/templates",
    icon: FileText,
  },
  {
    title: "Campaigns",
    url: "/dashboard/campaigns",
    icon: Send,
  },
  {
    title: "Single Email",
    url: "/dashboard/single-email",
    icon: MessageSquare,
  },
  {
    title: "Bulk Email",
    url: "/dashboard/bulk-email",
    icon: Mail,
  },
  {
    title: "Email History",
    url: "/dashboard/email-history",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const closeMobileMenu = () => {
    setIsMobileOpen(false)
  }

  const openMobileMenu = () => {
    setIsMobileOpen(true)
  }

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileMenu()
      }
    }

    if (isMobileOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isMobileOpen])

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobileMenu()
  }, [pathname])

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={openMobileMenu}
          className="h-10 w-10 p-0 shadow-md bg-background hover:bg-muted"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <div 
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-background border-r mobile-sidebar transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6" />
              <span className="font-semibold text-lg">Email CRM</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMobileMenu}
              className="h-8 w-8 p-0"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground mb-4">Navigation</div>
                {menuItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.url}
                    onClick={closeMobileMenu}
                    className={`mobile-nav-link flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${
                      pathname === item.url
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted active:bg-muted'
                    }`}
                    aria-current={pathname === item.url ? 'page' : undefined}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="p-4 border-t">
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground break-words">
                Signed in as {user?.name}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  logout()
                  closeMobileMenu()
                }} 
                className="w-full justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-2">
              <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="font-semibold text-base sm:text-lg">Email CRM</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs sm:text-sm">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.url}>
                        <Link href={item.url} className="text-sm sm:text-base">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="p-2 space-y-2">
              <div className="text-xs sm:text-sm text-muted-foreground break-words">Signed in as {user?.name}</div>
              <Button variant="outline" size="sm" onClick={logout} className="w-full justify-start text-xs sm:text-sm">
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
      </div>
    </>
  )
}
