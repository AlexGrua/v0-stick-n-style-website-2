import HomeBuilder from "@/components/admin/home-builder"

export default function AdminHomePage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Home Editor</h1>
        <p className="text-sm text-muted-foreground">
          Edit texts and images inside each block. Use Up/Down to change order. Save Changes to persist. Publish to go
          live.
        </p>
      </div>
      <HomeBuilder />
    </main>
  )
}
