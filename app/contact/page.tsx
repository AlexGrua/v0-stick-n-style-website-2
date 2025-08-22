"use client"

import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, MessageCircleMore, SendHorizonal } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header is provided by root layout. Do not render here. */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold">Contact Us</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Tell us about your project or request a quote. We typically respond within one business day.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  alert("Thanks! We will contact you shortly.")
                }}
              >
                <Input placeholder="Your name" required aria-label="Your name" />
                <Input type="email" placeholder="Email" required aria-label="Email" />
                <Input placeholder="Phone (optional)" aria-label="Phone" />
                <Textarea rows={5} placeholder="How can we help?" required aria-label="Message" />
                <Button type="submit" className="bg-lime-500 hover:bg-lime-600">
                  Send message
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardContent className="grid gap-2 p-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-600" /> <span>hello@sticknstyle.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600" /> <span>+86 123 456 789</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircleMore className="h-4 w-4 text-emerald-600" /> <span>WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <SendHorizonal className="h-4 w-4 text-emerald-600" /> <span>Telegram</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="grid place-items-center p-6 text-sm text-muted-foreground">
                Map placeholder
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
