import { SiteFooter } from "@/components/site-footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header is provided by root layout. Do not render here. */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold">FAQs</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Answers to common questions. Need more details? Visit Contact Us and send a quick message.
        </p>

        <div className="mt-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Do you support export to Excel and PDF?</AccordionTrigger>
              <AccordionContent>
                Yes. Create’N’Order provides one‑click export to CSV (Excel) and print‑ready PDF with totals for boxes,
                pcs, kg, and m³.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I manage categories and subcategories?</AccordionTrigger>
              <AccordionContent>
                Yes. Use the Admin panel → Categories to create, edit, and delete categories and nested subcategories.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Do you support container planning?</AccordionTrigger>
              <AccordionContent>
                We show live totals against common container capacities (20’, 40’, 40HC) so you can plan loads quickly.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
