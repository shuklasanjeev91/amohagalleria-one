/**
 * Shared process/window cache for catalogue data.
 *
 * One runs each route loader via a separate dynamic import on the client, so
 * module-level `let` caches are not shared across tabs. globalThis keeps one
 * warm cache for the whole browser session (and the Node process on the server).
 */

export type RuntimeBag = Record<string, unknown>

export function runtimeBag(): RuntimeBag {
  const g = globalThis as typeof globalThis & { __amohaRuntime?: RuntimeBag }
  if (!g.__amohaRuntime) g.__amohaRuntime = {}
  return g.__amohaRuntime
}
