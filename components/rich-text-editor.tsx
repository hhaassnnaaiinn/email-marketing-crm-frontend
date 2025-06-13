"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  User,
  Mail,
  Building,
  Phone,
  Smartphone,
  Briefcase,
  MapPin,
  Unlink,
  Globe,
  Tag,
  Calendar,
  Clock,
  FileText,
  ChevronDown,
  CheckCircle,
  Eye,
  Loader2,
  Hand,
  Signature
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter your content...",
  label,
  required = false,
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [resizeHandle, setResizeHandle] = useState<string>("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [showPersonalization, setShowPersonalization] = useState(false)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const { toast } = useToast()

  // Emoji list
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👌',
    '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
    '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
    '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺',
    '🔻', '🔸', '🔹', '🔶', '🔷', '🔸', '🔹', '🔶', '🔷', '🔸',
    '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🎮',
    '🎯', '🎲', '🧩', '🎰', '🎳', '🎮', '🎲', '🧩', '🎰', '🎳',
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
    '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🚨', '🚔', '🚍',
    '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄',
    '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬',
    '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🚟', '🚠', '🚡', '🛎️',
    '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
    '🎮', '🎯', '🎲', '🧩', '🎰', '🎳', '🎮', '🎲', '🧩', '🎰',
    '🎳', '🎮', '🎲', '🧩', '🎰', '🎳', '🎮', '🎲', '🧩', '🎰'
  ]

  // Merge tags for personalization - only contact fields from your database
  const mergeTags = [
    { tag: '{{fullName}}', description: 'Contact full name' },
    { tag: '{{email}}', description: 'Contact email address' },
    { tag: '{{company}}', description: 'Contact company name' },
    { tag: '{{workPhone}}', description: 'Contact work phone' },
    { tag: '{{mobilePhone}}', description: 'Contact mobile phone' },
    { tag: '{{role}}', description: 'Contact job role/position' },
    { tag: '{{address}}', description: 'Contact full address' },
    { tag: '{{city}}', description: 'Contact city' },
    { tag: '{{state}}', description: 'Contact state/province' },
    { tag: '{{zip}}', description: 'Contact zip/postal code' }
  ]

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
        setSelectedImage(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      onChange(content)
      
      // Update word and character count
      const textContent = editorRef.current.textContent || ''
      setCharCount(textContent.length)
      setWordCount(textContent.trim() ? textContent.trim().split(/\s+/).length : 0)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    
    // Handle image paste
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          handleImageUploadFromFile(file)
          return
        }
      }
    }
    
    // Handle text paste
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      editorRef.current.focus()
      onChange(editorRef.current.innerHTML)
    }
  }

  const insertTable = (rows: number, cols: number) => {
    let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">'
    
    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>'
      for (let j = 0; j < cols; j++) {
        tableHTML += '<td style="border: 1px solid #ddd; padding: 8px; text-align: left;">&nbsp;</td>'
      }
      tableHTML += '</tr>'
    }
    
    tableHTML += '</table>'
    
    if (editorRef.current) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = tableHTML
        const table = tempDiv.firstChild
        range.insertNode(table!)
        range.collapse(false)
      } else {
        editorRef.current.innerHTML += tableHTML
      }
      
      editorRef.current.focus()
      onChange(editorRef.current.innerHTML)
    }
  }

  const insertCodeBlock = () => {
    const codeBlock = '<pre style="background-color: #f4f4f4; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin: 10px 0; font-family: monospace; white-space: pre-wrap;"><code>Your code here</code></pre>'
    
    if (editorRef.current) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = codeBlock
        const pre = tempDiv.firstChild
        range.insertNode(pre!)
        range.collapse(false)
      } else {
        editorRef.current.innerHTML += codeBlock
      }
      
      editorRef.current.focus()
      onChange(editorRef.current.innerHTML)
    }
  }

  const insertEmoji = (emoji: string) => {
    if (editorRef.current) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(document.createTextNode(emoji))
        range.collapse(false)
      } else {
        editorRef.current.innerHTML += emoji
      }
      
      editorRef.current.focus()
      onChange(editorRef.current.innerHTML)
      setShowEmojiPicker(false)
    }
  }

  const insertMergeTag = (tag: string) => {
    if (editorRef.current) {
      const mergeTag = `{{${tag}}}`
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(document.createTextNode(mergeTag))
        range.collapse(false)
      } else {
        editorRef.current.innerHTML += mergeTag
      }
      
      editorRef.current.focus()
      onChange(editorRef.current.innerHTML)
      toast({
        title: "Merge tag inserted",
        description: `{{${tag}}} added to your content`,
      })
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await handleImageUploadFromFile(file)
    }
  }

  const handleImageUploadFromFile = async (file: File) => {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPEG, PNG, GIF, WebP, or SVG files only",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const response = await apiClient.uploadImage(file)

      if (response.success) {
        const imageUrl = response.data.url
        insertImage(imageUrl, file.name)
        toast({
          title: "Image uploaded successfully",
          description: "Image has been added to your content",
        })
      } else {
        throw new Error(response.message || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Image upload error:', error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const insertImage = (src: string, alt: string = "") => {
    if (editorRef.current) {
      const img = document.createElement('img')
      img.src = src
      img.alt = alt
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
      img.style.cursor = 'pointer'
      img.className = 'editor-image'
      
      // Add click handler for image selection
      img.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelectedImage(img)
      })
      
      // Insert at cursor position
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(img)
        range.collapse(false)
      } else {
        // If no selection, append to end
        editorRef.current.appendChild(img)
      }
      
      editorRef.current.focus()
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleImageUrlInsert = () => {
    if (imageUrl.trim()) {
      insertImage(imageUrl, imageAlt)
      setImageUrl("")
      setImageAlt("")
      setIsImageDialogOpen(false)
      toast({
        title: "Image inserted",
        description: "Image has been added to your content",
      })
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const resetImageSize = () => {
    if (selectedImage) {
      selectedImage.style.width = ''
      selectedImage.style.height = ''
      selectedImage.style.maxWidth = '100%'
      onChange(editorRef.current?.innerHTML || '')
      setSelectedImage(null)
      toast({
        title: "Image size reset",
        description: "Image has been reset to original size",
      })
    }
  }

  const alignImage = (alignment: string) => {
    if (selectedImage) {
      selectedImage.style.display = 'block'
      selectedImage.style.margin = '0 auto'
      
      switch (alignment) {
        case 'left':
          selectedImage.style.margin = '0'
          selectedImage.style.float = 'left'
          break
        case 'center':
          selectedImage.style.margin = '0 auto'
          selectedImage.style.float = 'none'
          break
        case 'right':
          selectedImage.style.margin = '0'
          selectedImage.style.float = 'right'
          break
      }
      
      onChange(editorRef.current?.innerHTML || '')
      toast({
        title: "Image aligned",
        description: `Image aligned to ${alignment}`,
      })
    }
  }

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!selectedImage) return
    
    setIsResizing(true)
    setResizeHandle(handle)
    
    const rect = selectedImage.getBoundingClientRect()
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !selectedImage) return
    
    const deltaX = e.clientX - resizeStart.x
    const deltaY = e.clientY - resizeStart.y
    
    let newWidth = resizeStart.width
    let newHeight = resizeStart.height
    
    switch (resizeHandle) {
      case 'se':
        newWidth = resizeStart.width + deltaX
        newHeight = resizeStart.height + deltaY
        break
      case 'sw':
        newWidth = resizeStart.width - deltaX
        newHeight = resizeStart.height + deltaY
        break
      case 'ne':
        newWidth = resizeStart.width + deltaX
        newHeight = resizeStart.height - deltaY
        break
      case 'nw':
        newWidth = resizeStart.width - deltaX
        newHeight = resizeStart.height - deltaY
        break
    }
    
    // Minimum size constraints
    newWidth = Math.max(50, newWidth)
    newHeight = Math.max(50, newHeight)
    
    selectedImage.style.width = `${newWidth}px`
    selectedImage.style.height = `${newHeight}px`
    selectedImage.style.maxWidth = 'none'
  }

  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false)
      setResizeHandle("")
      onChange(editorRef.current?.innerHTML || '')
    }
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, resizeHandle, resizeStart])

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {/* Enhanced Toolbar */}
      <div className="border border-gray-300 rounded-t-md bg-gray-50">
        {/* Main Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b">
          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("bold")}
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("italic")}
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("underline")}
              className="h-8 w-8 p-0"
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("justifyLeft")}
              className="h-8 w-8 p-0"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("justifyCenter")}
              className="h-8 w-8 p-0"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("justifyRight")}
              className="h-8 w-8 p-0"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("insertUnorderedList")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("insertOrderedList")}
              className="h-8 w-8 p-0"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Links and Images */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = prompt("Enter URL:")
                if (url) formatText("createLink", url)
              }}
              className="h-8 w-8 p-0"
            >
              <Link className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsImageDialogOpen(true)}
              className="h-8 w-8 p-0"
            >
              <Image className="h-4 w-4" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Emoji Picker */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="h-8 w-8 p-0"
            >
              😀
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Tables */}
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  Table
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Insert Table</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[2, 3, 4, 5].map(rows => (
                  <DropdownMenuItem key={rows} onClick={() => insertTable(rows, 3)}>
                    {rows} x 3 Table
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Code Block */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={insertCodeBlock}
              className="h-8 px-2"
            >
              &lt;/&gt;
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Merge Tags */}
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <User className="h-4 w-4 mr-1" />
                  Merge Tags
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Contact Fields</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => insertMergeTag('fullName')}>
                  <User className="h-4 w-4 mr-2" />
                  {'{{fullName}}'} - Full Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertMergeTag('email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  {'{{email}}'} - Email Address
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertMergeTag('company')}>
                  <Building className="h-4 w-4 mr-2" />
                  {'{{company}}'} - Company
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertMergeTag('workPhone')}>
                  <Phone className="h-4 w-4 mr-2" />
                  {'{{workPhone}}'} - Work Phone
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertMergeTag('mobilePhone')}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  {'{{mobilePhone}}'} - Mobile Phone
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertMergeTag('role')}>
                  <Briefcase className="h-4 w-4 mr-2" />
                  {'{{role}}'} - Job Role
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Location</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => insertMergeTag('address')}>
                  <MapPin className="h-4 w-4 mr-2" />
                  {'{{address}}'} - Full Address
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertMergeTag('city')}>
                  <MapPin className="h-4 w-4 mr-2" />
                  {'{{city}}'} - City
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertMergeTag('state')}>
                  <MapPin className="h-4 w-4 mr-2" />
                  {'{{state}}'} - State
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertMergeTag('zip')}>
                  <MapPin className="h-4 w-4 mr-2" />
                  {'{{zip}}'} - ZIP Code
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Secondary Toolbar */}
        <div className="flex items-center gap-2 p-2 border-b">
          {/* Text Format */}
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => formatText("formatBlock", e.target.value)}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
              defaultValue=""
            >
              <option value="">Format</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="h5">Heading 5</option>
              <option value="h6">Heading 6</option>
              <option value="p">Paragraph</option>
              <option value="blockquote">Quote</option>
            </select>

            {/* Text Color */}
            <select
              onChange={(e) => formatText("foreColor", e.target.value)}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
              defaultValue=""
            >
              <option value="">Text Color</option>
              <option value="#000000">Black</option>
              <option value="#FF0000">Red</option>
              <option value="#00FF00">Green</option>
              <option value="#0000FF">Blue</option>
              <option value="#FFFF00">Yellow</option>
              <option value="#FF00FF">Magenta</option>
              <option value="#00FFFF">Cyan</option>
              <option value="#FFA500">Orange</option>
              <option value="#800080">Purple</option>
              <option value="#008000">Dark Green</option>
              <option value="#000080">Navy</option>
            </select>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Word/Character Count */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Words: {wordCount}</span>
            <span>Characters: {charCount}</span>
          </div>
        </div>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="border border-gray-300 rounded-md p-3 bg-white shadow-lg max-h-48 overflow-y-auto">
          <div className="grid grid-cols-10 gap-1">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="p-1 text-lg hover:bg-gray-100 rounded cursor-pointer"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Merge Tags Panel */}
      {showPersonalization && (
        <div className="border border-gray-300 rounded-md p-3 bg-white shadow-lg">
          <h4 className="font-semibold mb-2 text-sm">Personalization Settings</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Default Greeting:</span>
              <select className="border rounded px-2 py-1">
                <option>Hi {'{{fullName}}'},</option>
                <option>Hello {'{{fullName}}'},</option>
                <option>Dear {'{{fullName}}'},</option>
                <option>Greetings {'{{fullName}}'},</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span>Fallback Name:</span>
              <input 
                type="text" 
                placeholder="Friend" 
                className="border rounded px-2 py-1 w-24"
                defaultValue="Friend"
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Include Unsubscribe:</span>
              <input type="checkbox" defaultChecked className="ml-2" />
            </div>
            <div className="flex items-center justify-between">
              <span>Include Web Version:</span>
              <input type="checkbox" defaultChecked className="ml-2" />
            </div>
          </div>
        </div>
      )}

      {/* Image URL Dialog */}
      {isImageDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Insert Image</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="imageAlt">Alt Text (optional)</Label>
                <input
                  id="imageAlt"
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Description of the image"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsImageDialogOpen(false)
                    setImageUrl("")
                    setImageAlt("")
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImageUrlInsert}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="min-h-[200px] p-3 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{ minHeight: "200px" }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Resize Handles Overlay */}
      {selectedImage && (
        <div
          className="absolute pointer-events-none z-40"
          style={{
            left: selectedImage.offsetLeft,
            top: selectedImage.offsetTop,
            width: selectedImage.offsetWidth,
            height: selectedImage.offsetHeight,
          }}
        >
          {/* Corner handles only */}
          <div
            className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize pointer-events-auto shadow-lg"
            style={{ left: -8, top: -8 }}
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
          <div
            className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize pointer-events-auto shadow-lg"
            style={{ right: -8, top: -8 }}
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          <div
            className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize pointer-events-auto shadow-lg"
            style={{ left: -8, bottom: -8 }}
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          <div
            className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-se-resize pointer-events-auto shadow-lg"
            style={{ right: -8, bottom: -8 }}
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />
        </div>
      )}

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        .editor-image {
          position: relative;
          transition: all 0.2s ease;
        }
        
        .editor-image:hover {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        .editor-image.selected {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}
