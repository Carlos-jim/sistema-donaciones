import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getApprovedRequests } from "@/app/dashboard/browse-requests/actions"
import { tokenService } from "@/lib/auth/token.service"

export async function GET() {
  try {
    const token = (await cookies()).get("auth-token")?.value
    const payload = token ? await tokenService.verify(token) : null
    const requests = await getApprovedRequests(payload?.userId)

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Error fetching approved requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    )
  }
}
