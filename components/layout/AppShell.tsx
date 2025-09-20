"use client"

import { useMsal } from "@azure/msal-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const navItems = [
  { href: "/companies", label: "Companies" },
  { href: "/customers", label: "Customers" },
  { href: "/deals", label: "Deals" },
  { href: "/lists", label: "Lists" },
  { href: "/admin", label: "Admin" },
]

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { instance, accounts } = useMsal()
  const [upn, setUpn] = useState<string>("")

  useEffect(() => {
    const active = instance.getActiveAccount() ?? accounts[0]
    setUpn(active?.username ?? "")
  }, [accounts, instance])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col md:flex-row">
        <nav
          aria-label="Primary"
          className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-800/80 px-4 py-3 md:w-64 md:flex-col md:items-stretch md:border-r md:border-b-0"
        >
          <p className="w-full text-sm font-semibold tracking-wide text-slate-400 uppercase">Navigation</p>
          <ul className="flex w-full flex-1 flex-wrap items-center gap-2 md:flex-col md:items-stretch">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={classNames(
                      "block rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                      isActive ? "bg-blue-500/20 text-white" : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex flex-1 flex-col">
          <header className="flex flex-col gap-1 border-b border-slate-800/80 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-base font-semibold text-white">AtlasX CRM</h1>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-xs tracking-wide text-slate-500 uppercase">Signed in as</span>
              <span className="truncate text-sm font-medium" title={upn}>
                {upn || "Unknown user"}
              </span>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppShell
