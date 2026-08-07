import { invokeFunction } from "./client"

/** `GET /functions/v1/account-export` (§6.2, §7.9 right-to-access). */
export async function exportAccountData(): Promise<{
  exportedAt: string
  data: Record<string, unknown[]>
}> {
  return invokeFunction("account-export", undefined, { method: "GET" })
}

/** `POST /functions/v1/account-delete` (§6.2, §7.9 right-to-erasure) — cascades through every owned row. */
export async function deleteAccount(): Promise<void> {
  await invokeFunction<{ deleted: true }>("account-delete", { confirm: true })
}
