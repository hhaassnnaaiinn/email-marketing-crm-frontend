"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"

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

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value
    }
  }, [])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
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

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {/* Toolbar */}
      <div className="border border-gray-300 rounded-t-md p-2 bg-gray-50 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => formatText("bold")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => formatText("italic")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => formatText("underline")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
          title="Underline"
        >
          <u>U</u>
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => formatText("justifyLeft")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
          title="Align Left"
        >
          ⬅
        </button>
        <button
          type="button"
          onClick={() => formatText("justifyCenter")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
          title="Align Center"
        >
          ↔
        </button>
        <button
          type="button"
          onClick={() => formatText("justifyRight")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
          title="Align Right"
        >
          ➡
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => formatText("insertUnorderedList")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => formatText("insertOrderedList")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
          title="Numbered List"
        >
          1.
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => {
            const url = prompt("Enter URL:")
            if (url) formatText("createLink", url)
          }}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
          title="Insert Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => formatText("unlink")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
          title="Remove Link"
        >
          🔗❌
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <select
          onChange={(e) => formatText("formatBlock", e.target.value)}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
          defaultValue=""
        >
          <option value="">Format</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="p">Paragraph</option>
        </select>
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
        </select>
      </div>

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

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
