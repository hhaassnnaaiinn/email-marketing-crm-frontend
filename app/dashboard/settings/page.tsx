"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Shield, Cloud, User, CheckCircle, XCircle, Lock } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface AwsSettings {
  _id?: string
  accessKeyId: string
  secretAccessKey: string
  region: string
  fromEmail: string
  fromName: string
  replyToEmail: string
  isVerified: boolean
}

export default function SettingsPage() {
  const [awsSettings, setAwsSettings] = useState<AwsSettings>({
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
    fromEmail: "",
    fromName: "",
    replyToEmail: "",
    isVerified: false,
  })
  const [userProfile, setUserProfile] = useState({
    email: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchAwsSettings()
    fetchUserProfile()
  }, [])

  const fetchAwsSettings = async () => {
    try {
      const settings = await apiClient.getAwsSettings()
      if (settings) {
        setAwsSettings({
          accessKeyId: settings.accessKeyId || "",
          secretAccessKey: "", // Don't show the actual secret key
          region: settings.region || "us-east-1",
          fromEmail: settings.fromEmail || "",
          fromName: settings.fromName || "",
          replyToEmail: settings.replyToEmail || "",
          isVerified: settings.isVerified || false,
        })
      }
    } catch (error) {
      // Settings might not exist yet, which is fine
      // Keep the default values to ensure controlled inputs
    }
  }

  const fetchUserProfile = async () => {
    try {
      const profile = await apiClient.getCurrentUser()
      setUserProfile({ email: profile?.email || "" })
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      toast({
        title: "Error",
        description: "Failed to fetch user profile",
        variant: "destructive",
      })
      // Keep the default value to ensure controlled input
    }
  }

  const handleAwsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiClient.updateAwsSettings(awsSettings)
      toast({
        title: "Success",
        description: "AWS settings updated successfully",
      })
      fetchAwsSettings() // Refresh to get verification status
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update AWS settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAws = async () => {
    setVerifying(true)
    try {
      await apiClient.verifyAwsSettings()
      toast({
        title: "Success",
        description: "AWS settings verified successfully",
      })
      fetchAwsSettings() // Refresh to get updated verification status
    } catch (error) {
      toast({
        title: "Error",
        description: "AWS verification failed. Please check your credentials.",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)

    try {
      await apiClient.updateCurrentUser(userProfile)
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    // Validate password strength
    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setPasswordLoading(true)

    try {
      await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      
      toast({
        title: "Success",
        description: "Password changed successfully",
      })
      
      // Clear the form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const awsRegions = [
    { value: "us-east-1", label: "US East (N. Virginia)" },
    { value: "us-east-2", label: "US East (Ohio)" },
    { value: "us-west-1", label: "US West (N. California)" },
    { value: "us-west-2", label: "US West (Oregon)" },
    { value: "eu-west-1", label: "Europe (Ireland)" },
    { value: "eu-central-1", label: "Europe (Frankfurt)" },
    { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
    { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage your account and application settings</p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
            </div>
            <CardDescription className="text-sm">Update your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={userProfile.email || ""}
                  onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value || "" })}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <Button type="submit" disabled={profileLoading} className="w-full sm:w-auto">
                {profileLoading ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
              <CardTitle className="text-lg sm:text-xl">Change Password</CardTitle>
            </div>
            <CardDescription className="text-sm">Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter your current password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter your new password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm your new password"
                  required
                />
              </div>
              <Button type="submit" disabled={passwordLoading} className="w-full sm:w-auto">
                {passwordLoading ? "Changing Password..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* AWS SES Settings */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Cloud className="h-4 w-4 sm:h-5 sm:w-5" />
                <CardTitle className="text-lg sm:text-xl">AWS SES Configuration</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                {awsSettings.isVerified ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Verified
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="text-sm">Configure your AWS Simple Email Service settings for sending emails</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAwsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessKeyId">AWS Access Key ID</Label>
                <Input
                  id="accessKeyId"
                  type="password"
                  value={awsSettings.accessKeyId || ""}
                  onChange={(e) => setAwsSettings({ ...awsSettings, accessKeyId: e.target.value || "" })}
                  placeholder="Enter your AWS Access Key ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretAccessKey">AWS Secret Access Key</Label>
                <Input
                  id="secretAccessKey"
                  type="password"
                  value={awsSettings.secretAccessKey || ""}
                  onChange={(e) => setAwsSettings({ ...awsSettings, secretAccessKey: e.target.value || "" })}
                  placeholder="Enter your AWS Secret Access Key"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">AWS Region</Label>
                <Select
                  value={awsSettings.region || "us-east-1"}
                  onValueChange={(value) => setAwsSettings({ ...awsSettings, region: value || "us-east-1" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AWS region" />
                  </SelectTrigger>
                  <SelectContent>
                    {awsRegions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email Address</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={awsSettings.fromEmail || ""}
                  onChange={(e) => setAwsSettings({ ...awsSettings, fromEmail: e.target.value || "" })}
                  placeholder="noreply@yourdomain.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  type="text"
                  value={awsSettings.fromName || ""}
                  onChange={(e) => setAwsSettings({ ...awsSettings, fromName: e.target.value || "" })}
                  placeholder="Your Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="replyToEmail">Reply-To Email Address</Label>
                <Input
                  id="replyToEmail"
                  type="email"
                  value={awsSettings.replyToEmail || ""}
                  onChange={(e) => setAwsSettings({ ...awsSettings, replyToEmail: e.target.value || "" })}
                  placeholder="replyto@yourdomain.com"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Updating..." : "Update AWS Settings"}
                </Button>
                <Button type="button" variant="outline" onClick={handleVerifyAws} disabled={verifying} className="w-full sm:w-auto">
                  {verifying ? "Verifying..." : "Verify Settings"}
                </Button>
              </div>
            </form>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Security Note</p>
                  <p className="text-blue-700 mt-1">
                    Your AWS credentials are encrypted and stored securely. Make sure your AWS IAM user has the
                    necessary SES permissions and that your from email address is verified in AWS SES.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
