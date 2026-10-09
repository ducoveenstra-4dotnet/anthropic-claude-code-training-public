import { filterPayments, parseFilters, sortPayments } from "@/data/queries"
import {
  exportFilename,
  exportLabel,
  parseExportColumns,
  parseExportScope,
  toCsv,
} from "@/lib/csv"
import { NextRequest, NextResponse } from "next/server"

/**
 * Exports the payments table as CSV.
 *
 * Ops picks the columns and the scope (NWP-101). Both are validated against
 * an allowlist before anything else runs, and rows come from the one query
 * builder, unpaginated, so the file holds every matching payment.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const scope = parseExportScope(params.get("scope"))
  if (!scope.ok) {
    return NextResponse.json({ message: scope.message }, { status: 400 })
  }

  const columns = parseExportColumns(params.get("columns"))
  if (!columns.ok) {
    return NextResponse.json({ message: columns.message }, { status: 400 })
  }

  // "all" drops the filters but keeps the requested sort order.
  const parsed = parseFilters(params)
  const filters = scope.value === "all" ? {} : parsed
  const rows = sortPayments(
    filterPayments(filters),
    parsed.sort,
    parsed.direction,
  )
  const filename = exportFilename(new Date(), exportLabel(scope.value, filters))

  return new Response(toCsv(rows, columns.value), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  })
}
