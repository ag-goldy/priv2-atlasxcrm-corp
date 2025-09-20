"use client"

import { DealStatus, DealType } from "@prisma/client"
import Link from "next/link"
import { useMemo, useState } from "react"

import type { DealSummary } from "../../lib/deals/queries"

const tabs = [
  { key: "active", label: "Active" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "lost", label: "Lost" },
] as const

const typeStyles: Record<DealType, string> = {
  NEW_OPPORTUNITY: "bg-sky-500/20 text-sky-200 border-sky-400/50",
  CONFIRMED: "bg-emerald-500/20 text-emerald-200 border-emerald-400/50",
  THIRD_QUOTE: "bg-violet-500/20 text-violet-200 border-violet-400/50",
  UPCOMING: "bg-amber-500/20 text-amber-200 border-amber-400/50",
}

const statusStyles: Partial<Record<DealStatus, string>> = {
  NOT_STARTED: "bg-slate-500/20 text-slate-200 border-slate-400/50",
  PENDING_TO_QUOTE: "bg-blue-500/20 text-blue-200 border-blue-400/50",
  PENDING_VENDOR_QUOTE: "bg-indigo-500/20 text-indigo-200 border-indigo-400/50",
  WAITING_FOR_PO: "bg-teal-500/20 text-teal-200 border-teal-400/50",
  WAITING_FOR_CONFIRMATION: "bg-amber-500/20 text-amber-200 border-amber-400/50",
  IN_PRE_SALES_STAGE: "bg-emerald-500/20 text-emerald-200 border-emerald-400/50",
}

type DealsPageClientProps = {
  deals: DealSummary[]
}

function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className ?? ""}`}>
      {children}
    </span>
  )
}

function ParticipantChips({ participants }: { participants: DealSummary["participants"] }) {
  if (participants.length === 0) {
    return <span className="text-xs text-slate-500">No participants yet.</span>
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {participants.map((participant) => (
        <li key={participant.id}>
          <Chip className="border-slate-600/60 bg-slate-800/60 text-slate-200">{participant.companyName}</Chip>
        </li>
      ))}
    </ul>
  )
}

function FolderActions({ files }: { files: DealSummary["files"] }) {
  if (files.length === 0) {
    return <span className="text-xs text-slate-500">No linked folders yet.</span>
  }

  const preferredLabels = new Map<string, string>([
    ["Quotes", "Quotes"],
    ["Purchase Orders", "POs"],
    ["Agreements", "Agreements"],
    ["Service Reports", "Service Reports"],
    ["Handover Reports", "Handover"],
    ["Delivery Orders", "Delivery Orders"],
  ])

  const filtered = files.filter((file) => preferredLabels.has(file.label))

  if (filtered.length === 0) {
    return <span className="text-xs text-slate-500">No quick actions available.</span>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filtered.map((file) => (
        <Link
          key={file.id}
          href={file.webUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md border border-blue-500/40 px-2 py-1 text-xs font-medium text-blue-300 transition hover:border-blue-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {preferredLabels.get(file.label)}
        </Link>
      ))}
    </div>
  )
}

export default function DealsPageClient({ deals }: DealsPageClientProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("active")

  const filteredDeals = useMemo(() => {
    switch (activeTab) {
      case "confirmed":
        return deals.filter((deal) => deal.type === DealType.CONFIRMED && !deal.isLost && !deal.isCompleted)
      case "completed":
        return deals.filter((deal) => deal.isCompleted)
      case "lost":
        return deals.filter((deal) => deal.isLost)
      case "active":
      default:
        return deals.filter((deal) => !deal.isLost && !deal.isCompleted)
    }
  }, [activeTab, deals])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Deals</h1>
          <p className="text-sm text-slate-400">Track opportunity progress and access project collateral.</p>
        </div>
        <div className="flex gap-2 rounded-full border border-slate-800/70 bg-slate-900/40 p-1 text-xs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-3 py-1 font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                activeTab === tab.key ? "bg-blue-500 text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {filteredDeals.length === 0 ? (
        <p className="text-sm text-slate-400">No deals for this tab yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredDeals.map((deal) => (
            <article
              key={deal.id}
              className="flex h-full flex-col gap-4 rounded-lg border border-slate-800/70 bg-slate-900/40 p-4"
            >
              <header className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate text-lg font-semibold text-white" title={deal.projectName}>
                    {deal.projectName}
                  </h2>
                  {deal.estimatedSize && (
                    <span className="text-sm font-medium text-slate-200">
                      ${Number(deal.estimatedSize).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400">{deal.company.name}</p>
                <div className="flex flex-wrap gap-2">
                  <Chip className={typeStyles[deal.type]}>Type: {deal.type.replace(/_/g, " ")}</Chip>
                  <Chip className={statusStyles[deal.status] ?? "border-slate-600/60 text-slate-200"}>
                    Status: {deal.status.replace(/_/g, " ")}
                  </Chip>
                </div>
              </header>

              <section className="space-y-2">
                <h3 className="text-xs tracking-wide text-slate-500 uppercase">Participants</h3>
                <ParticipantChips participants={deal.participants} />
              </section>

              <section className="space-y-2">
                <h3 className="text-xs tracking-wide text-slate-500 uppercase">Quick Actions</h3>
                <FolderActions files={deal.files} />
              </section>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
