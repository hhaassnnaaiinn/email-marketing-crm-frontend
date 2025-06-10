"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronLeft, ChevronRight, Send } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface EmailLog {
  _id: string
  to: string
  subject: string
  status: "sent" | "failed"
  messageId?: string
  error?: string
  type: "single" | "bulk" | "test"
  sentAt: string
}

interface EmailHistory {
  emails: EmailLog[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function EmailHistoryPage() {
  const [emailHistory, setEmailHistory] = useState<EmailHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchEmailHistory()
  }, [currentPage, statusFilter, typeFilter])

  const fetchEmailHistory = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 10,
      }

      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.type = typeFilter

      const data = await apiClient.getEmailHistory(params)
      
      // Ensure we have a valid structure
      if (data && typeof data === 'object') {
        setEmailHistory({
          emails: data.emails || [],
          pagination: data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            hasNext: false,
            hasPrev: false
          }
        })
      } else {
        // Fallback structure if data is invalid
        setEmailHistory({
          emails: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            hasNext: false,
            hasPrev: false
          }
        })
      }
    } catch (error) {
      console.error('Failed to fetch email history:', error)
      toast({
        title: "Error",
        description: "Failed to fetch email history",
        variant: "destructive",
      })
      // Set empty structure on error
      setEmailHistory({
        emails: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendTestEmail = async () => {
    try {
      await apiClient.sendTestEmail()
      toast({
        title: "Success",
        description: "Test email sent successfully",
      })
      fetchEmailHistory()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: "default",
      failed: "destructive",
      unknown: "secondary",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      single: "secondary",
      bulk: "default",
      test: "outline",
      unknown: "secondary",
    } as const

    return (
      <Badge variant={variants[type as keyof typeof variants] || "secondary"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const filteredEmails =
    emailHistory?.emails?.filter(
      (email) =>
        email?.to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email?.subject?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Email History</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track all sent emails and their delivery status</p>
        </div>
        <Button onClick={handleSendTestEmail} className="w-full sm:w-auto">
          <Send className="h-4 w-4 mr-2" />
          Send Test Email
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Email Logs</CardTitle>
          <CardDescription className="text-sm">
            {emailHistory?.pagination ? `${emailHistory.pagination.totalItems} total emails` : "Loading..."}
          </CardDescription>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="bulk">Bulk</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading email history...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Recipient</TableHead>
                      <TableHead className="min-w-[200px] hidden sm:table-cell">Subject</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="min-w-[80px] hidden md:table-cell">Type</TableHead>
                      <TableHead className="min-w-[120px] hidden lg:table-cell">Message ID</TableHead>
                      <TableHead className="min-w-[120px] hidden md:table-cell">Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmails.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No emails found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmails.map((email) => (
                        <TableRow key={email?._id || Math.random()}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-medium">{email?.to || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground sm:hidden truncate max-w-[200px]">{email?.subject || 'N/A'}</div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell max-w-[200px] truncate">{email?.subject || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(email?.status || 'unknown')}</TableCell>
                          <TableCell className="hidden md:table-cell">{getTypeBadge(email?.type || 'unknown')}</TableCell>
                          <TableCell className="hidden lg:table-cell font-mono text-xs">
                            {email?.messageId ? email.messageId.slice(0, 20) + "..." : "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{email?.sentAt ? new Date(email.sentAt).toLocaleString() : 'N/A'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {emailHistory?.pagination && emailHistory.pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
                  <p className="text-sm text-muted-foreground text-center sm:text-left">
                    Page {emailHistory.pagination.currentPage} of {emailHistory.pagination.totalPages}
                  </p>
                  <div className="flex items-center justify-center sm:justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!emailHistory.pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!emailHistory.pagination.hasNext}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
