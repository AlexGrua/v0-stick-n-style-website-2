import { ContactsHeroData } from "@/lib/blocks/types"

interface ContactsHeroProps extends ContactsHeroData {}

export default function ContactsHero(props: ContactsHeroProps) {
  const data = props
  console.log('[ContactsHero] Rendering with data:', data)
  
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-semibold">{data.title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{data.subtitle}</p>
    </div>
  )
}
