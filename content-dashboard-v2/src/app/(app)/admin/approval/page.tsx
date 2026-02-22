import { redirect } from "next/navigation"

// Legacy admin approval page — redirects to new approval workflow
export default function ApprovalPage() {
  redirect("/approve")
}
