export const safeNext = (n?: string | null) =>
  n && n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : "/dashboard";