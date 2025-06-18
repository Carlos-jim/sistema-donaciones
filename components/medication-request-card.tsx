import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock } from "lucide-react"

interface MedicationRequestCardProps {
  name: string
  requester: string
  location: string
  distance: string
  urgency: string
  date: string
}

export function MedicationRequestCard({
  name,
  requester,
  location,
  distance,
  urgency,
  date,
}: MedicationRequestCardProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "alta":
        return "bg-red-100 text-red-800"
      case "media":
        return "bg-yellow-100 text-yellow-800"
      case "baja":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge className={getUrgencyColor(urgency)}>{urgency}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          <p className="font-medium">Solicitante: {requester}</p>
          <div className="flex items-center text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            <span>
              {location} ({distance})
            </span>
          </div>
          <div className="flex items-center text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>{date}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-teal-600 hover:bg-teal-700">Ofrecer Ayuda</Button>
      </CardFooter>
    </Card>
  )
}

