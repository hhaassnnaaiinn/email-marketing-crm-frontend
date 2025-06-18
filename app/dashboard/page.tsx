"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileText, Send, TrendingUp, Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useAuthError } from "@/hooks/use-auth-error"
import Link from "next/link"

interface Stats {
  contacts: number
  templates: number
  campaigns: number
  sentEmails: number
  emailHistory: {
    sent: number
    failed: number
    total: number
  }
}

interface RecentActivity {
  type: string
  message: string
  timestamp: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    contacts: 0,
    templates: 0,
    campaigns: 0,
    sentEmails: 0,
    emailHistory: { sent: 0, failed: 0, total: 0 },
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { logout } = useAuth()
  const { toast } = useToast()
  const { handleAuthError } = useAuthError()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null)
        const [contacts, templates, campaigns, sentEmails, failedEmails, totalEmails] = await Promise.all([
          apiClient.getContacts(),
          apiClient.getTemplates(),
          apiClient.getCampaigns(),
          apiClient.getEmailHistory({ status: "sent" }),
          apiClient.getEmailHistory({ status: "failed" }),
          apiClient.getEmailHistory(),
        ])

        setStats({
          contacts: contacts.length || 0,
          templates: templates.length || 0,
          campaigns: campaigns.length || 0,
          sentEmails: campaigns.filter((c: any) => c.status === "sent").length || 0,
          emailHistory: {
            sent: sentEmails.pagination?.totalItems || 0,
            failed: failedEmails.pagination?.totalItems || 0,
            total: totalEmails.pagination?.totalItems || 0,
          },
        })

        // Generate recent activity from total email history
        const activity = totalEmails.emails?.slice(0, 5).map((email: any) => ({
          type: email.status,
          message: `Email "${email.subject}" ${email.status === "sent" ? "sent to" : "failed for"} ${email.to}`,
          timestamp: email.createdAt,
        })) || []
        setRecentActivity(activity)
      } catch (error: any) {
        // Handle authentication errors silently (they're handled by the auth context)
        if (error?.name === "AuthenticationError" || error?.message === "Authentication failed. Please login again.") {
          setError("Your session has expired. Please login again.")
          // Don't log this error to console as it's expected behavior
          return
        }
        
        // Log and handle other errors
        console.error("Failed to fetch stats:", error)
        setError("Failed to load dashboard data. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [toast])

  const statCards = [
    {
      title: "Total Contacts",
      value: stats.contacts,
      description: "Active contacts in your database",
      icon: Users,
      color: "text-blue-600",
      href: "/dashboard/contacts",
    },
    {
      title: "Email Templates",
      value: stats.templates,
      description: "Ready-to-use email templates",
      icon: FileText,
      color: "text-green-600",
      href: "/dashboard/templates",
    },
    {
      title: "Campaigns",
      value: stats.campaigns,
      description: "Total email campaigns created",
      icon: Send,
      color: "text-purple-600",
      href: "/dashboard/campaigns",
    },
    {
      title: "Emails Sent",
      value: stats.emailHistory.sent,
      description: "Successfully delivered emails",
      icon: TrendingUp,
      color: "text-orange-600",
      href: "/dashboard/email-history",
    },
  ]

  if (loading) {
    return (
      <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-lg">Unable to Load Dashboard</CardTitle>
              <CardDescription className="text-sm">{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Welcome to your Email Marketing CRM dashboard</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Email Performance</CardTitle>
            <CardDescription className="text-sm">Overview of your email delivery statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Successfully Sent</span>
              </div>
              <span className="font-medium">{stats.emailHistory.sent}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Failed</span>
              </div>
              <span className="font-medium">{stats.emailHistory.failed}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Emails</span>
              </div>
              <span className="font-bold">{stats.emailHistory.total}</span>
            </div>
            <Link href="/dashboard/email-history">
              <Button variant="outline" size="sm" className="w-full mt-4">
                View Email History
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
            <CardDescription className="text-sm">Latest email activity in your CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity to display</p>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    {activity.type === "sent" ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
          <CardDescription className="text-sm">Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/contacts">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Add Contacts</span>
              </Button>
            </Link>
            <Link href="/dashboard/templates">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Create Template</span>
              </Button>
            </Link>
            <Link href="/dashboard/campaigns">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Send className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">New Campaign</span>
              </Button>
            </Link>
            <Link href="/dashboard/bulk-email">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Send Bulk Email</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
