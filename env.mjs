import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    ANALYZE: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    GRAPH_TENANT_ID: z.string().min(1, "GRAPH_TENANT_ID is required"),
    GRAPH_CLIENT_ID: z.string().min(1, "GRAPH_CLIENT_ID is required"),
    GRAPH_CLIENT_SECRET: z.string().min(1, "GRAPH_CLIENT_SECRET is required"),
  },
  client: {
    NEXT_PUBLIC_AZURE_AD_CLIENT_ID: z.string().min(1, "Azure AD client ID is required"),
    NEXT_PUBLIC_AZURE_AD_TENANT_ID: z.string().min(1, "Azure AD tenant ID is required"),
  },
  runtimeEnv: {
    ANALYZE: process.env.ANALYZE,
    GRAPH_TENANT_ID: process.env.GRAPH_TENANT_ID,
    GRAPH_CLIENT_ID: process.env.GRAPH_CLIENT_ID,
    GRAPH_CLIENT_SECRET: process.env.GRAPH_CLIENT_SECRET,
    NEXT_PUBLIC_AZURE_AD_CLIENT_ID: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID,
    NEXT_PUBLIC_AZURE_AD_TENANT_ID: process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID,
  },
})
