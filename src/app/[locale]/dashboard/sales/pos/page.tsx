import { getCurrentStore } from "@/lib/store"
import { redirect } from "next/navigation"
import { PosScreenContent } from "./pos-screen-content"

export default async function PosScreenPage() {
  const store = await getCurrentStore()
  if (!store) redirect("/")
  return <PosScreenContent storeId={store.id} />
}
