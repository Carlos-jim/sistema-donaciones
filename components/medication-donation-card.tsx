import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Calendar } from "lucide-react"

interface MedicationDonationCardProps {
  name: string
  donor: string
  location: string
  distance: string
  expiration: string
  date: string
}

export function MedicationDonationCard({
  name,
  donor,
  location,
  distance,
  expiration,
  date,
}: MedicationDonationCardProps) {
  return (
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
            <span>
              {location} ({distance})
            </span>
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
        <Button className="w-full bg-teal-600 hover:bg-teal-700">Solicitar</Button>
      </CardFooter>
    </Card>
  )
}

