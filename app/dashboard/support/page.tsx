"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BookOpen,
  Mail,
  Phone,
  MessageCircle,
  HeartHandshake,
  Package,
  Bell,
  ShieldCheck,
  Building2,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const FAQ_CATEGORIES = [
  {
    label: "Cuenta y Acceso",
    icon: ShieldCheck,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
    items: [
      {
        q: "¿Cómo creo una cuenta en la plataforma?",
        a: "Haz clic en el botón 'Registrarse' en la página de inicio. Completa el formulario con tu nombre completo, cédula, correo electrónico, número de contacto y una contraseña segura. Luego confirma tu correo para activar la cuenta.",
      },
      {
        q: "Olvidé mi contraseña. ¿Qué hago?",
        a: "En la pantalla de inicio de sesión, haz clic en '¿Olvidaste tu contraseña?' e ingresa tu correo electrónico registrado. Recibirás un enlace para restablecer tu contraseña.",
      },
      {
        q: "¿Puedo registrarme como farmacia o ente de salud?",
        a: "Sí. En el formulario de registro selecciona el tipo de cuenta correspondiente. Las farmacias y entes de salud son verificados por los administradores antes de poder operar en la plataforma.",
      },
      {
        q: "¿Cómo actualizo mi información de perfil?",
        a: "Ve a 'Mi Perfil' desde el menú superior derecho del dashboard. Allí podrás actualizar tu nombre, correo, teléfono y dirección.",
      },
    ],
  },
  {
    label: "Solicitudes de Insumos Médicos",
    icon: ClipboardList,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    items: [
      {
        q: "¿Cómo solicito un insumo médico?",
        a: "Desde el dashboard, haz clic en 'Solicitar Insumo Médico'. Completa el formulario indicando el tipo de insumo médico, la cantidad, tu ubicación de entrega preferida y la urgencia. Si el insumo médico requiere receta, deberás subir una foto de la misma.",
      },
      {
        q: "¿Por qué debo subir mi receta médica?",
        a: "La receta médica es necesaria para validar la legitimidad de la solicitud. Los entes de salud revisarán la documentación antes de aprobar la solicitud, garantizando que los insumos médicos lleguen a quienes realmente los necesitan.",
      },
      {
        q: "¿Cuánto tiempo tarda en aprobarse mi solicitud?",
        a: "El tiempo de aprobación depende del supervisor asignado, pero generalmente se procesa en un plazo de 24 a 72 horas hábiles. Recibirás una notificación cuando el estado cambie.",
      },
      {
        q: "¿Puedo cancelar una solicitud?",
        a: "Sí, puedes cancelar una solicitud en estado PENDIENTE desde la sección 'Mis Solicitudes'. Las solicitudes ya aprobadas o en proceso requieren contacto con soporte.",
      },
      {
        q: "¿Qué significan los estados de mi solicitud?",
        a: "PENDIENTE: En espera de revisión. APROBADA: Validada por el supervisor. EN_PROCESO: Un donante la ha aceptado. LISTA_PARA_RETIRO: El insumo médico está disponible en la farmacia asignada. COMPLETADA: Retiro confirmado. RECHAZADA: No fue aprobada (se indica el motivo).",
      },
    ],
  },
  {
    label: "Donaciones",
    icon: HeartHandshake,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    items: [
      {
        q: "¿Cómo puedo donar insumos médicos?",
        a: "Ve a la sección 'Donar Insumo Médico' desde el dashboard. Selecciona el insumo médico que deseas donar, indica la cantidad disponible y el estado. Podrás ver en el mapa las solicitudes activas cercanas a ti.",
      },
      {
        q: "¿Qué insumos médicos puedo donar?",
        a: "Puedes donar insumos médicos que no hayan vencido, estén en buen estado y no sean de control especial sin receta. Si tienes dudas sobre si un insumo médico es elegible, contáctanos.",
      },
      {
        q: "¿Cómo sé a dónde llevar el insumo médico?",
        a: "Una vez que aceptes una solicitud, el sistema te asignará una farmacia de entrega y te enviará los códigos de verificación necesarios. Verás la dirección y horario de la farmacia en la sección 'Mis Donaciones'.",
      },
      {
        q: "¿Qué pasa si no puedo entregar el insumo médico en la fecha acordada?",
        a: "Contacta a soporte a la brevedad para informar la situación. Si la donación queda sin entregar pasado el período establecido, el sistema la marcará automáticamente como expirada.",
      },
    ],
  },
  {
    label: "Farmacias y Retiro",
    icon: Building2,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    items: [
      {
        q: "¿Cómo sé en qué farmacia retirar mi insumo médico?",
        a: "Cuando tu solicitud esté LISTA_PARA_RETIRO, recibirás una notificación con la farmacia asignada, su dirección, horario de atención y un código QR para confirmar el retiro.",
      },
      {
        q: "¿Qué debo presentar al retirar el insumo médico?",
        a: "Debes presentar el código QR que recibiste en tu notificación, junto con tu cédula de identidad para verificación.",
      },
      {
        q: "¿Cuánto tiempo tengo para retirar el insumo médico?",
        a: "Tienes un período limitado de días desde que se confirma la disponibilidad en farmacia. Pasado ese tiempo, la solicitud puede reasignarse. Te notificaremos antes de que venza el plazo.",
      },
    ],
  },
  {
    label: "Notificaciones",
    icon: Bell,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    items: [
      {
        q: "¿Para qué sirven las notificaciones?",
        a: "Las notificaciones te alertan sobre cambios en el estado de tus solicitudes o donaciones, cuando un donante acepta tu pedido, cuando el insumo médico está listo para retirar, y cuando hay actualizaciones del sistema.",
      },
      {
        q: "No estoy recibiendo notificaciones. ¿Qué hago?",
        a: "Asegúrate de que tu correo sea correcto en tu perfil. Las notificaciones también se muestran en el ícono de campana del menú superior. Si el problema persiste, contáctanos.",
      },
    ],
  },
  {
    label: "Insumos Médicos e Inventario",
    icon: Package,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    items: [
      {
        q: "¿Cómo busco insumos médicos disponibles para donar?",
        a: "Desde el dashboard principal, puedes ver el mapa con las solicitudes activas y las donaciones disponibles cerca de tu ubicación. Usa el buscador y los filtros para encontrar insumos médicos específicos.",
      },
      {
        q: "¿Qué hago si el insumo médico que necesito no está disponible?",
        a: "Publica tu solicitud con el nivel de urgencia adecuado. El sistema notificará automáticamente a potenciales donantes que tengan ese insumo médico disponible en su inventario.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/70 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium text-gray-800 pr-4">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-gray-50/40">
          {a}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const category = FAQ_CATEGORIES[activeCategory];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-50 rounded-2xl mb-2">
          <HelpCircle className="w-7 h-7 text-teal-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Centro de Ayuda</h1>
        <p className="text-gray-500 text-sm max-w-xl mx-auto">
          Encuentra respuestas a las preguntas más frecuentes sobre la
          plataforma de donaciones de insumos médicos.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link href="/dashboard/request-medication">
          <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-teal-200 hover:bg-teal-50/40 transition-all cursor-pointer shadow-sm">
            <ClipboardList className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">
              Solicitar insumo médico
            </span>
          </div>
        </Link>
        <Link href="/dashboard/donate-medication">
          <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 hover:bg-emerald-50/40 transition-all cursor-pointer shadow-sm">
            <HeartHandshake className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">
              Donar insumo médico
            </span>
          </div>
        </Link>
        <Link href="/dashboard/notifications">
          <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-amber-200 hover:bg-amber-50/40 transition-all cursor-pointer shadow-sm">
            <Bell className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">
              Mis notificaciones
            </span>
          </div>
        </Link>
      </div>

      {/* FAQ section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <BookOpen className="w-5 h-5 text-teal-600" />
          <h2 className="font-semibold text-gray-800">Preguntas Frecuentes</h2>
          <Badge className="bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-50 ml-auto text-xs">
            {FAQ_CATEGORIES.reduce((acc, c) => acc + c.items.length, 0)}{" "}
            preguntas
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row">
          {/* Category nav */}
          <div className="sm:w-56 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 p-3 space-y-1">
            {FAQ_CATEGORIES.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveCategory(idx)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                    activeCategory === idx
                      ? `${cat.bg} ${cat.color} font-medium`
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="leading-tight">{cat.label}</span>
                  <span className="ml-auto text-xs opacity-60">
                    {cat.items.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* FAQ items */}
          <div className="flex-1 p-5 space-y-2">
            <div
              className={`flex items-center gap-2 mb-4 pb-3 border-b border-gray-100`}
            >
              <div
                className={`w-8 h-8 ${category.bg} rounded-lg flex items-center justify-center`}
              >
                <category.icon className={`w-4 h-4 ${category.color}`} />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">
                {category.label}
              </h3>
            </div>
            {category.items.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </div>

      {/* Contact section */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white">
        <h2 className="font-bold text-lg mb-1">
          ¿No encontraste lo que buscabas?
        </h2>
        <p className="text-teal-100 text-sm mb-5">
          Nuestro equipo de soporte está disponible para ayudarte de lunes a
          viernes, de 8am a 6pm.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <a
            href="mailto:soporte@donaciones.org"
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-xl p-4"
          >
            <Mail className="w-5 h-5 text-teal-100 flex-shrink-0" />
            <div>
              <p className="text-xs text-teal-200 font-medium uppercase tracking-wide">
                Correo
              </p>
              <p className="text-sm font-semibold">soporte@donaciones.org</p>
            </div>
          </a>
          <a
            href="tel:+582129000000"
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-xl p-4"
          >
            <Phone className="w-5 h-5 text-teal-100 flex-shrink-0" />
            <div>
              <p className="text-xs text-teal-200 font-medium uppercase tracking-wide">
                Teléfono
              </p>
              <p className="text-sm font-semibold">+58 212 900-0000</p>
            </div>
          </a>
          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
            <MessageCircle className="w-5 h-5 text-teal-100 flex-shrink-0" />
            <div>
              <p className="text-xs text-teal-200 font-medium uppercase tracking-wide">
                Horario
              </p>
              <p className="text-sm font-semibold">Lun–Vie 8am–6pm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
