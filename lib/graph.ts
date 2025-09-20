import "isomorphic-fetch"

import { ConfidentialClientApplication } from "@azure/msal-node"
import { Client, GraphError } from "@microsoft/microsoft-graph-client"

import { env } from "../env.mjs"

const GRAPH_SCOPE = ["https://graph.microsoft.com/.default"]
const RETRY_DELAY_MS = 500

type GraphDriveItem = {
  id?: string
  webUrl?: string
  name?: string
  [key: string]: unknown
}

const confidentialClient = new ConfidentialClientApplication({
  auth: {
    authority: `https://login.microsoftonline.com/${env.GRAPH_TENANT_ID}`,
    clientId: env.GRAPH_CLIENT_ID,
    clientSecret: env.GRAPH_CLIENT_SECRET,
  },
})

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "statusCode" in error && (error as GraphError).statusCode === 404
  )
}

function sanitizePath(path: string): string {
  return path.replace(/^\/+|\/+$/g, "")
}

function encodeGraphPath(path: string) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchFolderById(client: ReturnType<typeof graphDelegated>, driveId: string, itemId: string) {
  return client.api(`/drives/${driveId}/items/${itemId}`).get()
}

async function fetchFolderByPath(client: ReturnType<typeof graphDelegated>, driveId: string, path: string) {
  const clean = sanitizePath(path)
  if (!clean) {
    return client.api(`/drives/${driveId}/root`).get()
  }
  const encoded = encodeGraphPath(clean)
  return client.api(`/drives/${driveId}/root:/${encoded}`).get()
}

export function graphDelegated(accessToken: string) {
  if (!accessToken) {
    throw new Error("graphDelegated requires a non-empty access token")
  }

  return Client.init({
    authProvider: {
      getAccessToken: async () => accessToken,
    },
  })
}

export async function graphApp() {
  const result = await confidentialClient.acquireTokenByClientCredential({ scopes: GRAPH_SCOPE })

  if (!result?.accessToken) {
    throw new Error("Failed to acquire application token for Microsoft Graph")
  }

  return graphDelegated(result.accessToken)
}

export async function ensureFolder(client: ReturnType<typeof graphDelegated>, driveId: string, path: string) {
  if (!driveId) {
    throw new Error("ensureFolder requires a valid driveId")
  }

  const cleanPath = sanitizePath(path)

  if (!cleanPath) {
    return client.api(`/drives/${driveId}/root`).get()
  }

  const segments = cleanPath.split("/").filter(Boolean)
  let parentPath = ""
  let lastItem: unknown

  for (const segment of segments) {
    const currentPath = parentPath ? `${parentPath}/${segment}` : segment

    try {
      lastItem = await client.api(`/drives/${driveId}/root:/${currentPath}`).get()
    } catch (error) {
      if (!isNotFound(error)) {
        throw error
      }

      const createEndpoint = parentPath
        ? `/drives/${driveId}/root:/${parentPath}:/children`
        : `/drives/${driveId}/root/children`

      lastItem = await client.api(createEndpoint).post({
        name: segment,
        folder: {},
        "@microsoft.graph.conflictBehavior": "fail",
      })
    }

    parentPath = currentPath
  }

  return lastItem
}

export async function createSubfolders(
  client: ReturnType<typeof graphDelegated>,
  driveId: string,
  basePath: string,
  names: string[]
) {
  const cleanBase = sanitizePath(basePath)

  await ensureFolder(client, driveId, cleanBase)

  const results = []
  for (const name of names) {
    const targetPath = cleanBase ? `${cleanBase}/${name}` : name
    const folder = await ensureFolder(client, driveId, targetPath)
    results.push(folder)
  }

  return results
}

export async function ensureFolderWithWebUrl(
  client: ReturnType<typeof graphDelegated>,
  driveId: string,
  path: string
): Promise<GraphDriveItem> {
  const cleanPath = sanitizePath(path)
  let item = (await ensureFolder(client, driveId, cleanPath)) as GraphDriveItem

  if (item?.webUrl) {
    return item
  }

  if (item?.id) {
    try {
      const fetched = (await fetchFolderById(client, driveId, item.id)) as GraphDriveItem
      if (fetched?.webUrl) {
        return fetched
      }
      item = fetched ?? item
    } catch {
      await sleep(RETRY_DELAY_MS)
      const retryFetched = (await fetchFolderById(client, driveId, item.id)) as GraphDriveItem
      if (retryFetched?.webUrl) {
        return retryFetched
      }
      item = retryFetched ?? item
    }
  }

  try {
    const fetched = (await fetchFolderByPath(client, driveId, cleanPath)) as GraphDriveItem
    if (fetched?.webUrl) {
      return fetched
    }
    item = fetched ?? item
  } catch {
    await sleep(RETRY_DELAY_MS)
    const retryFetched = (await fetchFolderByPath(client, driveId, cleanPath)) as GraphDriveItem
    if (retryFetched?.webUrl) {
      return retryFetched
    }
    item = retryFetched ?? item
  }

  if (!item?.webUrl) {
    throw new Error(`Unable to resolve webUrl for folder path: ${cleanPath}`)
  }

  return item
}
