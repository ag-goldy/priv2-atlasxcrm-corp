import { CommPref } from "@prisma/client"

import { prisma } from "../../lib/prisma"

function CommBadge({ pref }: { pref?: CommPref | null }) {
  if (!pref) {
    return <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">None</span>
  }

  const styles: Record<CommPref, string> = {
    WHATSAPP: "bg-green-500/20 text-green-200 border-green-400/60",
    TELEGRAM: "bg-sky-500/20 text-sky-200 border-sky-400/60",
    EMAIL: "bg-amber-500/20 text-amber-200 border-amber-400/60",
  }

  const labels: Record<CommPref, string> = {
    WHATSAPP: "WhatsApp",
    TELEGRAM: "Telegram",
    EMAIL: "Email",
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${styles[pref]}`}
    >
      {labels[pref]}
    </span>
  )
}

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { clientName: "asc" },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          companyId: true,
        },
      },
      deals: {
        where: {
          OR: [{ isLost: false }, { isLost: null }],
          isCompleted: false,
        },
        select: { id: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Customers</h1>
        <p className="text-sm text-slate-400">Contact preferences and active opportunities.</p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-slate-800/70 bg-slate-900/40">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/60 text-xs tracking-wide text-slate-400 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                Client Name
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Company
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Comm Preference
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Active Deals
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((customer) => {
                const activeDeals = customer.deals.length
                return (
                  <tr key={customer.id} className="hover:bg-slate-900/70">
                    <th scope="row" className="px-4 py-3 text-left font-medium text-white">
                      {customer.clientName}
                    </th>
                    <td className="px-4 py-3 text-slate-300">
                      <div className="flex flex-col text-sm">
                        <span>{customer.company?.name ?? "—"}</span>
                        {customer.company?.companyId && (
                          <span className="text-xs text-slate-500">{customer.company.companyId}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <CommBadge pref={customer.commPref} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-200">{activeDeals}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
