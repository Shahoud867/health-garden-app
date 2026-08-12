import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock } from "./helpers/mockSupabase"

const mockSupabase = vi.hoisted(() => {
  return { instance: null as ReturnType<typeof createSupabaseMock> | null }
})

vi.mock("../../src/lib/supabase", () => ({
  get supabase() {
    return mockSupabase.instance
  },
}))

describe("lib/push", () => {
  beforeEach(() => {
    mockSupabase.instance = createSupabaseMock()
    vi.stubGlobal("Notification", {
      requestPermission: vi.fn(),
    })
  })

  // `"key" in obj` is true even for a key explicitly stubbed to `undefined`,
  // and vi.stubGlobal state otherwise leaks across tests -- both matter here
  // since isPushSupported()'s whole job is presence checks like that one.
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("isPushSupported is true when serviceWorker/PushManager/Notification/VAPID key are all present", async () => {
    vi.stubGlobal("navigator", { serviceWorker: {} })
    vi.stubGlobal("PushManager", class {})
    vi.stubGlobal("Notification", { requestPermission: vi.fn() })
    const { isPushSupported } = await import("../../src/lib/push")
    expect(isPushSupported()).toBe(true)
  })

  it("isPushSupported is false when PushManager is missing (older/unsupported browser)", async () => {
    vi.stubGlobal("navigator", { serviceWorker: {} })
    vi.stubGlobal("Notification", { requestPermission: vi.fn() })
    // Deliberately not stubbing PushManager at all -- a real absence, not a
    // present-but-undefined key, which is what "in" actually tests for.
    const { isPushSupported } = await import("../../src/lib/push")
    expect(isPushSupported()).toBe(false)
  })

  it('enablePushNotifications returns "denied" without ever touching serviceWorker or the database when permission is refused', async () => {
    vi.stubGlobal("navigator", { serviceWorker: {} })
    vi.stubGlobal("PushManager", class {})
    ;(Notification.requestPermission as ReturnType<typeof vi.fn>).mockResolvedValue(
      "denied",
    )

    const { enablePushNotifications } = await import("../../src/lib/push")
    const outcome = await enablePushNotifications("user-1")

    expect(outcome).toBe("denied")
    expect(mockSupabase.instance!.from).not.toHaveBeenCalled()
  })

  it("enablePushNotifications subscribes and upserts push_tokens with the real subscription shape when granted", async () => {
    const subscribeMock = vi.fn().mockResolvedValue({
      toJSON: () => ({
        endpoint: "https://push.example/abc123",
        keys: { p256dh: "p256dh-value", auth: "auth-value" },
      }),
    })
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({ pushManager: { subscribe: subscribeMock } }),
      },
    })
    vi.stubGlobal("PushManager", class {})
    ;(Notification.requestPermission as ReturnType<typeof vi.fn>).mockResolvedValue(
      "granted",
    )
    mockSupabase.instance!.setTableResult("push_tokens", {
      data: null,
      error: null,
    })

    const { enablePushNotifications } = await import("../../src/lib/push")
    const outcome = await enablePushNotifications("user-1")

    expect(outcome).toBe("granted")
    expect(subscribeMock).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true }),
    )
    const builder = mockSupabase.instance!.from.mock.results[0]!.value
    expect(mockSupabase.instance!.from).toHaveBeenCalledWith("push_tokens")
    const upsertCall = builder._calls.upsert[0]
    expect(upsertCall[0]).toEqual({
      user_id: "user-1",
      endpoint: "https://push.example/abc123",
      p256dh: "p256dh-value",
      auth: "auth-value",
    })
    expect(upsertCall[1]).toEqual({ onConflict: "endpoint" })
  })

  it("enablePushNotifications throws if the browser returns a subscription missing required fields", async () => {
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: {
            subscribe: vi.fn().mockResolvedValue({
              toJSON: () => ({
                endpoint: "https://push.example/abc123",
                keys: undefined,
              }),
            }),
          },
        }),
      },
    })
    vi.stubGlobal("PushManager", class {})
    ;(Notification.requestPermission as ReturnType<typeof vi.fn>).mockResolvedValue(
      "granted",
    )

    const { enablePushNotifications } = await import("../../src/lib/push")
    await expect(enablePushNotifications("user-1")).rejects.toThrow(
      /expected shape/i,
    )
  })
})
