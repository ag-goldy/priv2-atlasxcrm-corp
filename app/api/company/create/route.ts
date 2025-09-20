import { NextResponse } from "next/server"
import { z } from "zod"

import { ensureFolder, graphApp } from "../../../../lib/graph"
import { prisma } from "../../../../lib/prisma"

const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  companyId: z.string().regex(/^[A-Za-z]{3}\d{4}$/i, "Company ID must be three letters followed by four digits"),
  address: z.string().optional(),
  subAddress: z.string().optional(),
  officeNumber: z.string().optional(),
  spSiteId: z.string().min(1, "Sales drive ID is required"),
  spSalesDriveId: z.string().min(1, "Sales drive ID is required"),
  spProjectsDriveId: z.string().min(1, "Projects drive ID is required"),
  spFinanceDriveId: z.string().min(1, "Finance drive ID is required"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = createCompanySchema.parse(body)

    const spBaseFolderName = `${data.name} - ${data.companyId}`

    const company = await prisma.company.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        companyId: data.companyId,
        address: data.address,
        subAddress: data.subAddress,
        officeNumber: data.officeNumber,
        spSiteId: data.spSiteId,
        spSalesDriveId: data.spSalesDriveId,
        spProjectsDriveId: data.spProjectsDriveId,
        spFinanceDriveId: data.spFinanceDriveId,
        spBaseFolderName,
      },
    })

    const graphClient = await graphApp()

    await Promise.all([
      ensureFolder(graphClient, data.spSalesDriveId, spBaseFolderName),
      ensureFolder(graphClient, data.spProjectsDriveId, spBaseFolderName),
      ensureFolder(graphClient, data.spFinanceDriveId, spBaseFolderName),
    ])

    return NextResponse.json({ ok: true, companyId: company.companyId, baseFolder: spBaseFolderName })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: error.flatten() }, { status: 400 })
    }

    if (error instanceof Error && "code" in error) {
      const code = (error as Error & { code: string }).code
      if (code === "P2002") {
        return NextResponse.json(
          {
            ok: false,
            message: "Company ID already exists.",
          },
          { status: 409 }
        )
      }
    }

    console.error("Failed to create company", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Unexpected error occurred while creating the company.",
      },
      { status: 500 }
    )
  }
}
