import Link from "next/link"

import type { ListItem } from "../../../lib/lists/queries"

export function ListPage({ title, items }: { title: string; items: ListItem[] }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="text-sm text-slate-400">Quick access to linked SharePoint folders.</p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-slate-800/70 bg-slate-900/40">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/60 text-xs tracking-wide text-slate-400 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                Company
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Project
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Nothing to show yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/70">
                  <td className="px-4 py-3 text-left text-slate-200">{item.company}</td>
                  <td className="px-4 py-3 text-left text-slate-300">{item.project}</td>
                  <td className="px-4 py-3 text-left">
                    <Link
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md border border-blue-500/40 px-3 py-1 text-xs font-medium text-blue-300 transition hover:border-blue-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    >
                      Open
                    </Link>
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
