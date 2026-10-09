"use client"

import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/Drawer"
import type { ExportColumn, ExportScope } from "@/lib/csv"
import { Download } from "lucide-react"
import { useState } from "react"

const COLUMN_LABELS: Record<ExportColumn, string> = {
  id: "Payment ID",
  created_at: "Created at",
  merchant: "Merchant",
  description: "Description",
  status: "Status",
  method: "Method",
  card_brand: "Card brand",
  last4: "Card last four",
  amount: "Amount",
  currency: "Currency",
}

/**
 * Export options for the payments table (NWP-101). The file itself is built
 * by the export route, which re-validates everything chosen here.
 */
export function ExportDialog({
  query,
  columns,
  defaultColumns,
  filteredCount,
  totalCount,
}: {
  query: string
  columns: readonly ExportColumn[]
  defaultColumns: readonly ExportColumn[]
  filteredCount: number
  totalCount: number
}) {
  const [selected, setSelected] = useState<ExportColumn[]>([...defaultColumns])
  const [scope, setScope] = useState<ExportScope>("filtered")

  const toggle = (column: ExportColumn, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, column] : current.filter((c) => c !== column),
    )

  // Keep the file's column order stable, whatever order boxes were ticked in.
  const ordered = columns.filter((column) => selected.includes(column))
  const params = new URLSearchParams(query)
  params.delete("page")
  params.set("scope", scope)
  params.set("columns", ordered.join(","))
  const href = `/api/payments/export?${params.toString()}`

  const rowCount = scope === "all" ? totalCount : filteredCount

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="w-full gap-2 py-1.5 sm:w-fit">
          <Download
            className="-ml-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-600"
            aria-hidden="true"
          />
          Export
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Export payments</DrawerTitle>
          <DrawerDescription>
            Choose what goes into the CSV file.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-6">
          <fieldset>
            <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Scope
            </legend>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="export-scope"
                  value="filtered"
                  checked={scope === "filtered"}
                  onChange={() => setScope("filtered")}
                  className="size-4 accent-blue-500"
                />
                Current filter ({filteredCount.toLocaleString()} payments)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="export-scope"
                  value="all"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                  className="size-4 accent-blue-500"
                />
                All payments ({totalCount.toLocaleString()} payments)
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Columns
            </legend>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {columns.map((column) => (
                <label
                  key={column}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    name="export-columns"
                    value={column}
                    checked={selected.includes(column)}
                    onChange={(event) => toggle(column, event.target.checked)}
                    className="size-4 rounded accent-blue-500"
                  />
                  {COLUMN_LABELS[column]}
                </label>
              ))}
            </div>
          </fieldset>
        </DrawerBody>
        <DrawerFooter className="items-center gap-2">
          <p
            className="mr-auto text-sm text-gray-500"
            aria-live="polite"
          >
            {ordered.length === 0
              ? "Select at least one column to download."
              : `${rowCount.toLocaleString()} rows will be exported.`}
          </p>
          <DrawerClose asChild>
            <Button variant="secondary" className="py-1.5">
              Cancel
            </Button>
          </DrawerClose>
          {ordered.length === 0 ? (
            <Button className="py-1.5" disabled>
              Download
            </Button>
          ) : (
            <Button className="py-1.5" asChild>
              <a href={href} download>
                Download
              </a>
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
