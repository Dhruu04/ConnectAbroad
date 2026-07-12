export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  console.error("Captured Error:", error, "Context:", context);
}
