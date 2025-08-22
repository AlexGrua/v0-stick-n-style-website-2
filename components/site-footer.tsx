"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Instagram, MessageCircleMore, Phone, Mail, SendHorizonal } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="container mx-auto grid gap-10 px-4 py-10 md:grid-cols-3">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Contact</h3>
          <p className="text-sm text-muted-foreground">
            Shenzhen, China
            <br />
            Phone: +86 123 456 789
            <br />
            Email: hello@sticknstyle.com
          </p>
          <div className="flex items-center gap-3 pt-1">
            <Button variant="outline" size="icon" aria-label="WhatsApp">
              <MessageCircleMore className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Telegram">
              <SendHorizonal className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="WeChat">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Mini inquiry</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              alert("Thanks! We will contact you shortly.")
            }}
            className="grid gap-3"
          >
            <Input placeholder="Phone or Email" aria-label="Phone or Email" />
            <Textarea placeholder="Your question" aria-label="Your question" />
            <Button type="submit">Send</Button>
          </form>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Quick links</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>FAQs</li>
            <li>Shipping & Logistics</li>
            <li>Quality & Warranty</li>
            <li>Become a Partner</li>
          </ul>
          <div className="rounded-lg border p-3 text-xs text-muted-foreground">
            Embedded messenger widget placeholder
          </div>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Stick&apos;N&apos;Style. All rights reserved.
      </div>
    </footer>
  )
}
