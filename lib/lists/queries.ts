import { FileLabel } from "@prisma/client"

import { prisma } from "../prisma"

export type ListItem = {
  id: string
  company: string
  project: string
  url: string
}

export async function getListByLabel(label: FileLabel): Promise<ListItem[]> {
  const files = await prisma.fileLink.findMany({
    where: {
      label,
      deal: {
        isLost: false,
      },
    },
    select: {
      id: true,
      webUrl: true,
      deal: {
        select: {
          projectName: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      deal: {
        projectName: "asc",
      },
    },
  })

  return files
    .filter((file) => file.webUrl)
    .map((file) => ({
      id: file.id,
      company: file.deal.company.name,
      project: file.deal.projectName,
      url: file.webUrl,
    }))
}
