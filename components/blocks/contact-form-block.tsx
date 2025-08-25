import { ContactFormBlockData } from "@/lib/blocks/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useT } from "@/lib/i18n"

interface ContactFormBlockProps extends ContactFormBlockData {}

export default function ContactFormBlock(props: ContactFormBlockProps) {
  const data = props
  const t = useT()

  return (
    <Card>
      <CardContent className="p-4">
        {(data.title || data.subtitle || data.description) && (
          <div className="mb-4">
            {data.title && <h2 className="text-xl font-semibold mb-2">{data.title}</h2>}
            {data.subtitle && <p className="text-muted-foreground mb-2">{data.subtitle}</p>}
            {data.description && <p className="text-sm text-muted-foreground">{data.description}</p>}
          </div>
        )}
        
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            alert(t("contact.thanks", "Thanks! We will contact you shortly."))
          }}
        >
          <Input placeholder={t("contact.name", "Your name")} required aria-label={t("contact.name", "Your name")} className="h-10" />
          <Input type="email" placeholder={t("contact.email", "Email")} required aria-label={t("contact.email", "Email")} className="h-10" />
          <Input placeholder={t("contact.phone", "Phone (optional)")} aria-label={t("contact.phone", "Phone (optional)")} className="h-10" />
          <Textarea rows={4} placeholder={t("contact.message", "How can we help?")} required aria-label={t("contact.message", "Message")} className="min-h-[80px]" />
          <div className="flex justify-end">
            <Button type="submit" className="px-5 py-2 text-sm rounded-md bg-lime-500 hover:bg-lime-600">
              {t("contact.send", "Send message")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
