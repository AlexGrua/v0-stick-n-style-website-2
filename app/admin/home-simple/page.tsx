import { AdminShell } from "@/components/admin/admin-shell"
import HomeSimpleEditor from "@/components/admin/home-simple-editor"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Home (Simple Editor)",
}

export default function Page() {
  return (
    <AdminShell title="Home (Simple Editor)">
      <HomeSimpleEditor />
    </AdminShell>
  )
}
