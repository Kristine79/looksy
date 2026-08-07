/**
 * Product-level occasions shared by the client UI and the server pipeline.
 * Kept dependency-free so it can be imported from client components.
 */
export const OCCASIONS = [
  "work",
  "casual",
  "evening",
  "date",
  "formal",
  "weekend",
  "travel",
] as const;

export type Occasion = (typeof OCCASIONS)[number];
