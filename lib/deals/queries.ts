import { DealStatus, DealType } from "@prisma/client"

import { prisma } from "../prisma"

export type DealSummary = {
  id: string
  projectName: string
  status: DealStatus
  type: DealType
  isLost: boolean
  isCompleted: boolean
  estimatedSize: string | null
  company: {
    id: string
    name: string
  }
  participants: Array<{
    id: string
    companyName: string
  }>
  files: Array<{
    id: string
    label: string
    webUrl: string
  }>
}

export async function getDeals(): Promise<DealSummary[]> {
  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      participants: {
        select: {
          id: true,
          companyName: true,
        },
      },
      files: {
        select: {
          id: true,
          label: true,
          webUrl: true,
        },
      },
    },
  })

  return deals.map((deal) => ({
    ...deal,
    estimatedSize: deal.estimatedSize?.toString() ?? null,
  }))
}
