// Analytics module — internal event tracking abstraction.
// No external platform: events are written to `analytics_events` for future
// product analytics, always best-effort and never user-blocking.

export { ANALYTICS_EVENTS, emitEvent, trackEvent } from "./tracker";
export type { AnalyticsEventName } from "./tracker";
export { AnalyticsRepository } from "./repository";
