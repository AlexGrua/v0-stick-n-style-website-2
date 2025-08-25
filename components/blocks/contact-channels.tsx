import { ContactChannelsData } from "@/lib/blocks/types"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone, MessageCircleMore, SendHorizonal } from "lucide-react"
import { useT } from "@/lib/i18n"

interface ContactChannelsProps extends ContactChannelsData {}

const iconMap = {
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircleMore,
  telegram: SendHorizonal,
}

export default function ContactChannels(props: ContactChannelsProps) {
  const data = props
  const t = useT()

  const visibleItems = data.items.filter(item => item.visible)

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <Card>
      <CardContent className="grid gap-2 p-4">
        {visibleItems.map((item, index) => {
          const IconComponent = item.iconKey ? iconMap[item.iconKey] : null
          
          return (
            <div key={index} className="flex items-center gap-2">
              {IconComponent && <IconComponent className="h-4 w-4 text-emerald-600" />}
              {item.href ? (
                <a href={item.href} className="hover:underline">
                  {item.value}
                </a>
              ) : (
                <span>{item.value}</span>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
