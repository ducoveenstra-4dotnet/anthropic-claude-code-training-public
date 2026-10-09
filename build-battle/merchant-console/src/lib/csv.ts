import { merchantById } from "@/data/merchants"
import { Payment, PaymentFilters } from "@/data/types"
import { formatMoney } from "./money"

/**
 * CSV export for the payments table.
 *
 * Ops chooses the columns and the scope (NWP-101). Column and scope names
 * arrive from the client, so the route validates them here against an
 * allowlist before they reach the serializer or the filename.
 */

export const EXPORT_COLUMNS = [
  "id",
  "created_at",
  "merchant",
  "description",
  "status",
  "method",
  "card_brand",
  "last4",
  "amount",
  "currency",
] as const

export type ExportColumn = (typeof EXPORT_COLUMNS)[number]

/** Card last four is opt-in: these files often go straight to a merchant. */
export const DEFAULT_EXPORT_COLUMNS: readonly ExportColumn[] = EXPORT_COLUMNS.filter(
  (column) => column !== "last4",
)

export const EXPORT_SCOPES = ["filtered", "all"] as const

export type ExportScope = (typeof EXPORT_SCOPES)[number]

type Parsed<T> = { ok: true; value: T } | { ok: false; message: string }

/**
 * Validate a comma-separated column list from the client. An absent param
 * means the defaults; an empty or unknown selection is rejected rather than
 * producing an empty or surprising file. Order is kept, duplicates dropped.
 */
export function parseExportColumns(raw: string | null): Parsed<ExportColumn[]> {
  if (raw === null) return { ok: true, value: [...DEFAULT_EXPORT_COLUMNS] }

  const names = raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
  if (names.length === 0) {
    return { ok: false, message: "Select at least one column to export." }
  }

  const unknown = names.filter(
    (name) => !EXPORT_COLUMNS.includes(name as ExportColumn),
  )
  if (unknown.length > 0) {
    return { ok: false, message: "Unknown export column requested." }
  }

  return { ok: true, value: [...new Set(names as ExportColumn[])] }
}

export function parseExportScope(raw: string | null): Parsed<ExportScope> {
  if (raw === null) return { ok: true, value: "filtered" }
  if (EXPORT_SCOPES.includes(raw as ExportScope)) {
    return { ok: true, value: raw as ExportScope }
  }
  return { ok: false, message: "Unknown export scope requested." }
}

/**
 * The scope part of the filename. Only allowlisted values reach it: free text
 * like the search box or a merchant id never ends up in a file name.
 */
export function exportLabel(scope: ExportScope, filters: PaymentFilters): string {
  if (scope === "all") return "all"
  return filters.status && filters.status !== "all" ? filters.status : "filtered"
}

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function cell(payment: Payment, column: ExportColumn): string {
  switch (column) {
    case "id":
      return payment.id
    case "created_at":
      return payment.createdAt
    case "merchant":
      return merchantById(payment.merchantId)?.name ?? payment.merchantId
    case "description":
      return payment.description
    case "status":
      return payment.status
    case "method":
      return payment.method
    case "card_brand":
      return payment.cardBrand ?? ""
    case "last4":
      return payment.last4 ?? ""
    case "amount":
      return formatMoney(payment.amount, payment.currency)
    case "currency":
      return payment.currency
  }
}

export function toCsv(
  payments: Payment[],
  columns: readonly ExportColumn[] = EXPORT_COLUMNS,
): string {
  if (columns.length === 0) {
    throw new RangeError("toCsv needs at least one column")
  }
  const header = columns.join(",")
  const rows = payments.map((payment) =>
    columns.map((column) => escapeCell(cell(payment, column))).join(","),
  )
  return [header, ...rows].join("\n")
}

export function exportFilename(date = new Date(), label?: string): string {
  const day = date.toISOString().slice(0, 10)
  return label ? `payments-${label}-${day}.csv` : `payments-${day}.csv`
}
