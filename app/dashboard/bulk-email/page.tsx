"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Send, Users, Mail, Search, User } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Contact {
  _id: string
  fullName: string
  email: string
}

interface Template {
  _id: string
  name: string
  subject: string
  body: string
}

export default function BulkEmailPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [emailData, setEmailData] = useState({
    subject: "",
    html: "",
  })
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  // Paginated contact selection state
  const [contactSearch, setContactSearch] = useState("")
  const [pendingSearch, setPendingSearch] = useState("")
  const [contactPage, setContactPage] = useState(1)
  const [contactLimit] = useState(10)
  const [contactTotal, setContactTotal] = useState(0)
  const [contactLoading, setContactLoading] = useState(false)
  const [contactList, setContactList] = useState<Contact[]>([])
  const [selectAllPages, setSelectAllPages] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Fetch templates and first page of contacts on mount
  const fetchInitialData = async () => {
    setContactLoading(true)
    try {
      const [templatesData, contactsRes] = await Promise.all([
        apiClient.getTemplates(),
        apiClient.getContacts({ page: 1, limit: contactLimit })
      ])
      setTemplates(templatesData)
      setContactList(Array.isArray(contactsRes.contacts) ? contactsRes.contacts : [])
      setContactTotal(contactsRes.pagination?.totalItems || 0)
    } catch (e) {
      setTemplates([])
      setContactList([])
      setContactTotal(0)
    } finally {
      setContactLoading(false)
    }
  }

  // Search handler
  const handleContactSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = pendingSearch.trim();
    setContactSearch(pendingSearch); // This will trigger useEffect
    setContactPage(1);
    if (trimmed.length >= 2) {
      fetchContacts(1, trimmed);
    } else {
      fetchContacts(1, "");
    }
  }

  // Fetch contacts on mount or page change
  useEffect(() => {
    if (contactPage !== 1) {
      const trimmed = contactSearch.trim();
      if (trimmed.length >= 2) {
        fetchContacts(contactPage, trimmed);
      } else {
        fetchContacts(contactPage, "");
      }
    }
    // eslint-disable-next-line
  }, [contactPage]);

  // Select all contacts on current page
  const handleSelectAllOnPage = (checked: boolean) => {
    if (checked) {
      const newIds = contactList.map(c => c._id)
      setSelectedContacts(prev => Array.from(new Set([...prev, ...newIds])))
    } else {
      setSelectedContacts(prev => prev.filter(id => !contactList.some(c => c._id === id)))
    }
  }

  // Select all contacts across all pages
  const handleSelectAllPages = async (checked: boolean) => {
    setSelectAllPages(checked)
    if (checked) {
      setContactLoading(true)
      try {
        const allIds: string[] = []
        let page = 1
        let done = false
        while (!done) {
          const res = await apiClient.getContacts({ page, limit: 1000, search: contactSearch })
          allIds.push(...(Array.isArray(res.contacts) ? res.contacts.map((c: any) => c._id) : []))
          if (allIds.length >= (res.pagination?.totalItems || 0)) done = true
          else page++
        }
        setSelectedContacts(allIds)
      } catch {
        setSelectedContacts([])
      } finally {
        setContactLoading(false)
      }
    } else {
      setSelectedContacts([])
    }
  }

  // Handle single contact selection
  const handleContactSelection = (contactId: string, checked: boolean) => {
    if (checked) setSelectedContacts(prev => Array.from(new Set([...prev, contactId])))
    else setSelectedContacts(prev => prev.filter(cid => cid !== contactId))
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find((t) => t._id === templateId)
    if (template) {
      setEmailData({
        ...emailData,
        subject: template.subject,
        html: template.body,
      })
    }
  }

  const handleSendBulkEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedContacts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one recipient",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      const selectedEmails = contacts.filter((c) => selectedContacts.includes(c._id)).map((c) => c.email)

      const result = await apiClient.sendBulkEmails({
        recipients: selectedEmails,
        subject: emailData.subject,
        html: emailData.html,
      })

      toast({
        title: "Success",
        description: `Bulk email sent! ${result.results?.successful?.length || 0} successful, ${result.results?.failed?.length || 0} failed.`,
      })

      // Reset form
      setEmailData({ subject: "", html: "" })
      setSelectedContacts([])
      setSelectedTemplate("")
    } catch (error) {
      // Check if the error is about unsubscribed recipient
      const errorMessage = error instanceof Error ? error.message : "Failed to send bulk email"
      
      if (errorMessage.includes("All recipients have unsubscribed from emails")) {
        toast({
          title: "Cannot Send Bulk Email",
          description: "All recipients have unsubscribed from emails",
          variant: "destructive",
        })
      } else if (errorMessage.includes("Recipient has unsubscribed from emails")) {
        toast({
          title: "Cannot Send Bulk Email",
          description: "One or more recipients have unsubscribed from emails",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to send bulk email",
          variant: "destructive",
        })
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bulk Email</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Send emails to multiple contacts at once</p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Email Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Compose Email</span>
            </CardTitle>
            <CardDescription className="text-sm">Create your bulk email content</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendBulkEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  placeholder="Enter email subject"
                  required
                />
              </div>
              <RichTextEditor
                label="Email Content"
                value={emailData.html}
                onChange={(value) => setEmailData({ ...emailData, html: value })}
                placeholder="Enter your email content..."
                required
              />
              <Button type="submit" disabled={sending || selectedContacts.length === 0} className="w-full">
                {sending ? "Sending..." : `Send to ${selectedContacts.length} Recipients`}
                <Send className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription className="text-sm">Use templates and contacts to speed up composition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Use Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Selection */}
            <div className="space-y-2">
              <Label>Select Contacts</Label>
              <form onSubmit={handleContactSearch} className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts by name or email..."
                    value={pendingSearch}
                    onChange={(e) => setPendingSearch(e.target.value)}
                    className="pl-10"
                    disabled={contactLoading}
                    autoFocus
                  />
                </div>
                <Button type="submit" size="sm" disabled={contactLoading || pendingSearch.trim().length < 2}>
                  Search
                </Button>
              </form>
              <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {contactLoading ? (
                    <div className="text-center py-4">Loading contacts...</div>
                  ) : contactList.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      {contactSearch.trim().length >= 2 ? "No contacts found matching your search." : "No contacts available."}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all-page"
                          checked={contactList.length > 0 && contactList.every(c => selectedContacts.includes(c._id))}
                          onCheckedChange={handleSelectAllOnPage}
                        />
                        <Label htmlFor="select-all-page" className="font-medium text-sm">
                          Select All on Page ({contactList.length} contacts)
                        </Label>
                        <Checkbox
                          id="select-all-all"
                          checked={selectAllPages}
                          onCheckedChange={handleSelectAllPages}
                        />
                        <Label htmlFor="select-all-all" className="font-medium text-sm">
                          Select All ({contactTotal} contacts)
                        </Label>
                      </div>
                      {contactList.map((contact) => (
                        <div key={contact._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={contact._id}
                            checked={selectedContacts.includes(contact._id)}
                            onCheckedChange={(checked) => handleContactSelection(contact._id, checked as boolean)}
                          />
                          <Label htmlFor={contact._id} className="text-sm flex-1">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span>
                                <span className="font-medium">{contact.fullName}</span> <span className="text-muted-foreground text-xs sm:text-sm">({contact.email})</span>
                              </span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                {/* Pagination for contacts */}
                <div className="flex justify-between items-center pt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={contactPage === 1 || contactLoading}
                    onClick={() => setContactPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {contactPage} of {Math.ceil(contactTotal / contactLimit) || 1}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={contactPage >= Math.ceil(contactTotal / contactLimit) || contactLoading}
                    onClick={() => setContactPage((p) => Math.min(Math.ceil(contactTotal / contactLimit), p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="pt-4 border-t">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Available Templates:</span>
                  <span className="font-medium">{templates.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Contacts:</span>
                  <span className="font-medium">{contacts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Selected Recipients:</span>
                  <span className="font-medium">{selectedContacts.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Preview */}
      {emailData.html && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Email Preview</CardTitle>
            <CardDescription className="text-sm">Preview how your email will look to recipients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4 bg-white overflow-x-auto">
              <div className="mb-4 pb-4 border-b">
                <strong>Subject:</strong> {emailData.subject}
              </div>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: emailData.html }} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
