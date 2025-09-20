import { DealStatus, DealType, FileLabel, Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { ensureFolderWithWebUrl, graphApp } from "../../../../lib/graph"
import { prisma } from "../../../../lib/prisma"

const dealSchema = z.object({
  companyId: z.string().cuid("Invalid company identifier"),
  customerId: z.string().cuid("Invalid customer identifier").optional(),
  projectName: z.string().min(1, "Project name is required"),
  type: z.nativeEnum(DealType),
  status: z.nativeEnum(DealStatus),
  ownerUpn: z.string().min(1, "Deal owner UPN is required"),
  estimatedSize: z.number().positive("Estimated size must be positive").optional(),
})

const salesSubfolderDefs = [
  { name: "Quotes", label: FileLabel.QUOTES },
  { name: "Purchase Orders", label: FileLabel.PURCHASE_ORDERS },
  { name: "Agreements", label: FileLabel.AGREEMENTS },
] as const

const projectsSubfolderDefs = [
  { name: "Service Reports", label: FileLabel.SERVICE_REPORTS },
  { name: "Handover Reports", label: FileLabel.HANDOVER_REPORTS },
  { name: "Delivery Orders", label: FileLabel.DELIVERY_ORDERS },
] as const

const financeSubfolderDefs = [
  { name: "Invoices", label: FileLabel.INVOICES },
  { name: "Credit Notes", label: FileLabel.CREDIT_NOTES },
  { name: "Receipts", label: FileLabel.RECEIPTS },
] as const

function toFileLink(driveId: string, label: FileLabel, item: { id?: string; webUrl?: string }) {
  if (!item?.id || !item.webUrl) {
    throw new Error(`Missing drive item metadata for label ${label}`)
  }

  return {
    label,
    driveId,
    itemId: item.id,
    webUrl: item.webUrl,
  }
}

function formatSequence(seq: number) {
  return seq.toString().padStart(4, "0")
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const payload = dealSchema.parse(json)

    const company = await prisma.company.findUnique({
      where: { id: payload.companyId },
      select: {
        id: true,
        companyId: true,
        name: true,
        spBaseFolderName: true,
        spSalesDriveId: true,
        spProjectsDriveId: true,
        spFinanceDriveId: true,
      },
    })

    if (!company) {
      return NextResponse.json(
        {
          ok: false,
          message: "Company not found.",
        },
        { status: 404 }
      )
    }

    if (
      !company.spBaseFolderName ||
      !company.spSalesDriveId ||
      !company.spProjectsDriveId ||
      !company.spFinanceDriveId
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Company is missing required SharePoint configuration.",
        },
        { status: 400 }
      )
    }

    const dealCount = await prisma.deal.count({ where: { companyId: payload.companyId } })
    const nextSequence = formatSequence(dealCount + 1)

    const folderName = `${nextSequence} - ${payload.projectName}`
    const basePath = `${company.spBaseFolderName}/${folderName}`

    const graphClient = await graphApp()

    const salesFolder = await ensureFolderWithWebUrl(graphClient, company.spSalesDriveId, basePath)

    const [salesSubfolders, projectsSubfolders, financeSubfolders] = await Promise.all([
      Promise.all(
        salesSubfolderDefs.map(async (def) => ({
          label: def.label,
          item: await ensureFolderWithWebUrl(graphClient, company.spSalesDriveId, `${basePath}/${def.name}`),
        }))
      ),
      Promise.all(
        projectsSubfolderDefs.map(async (def) => ({
          label: def.label,
          item: await ensureFolderWithWebUrl(graphClient, company.spProjectsDriveId, `${basePath}/${def.name}`),
        }))
      ),
      Promise.all(
        financeSubfolderDefs.map(async (def) => ({
          label: def.label,
          item: await ensureFolderWithWebUrl(graphClient, company.spFinanceDriveId, `${basePath}/${def.name}`),
        }))
      ),
    ])

    if (!salesFolder.id || !salesFolder.webUrl) {
      throw new Error("Unable to resolve Sales base folder metadata")
    }

    const fileLinksData = [
      ...salesSubfolders.map(({ label, item }) => toFileLink(company.spSalesDriveId, label, item)),
      ...projectsSubfolders.map(({ label, item }) => toFileLink(company.spProjectsDriveId, label, item)),
      ...financeSubfolders.map(({ label, item }) => toFileLink(company.spFinanceDriveId, label, item)),
    ]

    const deal = await prisma.deal.create({
      data: {
        companyId: payload.companyId,
        customerId: payload.customerId,
        projectName: payload.projectName,
        type: payload.type,
        status: payload.status,
        ownerUpn: payload.ownerUpn,
        estimatedSize: payload.estimatedSize !== undefined ? new Prisma.Decimal(payload.estimatedSize) : undefined,
        spSalesItemId: salesFolder.id ?? null,
        spWebUrl: salesFolder.webUrl ?? null,
        files: {
          create: fileLinksData,
        },
      },
    })

    return NextResponse.json({ ok: true, dealId: deal.id, folder: deal.spWebUrl })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: error.flatten() }, { status: 400 })
    }

    console.error("Failed to create deal", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Unexpected error occurred while creating the deal.",
      },
      { status: 500 }
    )
  }
}
