"use client"

import type { Configuration } from "@azure/msal-browser"
import { PublicClientApplication } from "@azure/msal-browser"
import { MsalProvider } from "@azure/msal-react"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"

import { env } from "../env.mjs"

const clientId = env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID
const tenantId = env.NEXT_PUBLIC_AZURE_AD_TENANT_ID

if (!clientId || !tenantId) {
  throw new Error(
    "MSAL configuration requires NEXT_PUBLIC_AZURE_AD_CLIENT_ID and NEXT_PUBLIC_AZURE_AD_TENANT_ID to be defined."
  )
}

const baseMsalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
}

type ProvidersProps = {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const msalInstance = useMemo(() => {
    const authConfig = {
      ...baseMsalConfig,
      auth: {
        ...baseMsalConfig.auth,
        redirectUri: typeof window === "undefined" ? undefined : window.location.origin,
      },
    }

    return new PublicClientApplication(authConfig)
  }, [])

  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let mounted = true

    msalInstance
      .initialize()
      .catch((error) => {
        console.error("MSAL initialization failed", error)
      })
      .finally(() => {
        if (mounted) {
          setIsReady(true)
        }
      })

    return () => {
      mounted = false
    }
  }, [msalInstance])

  if (!isReady) {
    return null
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>
}

export default Providers
