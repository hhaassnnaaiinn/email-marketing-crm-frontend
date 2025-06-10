"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Mail, User } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditor } from "@/components/rich-text-editor"

interface Contact {
  _id: string
  firstName: string
  lastName: string
  email: string
}

interface Template {
  _id: string
  name: string
  subject: string
  body: string
}

export default function SingleEmailPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [emailData, setEmailData] = useState({
    to: "",
    subject: "",
    html: "",
  })
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [contactsData, templatesData] = await Promise.all([apiClient.getContacts(), apiClient.getTemplates()])
      setContacts(contactsData)
      setTemplates(templatesData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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

  const handleContactSelect = (contactId: string) => {
    const contact = contacts.find((c) => c._id === contactId)
    if (contact) {
      setEmailData({
        ...emailData,
        to: contact.email,
      })
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!emailData.to || !emailData.subject || !emailData.html) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      const result = await apiClient.sendSingleEmail({
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      })

      toast({
        title: "Success",
        description: `Email sent successfully! Message ID: ${result.messageId}`,
      })

      // Reset form
      setEmailData({ to: "", subject: "", html: "" })
      setSelectedTemplate("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Send Single Email</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Send a personalized email to a single recipient</p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Email Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Compose Email</span>
            </CardTitle>
            <CardDescription className="text-sm">Create your email content</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="to">Recipient Email</Label>
                <Input
                  id="to"
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                  placeholder="Enter recipient email"
                  required
                />
              </div>
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
              <Button type="submit" disabled={sending} className="w-full">
                {sending ? "Sending..." : "Send Email"}
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
              <Label>Select Contact</Label>
              <Select onValueChange={handleContactSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact._id} value={contact._id}>
                      {contact.firstName} {contact.lastName} ({contact.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <CardDescription className="text-sm">Preview how your email will look to the recipient</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4 bg-white overflow-x-auto">
              <div className="mb-4 pb-4 border-b space-y-2">
                <div>
                  <strong>To:</strong> {emailData.to}
                </div>
                <div>
                  <strong>Subject:</strong> {emailData.subject}
                </div>
              </div>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: emailData.html }} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
