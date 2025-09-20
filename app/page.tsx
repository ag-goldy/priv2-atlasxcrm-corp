"use client"

import type { AuthenticationResult } from "@azure/msal-browser"
import { useMsal } from "@azure/msal-react"
import { useCallback, useEffect, useState } from "react"

const LOGIN_SCOPES = ["User.Read", "Sites.ReadWrite.All", "Files.ReadWrite.All", "offline_access"]

export default function HomePage() {
  const { instance, accounts } = useMsal()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upn, setUpn] = useState<string | null>(null)

  useEffect(() => {
    if (accounts.length > 0) {
      setUpn(accounts[0]?.username ?? null)
    }
  }, [accounts])

  const handleSignIn = useCallback(async () => {
    setIsSigningIn(true)
    setError(null)

    try {
      const result: AuthenticationResult = await instance.loginPopup({ scopes: LOGIN_SCOPES })
      if (result.account) {
        instance.setActiveAccount(result.account)
        setUpn(result.account.username ?? null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in"
      setError(message)
    } finally {
      setIsSigningIn(false)
    }
  }, [instance])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-white">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-slate-900/60 p-8 shadow-xl backdrop-blur">
        <h1 className="text-3xl font-semibold">Welcome</h1>
        <p className="text-sm text-slate-300">Sign in with your Microsoft work or school account to continue.</p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/70"
        >
          {isSigningIn ? "Signing in…" : "Sign in with Microsoft"}
        </button>

        {upn && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm">
            <p className="font-semibold text-slate-200">Signed in as</p>
            <p className="mt-1 break-words text-slate-100">{upn}</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
