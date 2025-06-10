"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, Search, Calendar, Send, Eye } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Campaign {
  _id: string
  name: string
  subject: string
  status: "draft" | "sent"
  scheduledAt?: string
  sentAt?: string
  templateId: string // <-- use templateId instead of template object
  contacts: Array<{
    _id: string
    firstName: string
    lastName: string
    email: string
  }>
  createdAt: string
}

interface Template {
  _id: string
  name: string
  subject: string
  body: string
}

interface Contact {
  _id: string
  firstName: string
  lastName: string
  email: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    templateId: "", // <-- use templateId
    scheduledAt: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [campaignsData, templatesData, contactsData] = await Promise.all([
        apiClient.getCampaigns(),
        apiClient.getTemplates(),
        apiClient.getContacts(),
      ])
      setCampaigns(campaignsData)
      setTemplates(templatesData)
      setContacts(contactsData)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const campaignData = {
        ...formData,
        contacts: selectedContacts,
      }

      if (editingCampaign) {
        await apiClient.updateCampaign(editingCampaign._id, campaignData)
        toast({
          title: "Success",
          description: "Campaign updated successfully",
        })
      } else {
        await apiClient.createCampaign(campaignData)
        toast({
          title: "Success",
          description: "Campaign created successfully",
        })
      }
      setIsDialogOpen(false)
      setEditingCampaign(null)
      setFormData({ name: "", subject: "", templateId: "", scheduledAt: "" })
      setSelectedContacts([])
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save campaign",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      templateId: campaign.templateId, // <-- use templateId
      scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : "",
    })
    setSelectedContacts(campaign.contacts.map((c) => c._id))
    setIsDialogOpen(true)
  }

  const handleView = async (campaign: Campaign) => {
    try {
      const fullCampaign = await apiClient.getCampaign(campaign._id)
      setViewingCampaign(fullCampaign)
      setIsViewDialogOpen(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load campaign details",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      try {
        await apiClient.deleteCampaign(id)
        toast({
          title: "Success",
          description: "Campaign deleted successfully",
        })
        fetchData()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete campaign",
          variant: "destructive",
        })
      }
    }
  }

  const handleSendCampaign = async (id: string) => {
    if (confirm("Are you sure you want to send this campaign? This action cannot be undone.")) {
      try {
        const result = await apiClient.sendCampaign(id)
        toast({
          title: "Success",
          description: `Campaign sent successfully! ${result.results?.successful?.length || 0} emails sent.`,
        })
        fetchData()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to send campaign",
          variant: "destructive",
        })
      }
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

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      sent: "default",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calculate pagination
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCampaigns = filteredCampaigns.slice(startIndex, endIndex)

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Create and manage your email marketing campaigns</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCampaign(null)
                setFormData({ name: "", subject: "", templateId: "", scheduledAt: "" })
                setSelectedContacts([])
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? "Edit Campaign" : "Create New Campaign"}</DialogTitle>
              <DialogDescription>
                {editingCampaign ? "Update the campaign information below." : "Create a new email marketing campaign."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter campaign name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledAt">Schedule Date & Time</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="scheduledAt"
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Enter email subject"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateId">Template</Label>
                  <Select
                    value={formData.templateId}
                    onValueChange={(value) => setFormData({ ...formData, templateId: value })}
                  >
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
                <div className="space-y-2">
                  <Label>Recipients ({selectedContacts.length} selected)</Label>
                  <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 pb-2 border-b">
                        <Checkbox
                          id="select-all-contacts"
                          checked={selectedContacts.length === contacts.length && contacts.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                        <Label htmlFor="select-all-contacts" className="text-sm font-medium">
                          Select All ({contacts.length} contacts)
                        </Label>
                      </div>
                      {contacts.map((contact) => (
                        <div key={contact._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={contact._id}
                            checked={selectedContacts.includes(contact._id)}
                            onCheckedChange={(checked) => handleContactSelection(contact._id, checked as boolean)}
                          />
                          <Label htmlFor={contact._id} className="text-sm">
                            {contact.firstName} {contact.lastName} ({contact.email})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit" className="w-full sm:w-auto">{editingCampaign ? "Update Campaign" : "Create Campaign"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>
          {viewingCampaign && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Campaign Name</Label>
                  <p className="text-sm text-muted-foreground">{viewingCampaign.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewingCampaign.status)}</div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Subject</Label>
                <p className="text-sm text-muted-foreground">{viewingCampaign.subject}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Template</Label>
                <p className="text-sm text-muted-foreground">
                  {templates.find(t => t._id === viewingCampaign.templateId)?.name || "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Recipients ({viewingCampaign.contacts.length})</Label>
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {viewingCampaign.contacts.map((contact) => (
                    <p key={contact._id} className="text-sm text-muted-foreground">
                      {contact.firstName} {contact.lastName} ({contact.email})
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Email Content</Label>
                <div
                  className="mt-2 p-4 border rounded-md bg-gray-50 max-h-64 overflow-y-auto overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: viewingCampaign.template?.body || "" }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Campaigns ({campaigns.length})</CardTitle>
          <CardDescription className="text-sm">Manage your email marketing campaigns</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading campaigns...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Name</TableHead>
                    <TableHead className="min-w-[200px] hidden sm:table-cell">Subject</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[80px] hidden md:table-cell">Recipients</TableHead>
                    <TableHead className="min-w-[120px] hidden lg:table-cell">Scheduled</TableHead>
                    <TableHead className="min-w-[100px] hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No campaigns found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentCampaigns.map((campaign) => (
                      <TableRow key={campaign._id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-xs text-muted-foreground sm:hidden truncate max-w-[200px]">{campaign.subject}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell max-w-[200px] truncate">{campaign.subject}</TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell className="hidden md:table-cell">{campaign.contacts.length}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString() : "Not scheduled"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1 sm:space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleView(campaign)}>
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            {campaign.status === "draft" && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)}>
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleSendCampaign(campaign._id)}>
                                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </>
                            )}
                            <Button variant="outline" size="sm" onClick={() => handleDelete(campaign._id)}>
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {!loading && filteredCampaigns.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {/* First page */}
                  {currentPage > 2 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Ellipsis */}
                  {currentPage > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {/* Previous page */}
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(currentPage - 1)}>
                        {currentPage - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Current page */}
                  <PaginationItem>
                    <PaginationLink isActive>{currentPage}</PaginationLink>
                  </PaginationItem>
                  
                  {/* Next page */}
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(currentPage + 1)}>
                        {currentPage + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Ellipsis */}
                  {currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {/* Last page */}
                  {currentPage < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
