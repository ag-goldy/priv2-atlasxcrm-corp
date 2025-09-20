import { CommPref } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "../../../../lib/prisma"

const createCustomerSchema = z.object({
  companyId: z.string().cuid("Invalid company identifier"),
  clientName: z.string().min(1, "Client name is required"),
  mobileNumber: z.string().optional(),
  commPref: z.nativeEnum(CommPref).optional(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const payload = createCustomerSchema.parse(json)

    const customer = await prisma.customer.create({
      data: {
        companyId: payload.companyId,
        clientName: payload.clientName,
        mobileNumber: payload.mobileNumber,
        commPref: payload.commPref,
      },
    })

    return NextResponse.json({ ok: true, customerId: customer.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: error.flatten() }, { status: 400 })
    }

    console.error("Failed to create customer", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Unexpected error occurred while creating the customer.",
      },
      { status: 500 }
    )
  }
}
