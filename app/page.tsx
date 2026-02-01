import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MoveRight, MapPin, PlusCircle, Search, Heart } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-teal-600" />
            <span className="text-xl font-bold">MediShareNE</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium">
              Inicio
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium">
              Cómo Funciona
            </Link>
            <Link href="#about" className="text-sm font-medium">
              Acerca de
            </Link>
            <Link href="#contact" className="text-sm font-medium">
              Contacto
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-12 md:py-24 lg:py-32 bg-teal-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Sistema Colaborativo para la Donación y Localización de Medicamentos
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Conectamos a personas que necesitan medicamentos con donantes dispuestos a ayudar en situaciones de
                  emergencia.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      Comenzar Ahora
                      <MoveRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button variant="outline">Cómo Funciona</Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <img
                  src="/placeholder.svg?height=400&width=400"
                  alt="Plataforma de donación de medicamentos"
                  className="rounded-lg object-cover"
                  height="400"
                  width="400"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Cómo Funciona</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Nuestra plataforma facilita la conexión entre personas que necesitan medicamentos y donantes
                  potenciales.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3 md:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                  <Search className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold">Solicita Medicamentos</h3>
                <p className="text-gray-500">
                  Registra tu solicitud indicando el medicamento que necesitas y tu ubicación.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                  <MapPin className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold">Localiza en el Mapa</h3>
                <p className="text-gray-500">
                  Visualiza en tiempo real las solicitudes y donaciones disponibles cerca de ti.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                  <PlusCircle className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold">Dona Medicamentos</h3>
                <p className="text-gray-500">
                  Ofrece los medicamentos que puedes donar y coordina la entrega de forma segura.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Acerca del Proyecto</h2>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Nuestra plataforma nace de la necesidad de optimizar el acceso a medicamentos en situaciones de
                  emergencia, conectando a quienes necesitan con quienes pueden ayudar.
                </p>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Trabajamos en colaboración con entes reguladores para garantizar la seguridad y confiabilidad de todas
                  las donaciones realizadas a través de nuestra plataforma.
                </p>
              </div>
              <div className="flex justify-center">
                <img
                  src="/placeholder.svg?height=400&width=400"
                  alt="Sobre nuestro proyecto"
                  className="rounded-lg object-cover"
                  height="400"
                  width="400"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-teal-600" />
            <span className="text-lg font-semibold">MediShareNE</span>
          </div>
          <p className="text-sm text-gray-500">© 2025 MediShareNE. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-gray-500 hover:underline">
              Términos
            </Link>
            <Link href="#" className="text-sm text-gray-500 hover:underline">
              Privacidad
            </Link>
            <Link href="#contact" className="text-sm text-gray-500 hover:underline">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

