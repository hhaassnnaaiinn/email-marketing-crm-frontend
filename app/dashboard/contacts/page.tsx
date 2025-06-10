"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Edit, Trash2, Search, Upload, Download, Mail, MailX } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface Contact {
  _id: string
  company: string
  fullName: string
  workPhone?: string
  mobilePhone?: string
  role?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  email: string
  createdAt: string
  unsubscribed?: boolean
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    company: "",
    fullName: "",
    workPhone: "",
    mobilePhone: "",
    role: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    email: "",
    unsubscribed: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getContacts()
      
      // Ensure we have a valid array
      if (Array.isArray(data)) {
        setContacts(data)
      } else {
        console.error('Invalid contacts data:', data)
        setContacts([])
        toast({
          title: "Warning",
          description: "Received invalid data format",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
      setContacts([])
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingContact) {
        await apiClient.updateContact(editingContact._id, formData)
        toast({
          title: "Success",
          description: "Contact updated successfully",
        })
      } else {
        await apiClient.createContact(formData)
        toast({
          title: "Success",
          description: "Contact created successfully",
        })
      }
      setIsDialogOpen(false)
      setEditingContact(null)
      setFormData({ company: "", fullName: "", workPhone: "", mobilePhone: "", role: "", address: "", city: "", state: "", zip: "", email: "", unsubscribed: false })
      fetchContacts()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      company: contact?.company || "",
      fullName: contact?.fullName || "",
      workPhone: contact?.workPhone || "",
      mobilePhone: contact?.mobilePhone || "",
      role: contact?.role || "",
      address: contact?.address || "",
      city: contact?.city || "",
      state: contact?.state || "",
      zip: contact?.zip || "",
      email: contact?.email || "",
      unsubscribed: contact?.unsubscribed || false,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!id) {
      toast({
        title: "Error",
        description: "Invalid contact ID",
        variant: "destructive",
      })
      return
    }

    if (confirm("Are you sure you want to delete this contact?")) {
      try {
        await apiClient.deleteContact(id)
        toast({
          title: "Success",
          description: "Contact deleted successfully",
        })
        fetchContacts()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete contact",
          variant: "destructive",
        })
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Error",
        description: "Please select a CSV file",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const result = await apiClient.uploadContacts(file)
      toast({
        title: "Success",
        description: `Successfully uploaded ${result.imported || 0} contacts`,
      })
      setIsUploadDialogOpen(false)
      fetchContacts()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload contacts",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const downloadTemplate = () => {
    const csvContent = "company,fullName,email,workPhone,mobilePhone,role,address,city,state,zip\nExample Corp,John Doe,john@example.com,+1234567890,+0987654321,Manager,123 Main St,New York,NY,10001"
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "contacts_template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusBadge = (unsubscribed: boolean) => {
    if (unsubscribed === true) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <MailX className="h-3 w-3" />
          Unsubscribed
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Mail className="h-3 w-3" />
          Subscribed
        </Badge>
      )
    }
  }

  // Pagination logic
  const filteredContacts = contacts.filter(
    (contact) => {
      // Text search filter
      const matchesSearch = 
        (contact?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (contact?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (contact?.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (contact?.role?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (contact?.city?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (contact?.state?.toLowerCase() || '').includes(searchTerm.toLowerCase())

      // Status filter
      let matchesStatus = true
      if (statusFilter === "subscribed") {
        matchesStatus = !(contact?.unsubscribed || false)
      } else if (statusFilter === "unsubscribed") {
        matchesStatus = contact?.unsubscribed || false
      }

      return matchesSearch && matchesStatus
    }
  )

  // Calculate pagination
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentContacts = filteredContacts.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your email marketing contacts</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Contacts</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with your contacts. Download the template to see the required format.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Button variant="outline" onClick={downloadTemplate} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </div>
                {uploading && <p className="text-sm text-muted-foreground">Uploading contacts...</p>}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingContact(null)
                  setFormData({ company: "", fullName: "", workPhone: "", mobilePhone: "", role: "", address: "", city: "", state: "", zip: "", email: "", unsubscribed: false })
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
                <DialogDescription>
                  {editingContact ? "Update the contact information below." : "Add a new contact to your email list."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company *</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Enter company name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="workPhone">Work Phone</Label>
                      <Input
                        id="workPhone"
                        value={formData.workPhone}
                        onChange={(e) => setFormData({ ...formData, workPhone: e.target.value })}
                        placeholder="Enter work phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobilePhone">Mobile Phone</Label>
                      <Input
                        id="mobilePhone"
                        value={formData.mobilePhone}
                        onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                        placeholder="Enter mobile phone"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="Enter job role"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter address"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="Enter state"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                        placeholder="Enter ZIP code"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unsubscribed" className="flex items-center space-x-2">
                      <span>Email Subscription Status</span>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="unsubscribed"
                        checked={formData.unsubscribed}
                        onCheckedChange={(checked) => setFormData({ ...formData, unsubscribed: checked as boolean })}
                      />
                      <Label htmlFor="unsubscribed" className="text-sm">
                        Unsubscribed from emails
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Check this box if the contact has unsubscribed from email communications
                    </p>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" className="w-full sm:w-auto">{editingContact ? "Update Contact" : "Add Contact"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Contacts ({contacts?.length || 0})</CardTitle>
          <CardDescription className="text-sm">A list of all your email marketing contacts</CardDescription>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="status-filter" className="text-sm font-medium">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts</SelectItem>
                  <SelectItem value="subscribed">Subscribed</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading contacts...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[120px] hidden sm:table-cell">Company</TableHead>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead className="min-w-[100px] hidden md:table-cell">Role</TableHead>
                    <TableHead className="min-w-[120px] hidden lg:table-cell">Phone</TableHead>
                    <TableHead className="min-w-[100px] hidden lg:table-cell">Location</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[100px] hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentContacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        No contacts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentContacts.map((contact) => (
                      <TableRow key={contact?._id || Math.random()}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{contact?.fullName || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground sm:hidden">{contact?.company || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{contact?.company || 'N/A'}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{contact?.email || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">{contact?.role || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="space-y-1">
                            {contact?.workPhone && (
                              <div className="text-xs text-muted-foreground">Work: {contact.workPhone}</div>
                            )}
                            {contact?.mobilePhone && (
                              <div className="text-xs text-muted-foreground">Mobile: {contact.mobilePhone}</div>
                            )}
                            {!contact?.workPhone && !contact?.mobilePhone && '-'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {contact?.city || contact?.state ? (
                            <div className="text-xs">
                              {contact?.city && contact?.state ? `${contact.city}, ${contact.state}` : contact?.city || contact?.state}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(contact?.unsubscribed || false)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{contact?.createdAt ? new Date(contact.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1 sm:space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(contact)}>
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(contact?._id || '')}>
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
          {!loading && filteredContacts.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredContacts.length)} of {filteredContacts.length} contacts
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
