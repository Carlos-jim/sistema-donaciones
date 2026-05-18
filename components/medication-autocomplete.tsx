"use client"

import * as React from "react"
import { useDebounce } from "@/hooks/use-debounce"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Pill, Loader2, Check, ChevronDown, AlertCircle } from "lucide-react"

interface MedicamentoOption {
  id: string
  nombre: string
  principioActivo: string | null
  presentacion: string | null
  concentracion: string | null
  categoria: {
    id: string
    nombre: string
  } | null
}

interface MedicationAutocompleteProps {
  value?: string
  onValueChange: (value: string) => void
  onSelectMedicamento?: (medicamento: MedicamentoOption | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  readOnly?: boolean
  initialMedication?: string
}

export function MedicationAutocomplete({
  value,
  onValueChange,
  onSelectMedicamento,
  placeholder = "Buscar medicamento...",
  disabled = false,
  className,
  readOnly = false,
  initialMedication,
}: MedicationAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedQuery] = useDebounce(searchQuery, 250)
  const [medicamentos, setMedicamentos] = React.useState<MedicamentoOption[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedMedicamento, setSelectedMedicamento] =
    React.useState<MedicamentoOption | null>(null)

  // If initialMedication is provided, find it in options
  React.useEffect(() => {
    if (initialMedication && !selectedMedicamento) {
      setSearchQuery(initialMedication)
      // Try to find in existing results, otherwise just display the name
      const found = medicamentos.find(
        (m) => m.nombre.toLowerCase() === initialMedication.toLowerCase()
      )
      if (found) {
        setSelectedMedicamento(found)
        onValueChange(found.id)
        onSelectMedicamento?.(found)
      } else {
        onValueChange(initialMedication)
      }
    }
  }, [initialMedication, medicamentos])

  React.useEffect(() => {
    const fetchMedicamentos = async () => {
      if (!open) return
      setLoading(true)
      setError(null)
      try {
        const url = new URL("/api/medicamentos/search", window.location.origin)
        if (debouncedQuery.length >= 2) {
          url.searchParams.set("q", debouncedQuery)
        }
        url.searchParams.set("limit", "20")

        const response = await fetch(url.toString())
        if (!response.ok) {
          throw new Error("Error al buscar medicamentos")
        }
        const data = await response.json()
        setMedicamentos(data.medicamentos || [])
      } catch (err) {
        console.error("Error fetching medications:", err)
        setError("No se pudieron cargar los medicamentos")
        setMedicamentos([])
      } finally {
        setLoading(false)
      }
    }

    fetchMedicamentos()
  }, [debouncedQuery, open])

  const handleSelect = (medicamento: MedicamentoOption) => {
    setSelectedMedicamento(medicamento)
    onValueChange(medicamento.id)
    onSelectMedicamento?.(medicamento)
    setSearchQuery(medicamento.nombre)
    setOpen(false)
  }

  const handleInputChange = (val: string) => {
    setSearchQuery(val)
    // If user clears input, clear selection
    if (!val.trim()) {
      setSelectedMedicamento(null)
      onValueChange("")
      onSelectMedicamento?.(null)
    }
  }

  const displayValue = selectedMedicamento
    ? `${selectedMedicamento.nombre}${selectedMedicamento.concentracion ? ` ${selectedMedicamento.concentracion}` : ""}`
    : value && !selectedMedicamento
      ? value // fallback for initial text-only values
      : searchQuery

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || readOnly}
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-background transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
            readOnly && "bg-gray-50 text-gray-500 cursor-not-allowed",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Pill
              className={cn(
                "h-4 w-4 shrink-0",
                selectedMedicamento ? "text-teal-600" : "text-gray-400"
              )}
            />
            <span className={cn("truncate", !displayValue && "text-gray-400")}>
              {displayValue || placeholder}
            </span>
          </span>
          {readOnly ? null : (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        sideOffset={4}
      >
        <Command className="rounded-xl border border-gray-200 shadow-xl">
          <CommandInput
            placeholder="Escribe para buscar..."
            value={searchQuery}
            onValueChange={handleInputChange}
            className="h-11 border-none focus:ring-0"
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando medicamentos...
              </div>
            )}

            {!loading && error && (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {!loading && !error && searchQuery.length < 2 && (
              <div className="px-4 py-3 text-xs text-gray-400">
                Escribe al menos 2 caracteres para buscar
              </div>
            )}

            {!loading && !error && searchQuery.length >= 2 && medicamentos.length === 0 && (
              <CommandEmpty className="py-6 text-sm text-gray-500">
                No se encontraron medicamentos para &quot;{searchQuery}&quot;
              </CommandEmpty>
            )}

            {!loading && !error && medicamentos.length > 0 && (
              <CommandGroup heading={`${medicamentos.length} resultado${medicamentos.length !== 1 ? "s" : ""}`}>
                {medicamentos.map((med) => (
                  <CommandItem
                    key={med.id}
                    value={med.id}
                    onSelect={() => handleSelect(med)}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors",
                      selectedMedicamento?.id === med.id && "bg-teal-50"
                    )}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        selectedMedicamento?.id === med.id
                          ? "text-teal-600 opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {med.nombre}
                        {med.concentracion && (
                          <span className="text-gray-500 font-normal">
                            {" "}
                            {med.concentracion}
                          </span>
                        )}
                      </span>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-500">
                        {med.principioActivo && med.principioActivo !== med.nombre && (
                          <span className="truncate">{med.principioActivo}</span>
                        )}
                        {med.presentacion && (
                          <span className="text-gray-400">{med.presentacion}</span>
                        )}
                        {med.categoria && (
                          <span className="text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full text-[10px]">
                            {med.categoria.nombre}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
