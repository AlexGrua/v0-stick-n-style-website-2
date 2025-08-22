"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Instagram, MessageCircleMore, Phone, Mail, SendHorizonal } from 'lucide-react'
import { useT } from "@/lib/i18n"

export function SiteFooter() {
  const t = useT()
  return (
    <footer className="mt-16 border-t bg-muted/30" suppressHydrationWarning>
      <div className="container mx-auto grid gap-10 px-4 py-10 md:grid-cols-3">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{t('footer.contact','Contact')}</h3>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t('footer.address','Shenzhen, China')}
            <br />
            {t('footer.phone','Phone')}: +86 123 456 789
            <br />
            {t('footer.email','Email')}: hello@sticknstyle.com
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
          <h3 className="text-lg font-semibold">{t('footer.mini_inquiry','Mini inquiry')}</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              alert(t('footer.inquiry_success','Thanks! We will contact you shortly.'))
            }}
            className="grid gap-3"
          >
            <Input placeholder={t('footer.contact_placeholder','Phone or Email')} aria-label={t('footer.contact_placeholder','Phone or Email')} />
            <Textarea placeholder={t('footer.question_placeholder','Your question')} aria-label={t('footer.question_placeholder','Your question')} />
            <Button type="submit">{t('footer.send','Send')}</Button>
          </form>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{t('footer.quick_links','Quick links')}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>{t('footer.links.faqs','FAQs')}</li>
            <li>{t('footer.links.shipping','Shipping & Logistics')}</li>
            <li>{t('footer.links.quality','Quality & Warranty')}</li>
            <li>{t('footer.links.partner','Become a Partner')}</li>
          </ul>
          <div className="rounded-lg border p-3 text-xs text-muted-foreground">
            {t('footer.messenger_placeholder','Embedded messenger widget placeholder')}
          </div>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground" suppressHydrationWarning>
        © {new Date().getFullYear()} Stick&apos;N&apos;Style. {t('footer.rights','All rights reserved.')}
      </div>
    </footer>
  )
}
