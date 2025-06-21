const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Global error handler to prevent authentication errors from being logged
const handleGlobalError = (event: ErrorEvent) => {
  if (event.error?.name === "AuthenticationError" || 
      event.error?.message?.includes("Authentication failed")) {
    event.preventDefault()
    return false
  }
}

// Global unhandled promise rejection handler
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  if (event.reason?.name === "AuthenticationError" || 
      event.reason?.message?.includes("Authentication failed")) {
    event.preventDefault()
    return false
  }
}

// Add global error handlers if in browser
if (typeof window !== "undefined") {
  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
  
  // Cleanup function (for development purposes)
  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('beforeunload', () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    })
  }
}

export class ApiClient {
  private token: string | null = null
  private onAuthError: (() => void) | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token")
    }
  }

  setAuthErrorHandler(handler: () => void) {
    this.onAuthError = handler
  }

  updateToken(newToken: string) {
    this.token = newToken
    if (typeof window !== "undefined") {
      localStorage.setItem("token", newToken)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          // Clear token and trigger logout
          this.clearToken()
          
          // Call auth error handler if set
          if (this.onAuthError) {
            this.onAuthError()
          }
          
          // Create a custom error that won't be logged as uncaught
          const authError = new Error("Authentication failed. Please login again.")
          authError.name = "AuthenticationError"
          throw authError
        }
        
        const error = await response.json().catch(() => ({ message: "Network error" }))
        throw new Error(error.message || "Request failed")
      }

      return response.json()
    } catch (error) {
      // Re-throw authentication errors as-is
      if (error instanceof Error && error.name === "AuthenticationError") {
        throw error
      }
      
      // For other errors, ensure they have a proper message
      if (error instanceof Error) {
        throw error
      }
      
      throw new Error("An unexpected error occurred")
    }
  }

  // Users
  async getCurrentUser() {
    return this.request("/users/me")
  }

  async updateCurrentUser(userData: { email: string }) {
    return this.request("/users/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
    return this.request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(passwordData),
    })
  }

  async getAllUsers() {
    return this.request("/users")
  }

  // Contacts (enhanced)
  async getContacts(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.search) queryParams.append("search", params.search)
    if (params?.status) queryParams.append("status", params.status)
    const query = queryParams.toString()
    return this.request(`/contacts${query ? `?${query}` : ""}`)
  }

  async createContact(contact: {
    company: string
    fullName: string
    email: string
    workPhone?: string
    mobilePhone?: string
    role?: string
    address?: string
    city?: string
    state?: string
    zip?: string
  }) {
    return this.request("/contacts", {
      method: "POST",
      body: JSON.stringify(contact),
    })
  }

  async updateContact(
    id: string,
    contact: {
      company: string
      fullName: string
      email: string
      workPhone?: string
      mobilePhone?: string
      role?: string
      address?: string
      city?: string
      state?: string
      zip?: string
    },
  ) {
    return this.request(`/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(contact),
    })
  }

  async deleteContact(id: string) {
    return this.request(`/contacts/${id}`, {
      method: "DELETE",
    })
  }

  async uploadContacts(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    const url = `${API_BASE_URL}/contacts/upload`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Upload failed" }))
      throw new Error(error.message || "Upload failed")
    }

    return response.json()
  }

  // Templates
  async getTemplates() {
    return this.request("/templates")
  }

  async createTemplate(template: { name: string; subject: string; body: string }) {
    return this.request("/templates", {
      method: "POST",
      body: JSON.stringify(template),
    })
  }

  async updateTemplate(id: string, template: { name: string; subject: string; body: string }) {
    return this.request(`/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(template),
    })
  }

  async deleteTemplate(id: string) {
    return this.request(`/templates/${id}`, {
      method: "DELETE",
    })
  }

  // Campaigns (enhanced)
  async getCampaigns() {
    return this.request("/campaigns")
  }

  async getCampaign(id: string) {
    return this.request(`/campaigns/${id}`)
  }

  async createCampaign(campaign: any) {
    return this.request("/campaigns", {
      method: "POST",
      body: JSON.stringify(campaign),
    })
  }

  async updateCampaign(id: string, campaign: any) {
    return this.request(`/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(campaign),
    })
  }

  async deleteCampaign(id: string) {
    return this.request(`/campaigns/${id}`, {
      method: "DELETE",
    })
  }

  async sendCampaign(id: string) {
    return this.request(`/campaigns/${id}/send`, {
      method: "POST",
    })
  }

  // AWS Settings (enhanced)
  async getAwsSettings() {
    return this.request("/aws-settings")
  }

  async updateAwsSettings(settings: {
    accessKeyId: string
    secretAccessKey: string
    region: string
    fromEmail: string
    fromName: string
  }) {
    return this.request("/aws-settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  }

  async verifyAwsSettings() {
    return this.request("/aws-settings/verify", {
      method: "PUT",
    })
  }

  // Email Management
  async getEmailHistory(params?: { page?: number; limit?: number; status?: string; type?: string }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.status) queryParams.append("status", params.status)
    if (params?.type) queryParams.append("type", params.type)

    const query = queryParams.toString()
    return this.request(`/email/history${query ? `?${query}` : ""}`)
  }

  async sendSingleEmail(email: { to: string; subject: string; html: string }) {
    return this.request("/email/send", {
      method: "POST",
      body: JSON.stringify(email),
    })
  }

  async sendBulkEmails(data: { recipients: string[]; subject: string; html: string; batchSize?: number }) {
    return this.request("/email/send-bulk", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async sendTestEmail() {
    return this.request("/email/test", {
      method: "POST",
    })
  }

  async checkUnsubscribeStatus(email: string, userId: string) {
    return this.request(`/email/unsubscribe/status?email=${email}&userId=${userId}`)
  }

  // Email Validation and Preview
  async validateEmailContent(subject: string, html: string) {
    return this.request("/email/validate", {
      method: "POST",
      body: JSON.stringify({ subject, html }),
    })
  }

  async previewEmail(subject: string, html: string, sampleContact: any) {
    return this.request("/email/preview", {
      method: "POST",
      body: JSON.stringify({ subject, html, sampleContact }),
    })
  }

  // Image Upload
  async uploadImage(file: File) {
    const formData = new FormData()
    formData.append('image', file)

    const url = `${API_BASE_URL}/images/upload`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Image upload failed" }))
      throw new Error(error.message || "Image upload failed")
    }

    return response.json()
  }

  async uploadMultipleImages(files: File[]) {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append('images', file)
    })

    const url = `${API_BASE_URL}/images/upload-multiple`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Multiple image upload failed" }))
      throw new Error(error.message || "Multiple image upload failed")
    }

    return response.json()
  }

  // Batch campaign creation for large contact lists
  async createCampaignBatch(campaign: any) {
    return this.request("/campaigns/batch", {
      method: "POST",
      body: JSON.stringify(campaign),
    })
  }

  async getUnsubscribers(params?: { page?: number; limit?: number; search?: string }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.search) queryParams.append("search", params.search)
    const query = queryParams.toString()
    return this.request(`/contacts/unsub${query ? `?${query}` : ""}`)
  }

  async getContactsByIds(ids: string[]) {
    return this.request("/contacts/by-ids", {
      method: "POST",
      body: JSON.stringify({ ids }),
    })
  }
}

export const apiClient = new ApiClient()
