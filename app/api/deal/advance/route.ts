import { DealStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { advanceStatus } from "../../../../lib/deals/transitions"

const schema = z.object({
  dealId: z.string().cuid("Invalid deal identifier"),
  actorUpn: z.string().min(1, "actorUpn is required"),
  nextStatus: z.nativeEnum(DealStatus),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { dealId, actorUpn, nextStatus } = schema.parse(json)

    await advanceStatus(dealId, nextStatus, actorUpn)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: "Invalid request", errors: error.flatten() }, { status: 400 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: false, message: "Unexpected error" }, { status: 500 })
  }
}
