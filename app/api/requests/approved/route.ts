import { NextResponse } from "next/server"
import { getApprovedRequests } from "@/app/dashboard/browse-requests/actions"

export async function GET() {
  try {
    const requests = await getApprovedRequests()
    return NextResponse.json(requests)
  } catch (error) {
    console.error("Error fetching approved requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    )
  }
}