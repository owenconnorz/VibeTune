import { redirect } from "next/navigation"

export default function SharePage({ params }: { params: { id: string } }) {
  // Redirect to the main app with the video ID
  redirect(`/dashboard?play=${params.id}`)
}
