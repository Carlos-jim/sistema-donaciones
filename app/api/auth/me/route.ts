import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { tokenService } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const payload = await tokenService.verify(token)

    if (!payload?.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await prisma.usuarioComun.findUnique({
      where: { email: payload.email },
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error getting current user:", error)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}