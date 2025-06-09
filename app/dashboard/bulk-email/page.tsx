"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Send, Users, Mail } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Contact {
  _id: string
  firstName: string
  lastName: string
  email: string
}

export default function BulkEmailPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [emailData, setEmailData] = useState({
    subject: "",
    html: "",
    batchSize: 50,
  })
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getContacts()
      setContacts(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleContactSelection = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId])
    } else {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(contacts.map((c) => c._id))
    } else {
      setSelectedContacts([])
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
        batchSize: emailData.batchSize,
      })

      toast({
        title: "Success",
        description: `Bulk email sent! ${result.results?.successful?.length || 0} successful, ${result.results?.failed?.length || 0} failed.`,
      })

      // Reset form
      setEmailData({ subject: "", html: "", batchSize: 50 })
      setSelectedContacts([])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send bulk email",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Email</h1>
        <p className="text-muted-foreground">Send emails to multiple contacts at once</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Compose Email</span>
            </CardTitle>
            <CardDescription>Create your bulk email content</CardDescription>
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
              <div className="space-y-2">
                <Label htmlFor="html">Email Content (HTML)</Label>
                <Textarea
                  id="html"
                  value={emailData.html}
                  onChange={(e) => setEmailData({ ...emailData, html: e.target.value })}
                  placeholder="Enter your email content in HTML format..."
                  className="min-h-[200px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchSize">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  min="1"
                  max="100"
                  value={emailData.batchSize || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsedValue = Number.parseInt(value);
                    setEmailData({ 
                      ...emailData, 
                      batchSize: isNaN(parsedValue) ? 50 : parsedValue 
                    });
                  }}
                  placeholder="50"
                />
                <p className="text-xs text-muted-foreground">Number of emails to send per batch (recommended: 50)</p>
              </div>
              <Button type="submit" disabled={sending || selectedContacts.length === 0} className="w-full">
                {sending ? "Sending..." : `Send to ${selectedContacts.length} Recipients`}
                <Send className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recipient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Select Recipients</span>
            </CardTitle>
            <CardDescription>
              Choose contacts to receive your bulk email ({selectedContacts.length} of {contacts.length} selected)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading contacts...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedContacts.length === contacts.length && contacts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="font-medium">
                    Select All ({contacts.length} contacts)
                  </Label>
                </div>
                <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div key={contact._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={contact._id}
                          checked={selectedContacts.includes(contact._id)}
                          onCheckedChange={(checked) => handleContactSelection(contact._id, checked as boolean)}
                        />
                        <Label htmlFor={contact._id} className="text-sm flex-1">
                          <div className="flex justify-between">
                            <span>
                              {contact.firstName} {contact.lastName}
                            </span>
                            <span className="text-muted-foreground">{contact.email}</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedContacts.length > 0 && (
                  <div className="mt-4">
                    <Badge variant="secondary">
                      {selectedContacts.length} recipient{selectedContacts.length !== 1 ? "s" : ""} selected
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Preview */}
      {emailData.html && (
        <Card>
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
            <CardDescription>Preview how your email will look to recipients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="mb-4">
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
