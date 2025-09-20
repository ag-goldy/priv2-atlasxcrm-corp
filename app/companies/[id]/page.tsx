import { CommPref, DealStatus } from "@prisma/client"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ensureFolderWithWebUrl, graphApp } from "../../../lib/graph"
import { prisma } from "../../../lib/prisma"

const STATUS_ORDER: DealStatus[] = [
  DealStatus.NOT_STARTED,
  DealStatus.PENDING_TO_QUOTE,
  DealStatus.PENDING_VENDOR_QUOTE,
  DealStatus.WAITING_FOR_PO,
  DealStatus.WAITING_FOR_CONFIRMATION,
  DealStatus.IN_PRE_SALES_STAGE,
]

function formatCommPref(pref?: CommPref | null) {
  if (!pref) return "—"
  switch (pref) {
    case CommPref.WHATSAPP:
      return "WhatsApp"
    case CommPref.TELEGRAM:
      return "Telegram"
    case CommPref.EMAIL:
      return "Email"
    default:
      return pref
  }
}

async function getCompany(id: string) {
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      customers: {
        orderBy: { clientName: "asc" },
      },
      deals: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          projectName: true,
          status: true,
          type: true,
          isLost: true,
          isCompleted: true,
          spWebUrl: true,
        },
      },
    },
  })

  if (!company) {
    return null
  }

  let graphClient: Awaited<ReturnType<typeof graphApp>> | null = null

  async function resolveFolderUrl(driveId?: string | null, basePath?: string | null) {
    if (!driveId || !basePath) {
      return null
    }

    try {
      if (!graphClient) {
        graphClient = await graphApp()
      }
      const folder = await ensureFolderWithWebUrl(graphClient, driveId, basePath)
      return folder.webUrl ?? null
    } catch (error) {
      console.warn("Failed to resolve folder URL", { driveId, basePath, error })
      return null
    }
  }

  const basePath = company.spBaseFolderName ?? undefined

  const [salesUrl, projectsUrl, financeUrl] = await Promise.all([
    resolveFolderUrl(company.spSalesDriveId, basePath),
    resolveFolderUrl(company.spProjectsDriveId, basePath),
    resolveFolderUrl(company.spFinanceDriveId, basePath),
  ])

  return {
    ...company,
    basePath,
    salesUrl,
    projectsUrl,
    financeUrl,
  }
}

function CompanyFolders({
  salesUrl,
  projectsUrl,
  financeUrl,
}: {
  salesUrl: string | null
  projectsUrl: string | null
  financeUrl: string | null
}) {
  const links = [
    { label: "Sales", href: salesUrl },
    { label: "Projects", href: projectsUrl },
    { label: "Finance", href: financeUrl },
  ]

  return (
    <ul className="flex flex-wrap gap-3">
      {links.map(({ label, href }) => (
        <li key={label}>
          {href ? (
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-blue-500/40 px-3 py-1.5 text-xs font-medium text-blue-200 transition hover:border-blue-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Open {label}
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-500">
              {label} folder unavailable
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

function DealsByStatus({
  deals,
}: {
  deals: Array<{
    id: string
    projectName: string
    status: DealStatus
    type: string
    isLost: boolean
    isCompleted: boolean
    spWebUrl: string | null
  }>
}) {
  if (deals.length === 0) {
    return <p className="text-sm text-slate-400">No deals yet.</p>
  }

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: deals.filter((deal) => deal.status === status && !deal.isLost),
  }))

  const closedDeals = deals.filter((deal) => deal.isLost || deal.isCompleted)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {grouped.map(({ status, items }) => (
        <section key={status} className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-slate-200">{status.replace(/_/g, " ")}</h3>
          {items.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No deals in this stage.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              {items.map((deal) => (
                <li key={deal.id} className="flex items-center justify-between gap-3">
                  <span className="truncate" title={deal.projectName}>
                    {deal.projectName}
                  </span>
                  {deal.spWebUrl && (
                    <Link
                      href={deal.spWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-300 hover:text-white"
                    >
                      Folder
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-4 md:col-span-2">
        <h3 className="text-sm font-semibold text-slate-200">Closed / Lost</h3>
        {closedDeals.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No closed or lost deals.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm text-slate-200">
            {closedDeals.map((deal) => (
              <li key={deal.id} className="flex items-center justify-between gap-3">
                <span className="truncate" title={deal.projectName}>
                  {deal.projectName}
                </span>
                <span className="text-xs text-slate-400">{deal.isCompleted ? "Completed" : "Lost"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const company = await getCompany(params.id)

  if (!company) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs tracking-wide text-slate-500 uppercase">Company</p>
        <h1 className="text-2xl font-semibold text-white">{company.name}</h1>
        <p className="text-sm text-slate-400">Company ID: {company.companyId}</p>
      </header>

      <section className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-slate-200">Details</h2>
        <dl className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">Address</dt>
            <dd>{company.address ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">Sub Address</dt>
            <dd>{company.subAddress ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">Office Number</dt>
            <dd>{company.officeNumber ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">SharePoint Base Folder</dt>
            <dd>{company.basePath ?? "—"}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <h3 className="text-xs tracking-wide text-slate-500 uppercase">Shortcuts</h3>
          <CompanyFolders
            salesUrl={company.salesUrl}
            projectsUrl={company.projectsUrl}
            financeUrl={company.financeUrl}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Customers</h2>
          <span className="text-xs text-slate-500">{company.customers.length} total</span>
        </div>
        {company.customers.length === 0 ? (
          <p className="text-sm text-slate-400">No customers linked to this company.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-800/70">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/60 text-xs tracking-wide text-slate-400 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left">
                    Client
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Mobile
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Preference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {company.customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-900/70">
                    <th scope="row" className="px-4 py-2 text-left font-medium text-white">
                      {customer.clientName}
                    </th>
                    <td className="px-4 py-2 text-slate-300">{customer.mobileNumber ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-300">{formatCommPref(customer.commPref)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Deals</h2>
          <span className="text-xs text-slate-500">{company.deals.length} total</span>
        </div>
        <DealsByStatus deals={company.deals} />
      </section>
    </div>
  )
}
