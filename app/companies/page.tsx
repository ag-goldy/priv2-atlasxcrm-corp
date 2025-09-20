import Link from "next/link"

import { getCompanySummaries } from "./actions"

export default async function CompaniesPage() {
  const summaries = await getCompanySummaries()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Companies</h1>
        <p className="text-sm text-slate-400">Overview of organizations and their deal activity.</p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-slate-800/60 bg-slate-900/40">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/60 text-xs tracking-wide text-slate-400 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                Company
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Company ID
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Address
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Active
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Confirmed
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Completed
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Lost
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Sales
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Projects
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Finance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {summaries.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-slate-400">
                  No companies yet.
                </td>
              </tr>
            ) : (
              summaries.map((company) => (
                <tr key={company.id} className="hover:bg-slate-900/70">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-white">
                    {company.name}
                  </th>
                  <td className="px-4 py-3 text-left text-slate-300">{company.companyId}</td>
                  <td className="px-4 py-3 text-left text-slate-400">
                    {company.address ? company.address : <span className="text-slate-500 italic">Not set</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-200">{company.activeDeals}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{company.confirmedDeals}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{company.completedDeals}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{company.lostDeals}</td>
                  <td className="px-4 py-3 text-left">
                    {company.salesUrl ? (
                      <Link
                        href={company.salesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-md border border-blue-500/40 px-3 py-1 text-xs font-medium text-blue-300 transition hover:border-blue-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      >
                        Open
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-500">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-left">
                    {company.projectsUrl ? (
                      <Link
                        href={company.projectsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-md border border-blue-500/40 px-3 py-1 text-xs font-medium text-blue-300 transition hover:border-blue-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      >
                        Open
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-500">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-left">
                    {company.financeUrl ? (
                      <Link
                        href={company.financeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-md border border-blue-500/40 px-3 py-1 text-xs font-medium text-blue-300 transition hover:border-blue-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      >
                        Open
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-500">N/A</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
