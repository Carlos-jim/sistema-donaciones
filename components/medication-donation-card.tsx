"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { MapPin, Clock, Calendar, Package, User, CheckCircle2, Loader2, FileImage, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface MedicationDonationCardProps {
  id: string
  name: string
  unit?: string
  quantity?: number
  requiresPrescription?: boolean
  donor: string
  location: string
  distance: string
  expiration: string
  date: string
}

export function MedicationDonationCard({
  id,
  name,
  unit,
  quantity,
  requiresPrescription = false,
  donor,
  location,
  distance,
  expiration,
  date,
}: MedicationDonationCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recipeUrl, setRecipeUrl] = useState<string | null>(null)
  const [recipePreview, setRecipePreview] = useState<string | null>(null)
  const [uploadingRecipe, setUploadingRecipe] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      toast({ title: "Formato no válido", description: "Sube una imagen JPG, PNG o WebP", variant: "destructive" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: "Máximo 5MB", variant: "destructive" })
      return
    }

    setRecipePreview(URL.createObjectURL(file))
    setUploadingRecipe(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/recipe", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRecipeUrl(data.url)
    } catch {
      toast({ title: "Error al subir receta", description: "Intenta de nuevo", variant: "destructive" })
      setRecipePreview(null)
    } finally {
      setUploadingRecipe(false)
    }
  }

  const removeRecipe = () => {
    setRecipeUrl(null)
    setRecipePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicamentos: [{ nombre: name, cantidad: quantity ?? 1, unidad: unit ?? "unidades" }],
          tiempoEspera: "MEDIO",
          motivo: `Solicitud de donación pública de ${donor}`,
          requiereReceta: !!recipeUrl,
          recipePhotoUrl: recipeUrl ?? null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast({ title: "Error", description: data.error || "No se pudo crear la solicitud", variant: "destructive" })
        return
      }

      setOpen(false)
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud fue creada. Un supervisor la revisará y te notificará.",
      })
      router.push("/dashboard/requests")
    } catch {
      toast({ title: "Error", description: "Error de conexión. Intenta de nuevo.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{name}</CardTitle>
            <Badge className="bg-teal-100 text-teal-800">Disponible</Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-2 text-sm">
            <p className="font-medium">Donante: {donor}</p>
            <div className="flex items-center text-gray-500">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{location} ({distance})</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Vence: {expiration}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span>{date}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700"
            onClick={() => setOpen(true)}
          >
            Solicitar
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) removeRecipe() }}>
        <DialogContent className="sm:max-w-md rounded-2xl gap-0 p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-5">
            <DialogTitle className="text-white font-bold text-lg">Confirmar Solicitud</DialogTitle>
            <DialogDescription className="text-teal-100 text-xs mt-0.5">
              Revisa los detalles antes de confirmar
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4">
            {/* Medication detail */}
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Medicamento</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{name}</p>
              {quantity && (
                <p className="text-sm text-gray-600">
                  Cantidad disponible: <span className="font-medium">{quantity} {unit}</span>
                </p>
              )}
            </div>

            {/* Donor & details */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span>Donante: <span className="font-medium text-gray-800">{donor}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Vence: <span className="font-medium text-gray-800">{expiration}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{location} — {distance}</span>
              </div>
            </div>

            {/* Recipe upload — solo si el donante indicó que requiere receta */}
            {requiresPrescription && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  Receta médica
                  <span className="bg-red-100 text-red-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full normal-case tracking-normal">
                    Obligatoria
                  </span>
                </p>
                <p className="text-xs text-gray-400">El donante indicó que este medicamento requiere receta médica.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {recipePreview ? (
                  <div className="relative w-full">
                    <div className="relative w-full h-36 rounded-xl overflow-hidden border border-teal-100 bg-gray-50">
                      <Image src={recipePreview} alt="Receta" fill className="object-cover" />
                      {uploadingRecipe && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    {!uploadingRecipe && (
                      <button
                        onClick={removeRecipe}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {recipeUrl && (
                      <p className="text-xs text-teal-600 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> Receta subida correctamente
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 py-5 border-2 border-dashed border-red-200 rounded-xl text-gray-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50/40 transition-colors"
                  >
                    <FileImage className="w-6 h-6" />
                    <span className="text-xs">Haz clic para subir receta (JPG, PNG, WebP · máx 5MB)</span>
                  </button>
                )}
              </div>
            )}

            <p className="text-xs text-gray-400 leading-relaxed">
              Al confirmar, se creará una solicitud que un supervisor revisará y vinculará con esta donación. Recibirás una notificación cuando sea aprobada.
            </p>
          </div>

          <DialogFooter className="px-6 pb-6 gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading || uploadingRecipe || (requiresPrescription && !recipeUrl)}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl min-w-[140px]"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enviando...</>
                : <><CheckCircle2 className="w-4 h-4 mr-2" />Confirmar</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
