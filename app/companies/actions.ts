"use server"

import { DealType } from "@prisma/client"

import { ensureFolderWithWebUrl, graphApp } from "../../lib/graph"
import { prisma } from "../../lib/prisma"

export type CompanySummary = {
  id: string
  name: string
  companyId: string
  address: string | null
  activeDeals: number
  confirmedDeals: number
  completedDeals: number
  lostDeals: number
  salesUrl: string | null
  projectsUrl: string | null
  financeUrl: string | null
}

export async function getCompanySummaries(): Promise<CompanySummary[]> {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: {
      deals: {
        select: {
          isLost: true,
          isCompleted: true,
          type: true,
        },
      },
    },
  })

  let graphClient: Awaited<ReturnType<typeof graphApp>> | null = null

  async function ensureGraphClient() {
    if (!graphClient) {
      graphClient = await graphApp()
    }
    return graphClient
  }

  async function resolveFolderUrl(driveId?: string | null, basePath?: string | null) {
    if (!driveId || !basePath) {
      return null
    }

    try {
      const client = await ensureGraphClient()
      const folder = await ensureFolderWithWebUrl(client, driveId, basePath)
      return folder.webUrl ?? null
    } catch (error) {
      console.warn("Failed to resolve folder URL", { driveId, basePath, error })
      return null
    }
  }

  return Promise.all(
    companies.map(async (company) => {
      const deals = company.deals
      const activeDeals = deals.filter((deal) => !deal.isLost && !deal.isCompleted).length
      const confirmedDeals = deals.filter((deal) => !deal.isLost && deal.type === DealType.CONFIRMED).length
      const completedDeals = deals.filter((deal) => deal.isCompleted).length
      const lostDeals = deals.filter((deal) => deal.isLost).length

      const [salesUrl, projectsUrl, financeUrl] = await Promise.all([
        resolveFolderUrl(company.spSalesDriveId, company.spBaseFolderName),
        resolveFolderUrl(company.spProjectsDriveId, company.spBaseFolderName),
        resolveFolderUrl(company.spFinanceDriveId, company.spBaseFolderName),
      ])

      const address = [company.address, company.subAddress, company.officeNumber]
        .filter((part) => part && part.trim())
        .join(", ")

      return {
        id: company.id,
        name: company.name,
        companyId: company.companyId,
        address: address || null,
        activeDeals,
        confirmedDeals,
        completedDeals,
        lostDeals,
        salesUrl,
        projectsUrl,
        financeUrl,
      }
    })
  )
}
