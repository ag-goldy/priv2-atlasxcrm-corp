import { ParticipantKind } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "../../../../../lib/prisma"

const participantSchema = z.object({
  dealId: z.string().cuid("Invalid deal identifier"),
  kind: z.nativeEnum(ParticipantKind),
  companyName: z.string().min(1, "Company name is required"),
  pocName: z.string().optional(),
  pocContact: z.string().optional(),
  pocEmail: z.string().email("Invalid email address").optional(),
  productBrand: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const payload = participantSchema.parse(json)

    const participant = await prisma.participant.create({
      data: {
        dealId: payload.dealId,
        kind: payload.kind,
        companyName: payload.companyName,
        pocName: payload.pocName,
        pocContact: payload.pocContact,
        pocEmail: payload.pocEmail,
        productBrand: payload.productBrand,
      },
    })

    return NextResponse.json({ ok: true, participantId: participant.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: error.flatten() }, { status: 400 })
    }

    console.error("Failed to add participant", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Unexpected error occurred while adding the participant.",
      },
      { status: 500 }
    )
  }
}
