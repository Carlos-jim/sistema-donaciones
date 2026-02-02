import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, PlusCircle, Search, Heart, Users, Shield, Clock, CheckCircle, ArrowRight, Star, Droplets } from "lucide-react"

export default function Home() {
  const stats = [
    { value: "10,000+", label: "Medicamentos donados", icon: Droplets },
    { value: "5,000+", label: "Familias ayudadas", icon: Users },
    { value: "50+", label: "Farmacias asociadas", icon: Shield },
    { value: "24/7", label: "Disponibilidad", icon: Clock }
  ]

  const testimonials = [
    {
      name: "María González",
      role: "Paciente",
      content: "Encontré el medicamento que necesitaba para mi hijo en menos de 2 horas. ¡Gracias a MediShareNE!",
      rating: 5
    },
    {
      name: "Dr. Carlos Martínez",
      role: "Médico",
      content: "Una herramienta invaluable para conectar pacientes con los medicamentos que necesitan urgentemente.",
      rating: 5
    },
    {
      name: "Ana Rodríguez",
      role: "Donante",
      content: "Me siento bien sabiendo que mis medicamentos sobrantes están ayudando a quien más lo necesita.",
      rating: 5
    }
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Heart className="h-6 w-6 text-teal-600 fill-teal-600" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-teal-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
              MediShareNE
            </span>
          </div>
          <nav className="hidden md:flex gap-8">
            <Link href="/" className="text-sm font-medium hover:text-teal-600 transition-colors">
              Inicio
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-teal-600 transition-colors">
              Cómo Funciona
            </Link>
            <Link href="#stats" className="text-sm font-medium hover:text-teal-600 transition-colors">
              Impacto
            </Link>
            <Link href="#testimonials" className="text-sm font-medium hover:text-teal-600 transition-colors">
              Testimonios
            </Link>
            <Link href="#about" className="text-sm font-medium hover:text-teal-600 transition-colors">
              Acerca de
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-teal-200 hover:bg-teal-50 hover:text-teal-600" asChild>
              <Link href="/login">
                Iniciar Sesión
              </Link>
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all" asChild>
              <Link href="/register">
                Registrarse
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 lg:py-40 bg-gradient-to-br from-teal-50 via-white to-cyan-50 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%200 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%2314b8a6%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-medium">
                    <Shield className="h-4 w-4 mr-2" />
                    Con el respaldo de entes reguladores
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
                      Conectando Vidas
                    </span>
                    <br />
                    <span className="text-gray-900">a través de Medicamentos</span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-[600px]">
                    Plataforma colaborativa que conecta a personas que necesitan medicamentos con donantes dispuestos a ayudar en situaciones de emergencia, garantizando seguridad y confianza.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all" asChild>
                    <Link href="/register">
                      Comenzar Ahora
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="border-teal-200 hover:bg-teal-50 px-8 py-6 text-lg" asChild>
                    <Link href="#how-it-works">
                      Cómo Funciona
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">4.9/5 satisfacción</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <span className="text-sm text-gray-600">+10,000 usuarios activos</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-200 to-cyan-200 rounded-3xl blur-3xl opacity-30"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-teal-100">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-6 rounded-xl bg-teal-50">
                      <Droplets className="h-8 w-8 text-teal-600 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-teal-600">10K+</div>
                      <div className="text-sm text-gray-600">Medicamentos</div>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-cyan-50">
                      <Users className="h-8 w-8 text-cyan-600 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-cyan-600">5K+</div>
                      <div className="text-sm text-gray-600">Familias</div>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-teal-50">
                      <Shield className="h-8 w-8 text-teal-600 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-teal-600">50+</div>
                      <div className="text-sm text-gray-600">Farmacias</div>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-cyan-50">
                      <Clock className="h-8 w-8 text-cyan-600 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-cyan-600">24/7</div>
                      <div className="text-sm text-gray-600">Disponibles</div>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Última donación hace</span>
                      <span className="text-sm font-medium text-teal-600">2 minutos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 md:py-28 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-100 text-teal-700 font-medium">
                <CheckCircle className="h-4 w-4 mr-2" />
                Proceso Simple y Seguro
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                Cómo Funciona
                <span className="block text-teal-600">en 3 Pasos Sencillos</span>
              </h2>
              <p className="max-w-3xl text-lg text-gray-600 md:text-xl">
                Nuestra plataforma está diseñada para facilitar la conexión entre personas que necesitan medicamentos y donantes potenciales de manera segura y eficiente.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 relative">
              {/* Connection lines */}
              <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-teal-200 via-teal-300 to-teal-200"></div>

              <div className="relative group">
                <div className="flex flex-col items-center space-y-6 text-center">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                      <Search className="h-10 w-10" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold">
                      1
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Solicita Medicamentos</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Registra tu solicitud indicando el medicamento que necesitas, cantidad y tu ubicación. Nuestro sistema verifica la disponibilidad en tiempo real.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-teal-600 font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Verificación instantánea
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="flex flex-col items-center space-y-6 text-center">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                      <MapPin className="h-10 w-10" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center font-bold">
                      2
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Localiza en el Mapa</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Visualiza en tiempo real las solicitudes y donaciones disponibles cerca de ti. Filtra por distancia, tipo de medicamento y disponibilidad.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-cyan-600 font-medium">
                    <MapPin className="h-4 w-4" />
                    Geolocalización precisa
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="flex flex-col items-center space-y-6 text-center">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                      <PlusCircle className="h-10 w-10" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold">
                      3
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Dona y Recibe</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Ofrece los medicamentos que puedes donar o coordina la entrega de forma segura con validación de identidad y seguimiento del proceso.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-teal-600 font-medium">
                    <Shield className="h-4 w-4" />
                    Entrega verificada
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestro Impacto</h2>
              <p className="text-xl text-teal-50 max-w-2xl mx-auto">
                Estamos transformando vidas a través de la colaboración y el acceso a medicamentos.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all">
                    <stat.icon className="h-8 w-8 mx-auto mb-4 text-teal-200" />
                    <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                    <div className="text-sm md:text-base text-teal-100">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Historias de Éxito</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Conoce las experiencias de personas que han transformado sus vidas a través de nuestra plataforma.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 md:py-28 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-medium">
                    <Shield className="h-4 w-4 mr-2" />
                    Confiabilidad Garantizada
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                    Acerca de MediShareNE
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Nuestra plataforma nace de la necesidad crítica de optimizar el acceso a medicamentos en situaciones de emergencia, conectando a quienes necesitan con quienes pueden ayudar de manera segura y eficiente.
                  </p>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Trabajamos en colaboración con entes reguladores y profesionales de la salud para garantizar la seguridad, calidad y confiabilidad de todas las donaciones realizadas a través de nuestra plataforma.
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Validación Médica</h4>
                      <p className="text-gray-600">Todos los medicamentos son verificados por profesionales de la salud.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Seguridad Garantizada</h4>
                      <p className="text-gray-600">Proceso de validación de identidad y seguimiento completo.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Red Confiable</h4>
                      <p className="text-gray-600">Farmacias y donantes verificados con excelente reputación.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl p-8 border border-teal-100">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <Droplets className="h-8 w-8 text-teal-600 mb-2" />
                        <h4 className="font-semibold text-gray-900">Rescate de Medicamentos</h4>
                        <p className="text-sm text-gray-600">Evitamos desperdicios y damos segunda vida a medicamentos válidos.</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <Users className="h-8 w-8 text-cyan-600 mb-2" />
                        <h4 className="font-semibold text-gray-900">Comunidad Solidaria</h4>
                        <p className="text-sm text-gray-600">Conectamos personas con valores compartidos de ayuda mutua.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <Shield className="h-8 w-8 text-teal-600 mb-2" />
                        <h4 className="font-semibold text-gray-900">Protegemos Vidas</h4>
                        <p className="text-sm text-gray-600">Cada donación puede marcar la diferencia en una emergencia.</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <Heart className="h-8 w-8 text-cyan-600 mb-2" />
                        <h4 className="font-semibold text-gray-900">Impacto Real</h4>
                        <p className="text-sm text-gray-600">Miles de familias beneficiadas con medicamentos urgentes.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-teal-600 to-cyan-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%200 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                ¿Listo para Hacer la Diferencia?
              </h2>
              <p className="text-xl text-teal-50 mb-8">
                Únete a miles de personas que están cambiando vidas a través de la donación de medicamentos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all" asChild>
                  <Link href="/register">
                    Registrarse Ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-teal-600 px-8 py-6 text-lg font-semibold" asChild>
                  <Link href="#how-it-works">
                    Saber Más
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-teal-400 fill-teal-400" />
                <span className="text-xl font-bold">MediShareNE</span>
              </div>
              <p className="text-gray-400 text-sm">
                Conectando vidas a través de la donación responsable de medicamentos.
              </p>
              <div className="flex items-center gap-2 text-sm text-teal-400">
                <Shield className="h-4 w-4" />
                <span>Verificado y seguro</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Plataforma</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#how-it-works" className="hover:text-teal-400 transition-colors">Cómo Funciona</Link></li>
                <li><Link href="#stats" className="hover:text-teal-400 transition-colors">Impacto</Link></li>
                <li><Link href="#testimonials" className="hover:text-teal-400 transition-colors">Testimonios</Link></li>
                <li><Link href="/register" className="hover:text-teal-400 transition-colors">Registrarse</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Ayuda</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-teal-400 transition-colors">Centro de Ayuda</Link></li>
                <li><Link href="#" className="hover:text-teal-400 transition-colors">Términos y Condiciones</Link></li>
                <li><Link href="#" className="hover:text-teal-400 transition-colors">Política de Privacidad</Link></li>
                <li><Link href="#" className="hover:text-teal-400 transition-colors">Preguntas Frecuentes</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Contacto</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>info@medisharene.com</li>
                <li>+58 414-123-4567</li>
                <li>Nueva Esparta, Venezuela</li>
                <li className="flex items-center gap-2 mt-3">
                  <span className="text-teal-400">24/7</span>
                  <span>Disponible</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400">
                © 2025 MediShareNE. Todos los derechos reservados.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Desarrollado con</span>
                <Heart className="h-4 w-4 text-teal-400 fill-teal-400" />
                <span className="text-sm text-gray-400">en Nueva Esparta</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
