"use client"

import { Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <span>Made with</span>
          <Heart className="h-4 w-4 mx-1 text-red-500 fill-current" />
          <span>by</span>
          <a
            href="https://hasnain-ahmed.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 font-medium text-foreground hover:text-primary transition-colors"
          >
            Hasnain Ahmed
          </a>
        </div>
      </div>
    </footer>
  )
}
