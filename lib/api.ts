const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export class ApiClient {
  private token: string | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token")
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

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Network error" }))
      throw new Error(error.message || "Request failed")
    }

    return response.json()
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

  async getAllUsers() {
    return this.request("/users")
  }

  // Contacts (enhanced)
  async getContacts() {
    return this.request("/contacts")
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
}

export const apiClient = new ApiClient()
