import { describe, it, expect, vi, beforeEach } from "vitest"

beforeEach(() => {
  vi.spyOn(console, "debug").mockImplementation(() => {})
  vi.spyOn(console, "info").mockImplementation(() => {})
  vi.spyOn(console, "warn").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("logger", () => {
  it("logs info messages", async () => {
    const { logger } = await import("../logger")
    logger.info("test message")
    expect(console.info).toHaveBeenCalledTimes(1)
    const call = (console.info as any).mock.calls[0][0]
    expect(call).toContain("test message")
    expect(call).toContain("[INFO]")
  })

  it("logs error messages with error object", async () => {
    const { logger } = await import("../logger")
    const error = new Error("test error")
    logger.error("error occurred", error)
    expect(console.error).toHaveBeenCalledTimes(1)
    const call = (console.error as any).mock.calls[0][0]
    expect(call).toContain("error occurred")
    expect(call).toContain("test error")
  })

  it("logs warn messages", async () => {
    const { logger } = await import("../logger")
    logger.warn("warning message")
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it("logs debug messages", async () => {
    const { logger } = await import("../logger")
    logger.debug("debug message")
    expect(console.debug).toHaveBeenCalledTimes(1)
  })

  it("includes context in log output", async () => {
    const { logger } = await import("../logger")
    logger.info("with context", { key: "value", count: 42 })
    const call = (console.info as any).mock.calls[0][0]
    expect(call).toContain("key")
    expect(call).toContain("value")
  })

  it("loginAttempt calls info", async () => {
    const { logger } = await import("../logger")
    logger.loginAttempt("test@example.com", true)
    expect(console.info).toHaveBeenCalledTimes(1)
  })

  it("saleCreated calls info", async () => {
    const { logger } = await import("../logger")
    logger.saleCreated("SALE-001", 100, "user-1")
    expect(console.info).toHaveBeenCalledTimes(1)
  })

  it("criticalError calls error", async () => {
    const { logger } = await import("../logger")
    const error = new Error("critical")
    logger.criticalError(error, { component: "test" })
    expect(console.error).toHaveBeenCalledTimes(1)
    const call = (console.error as any).mock.calls[0][0]
    expect(call).toContain("Critical system error")
    expect(call).toContain("critical")
  })
})
