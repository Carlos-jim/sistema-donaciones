"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function DashboardFooter() {
  return (
    <motion.footer
      className="border-t bg-gray-50/50 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="container mx-auto px-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-500">
          © 2025 MediShare. Todos los derechos reservados.
        </p>
        <div className="flex gap-6">
          <Link
            href="#"
            className="text-sm text-gray-500 hover:text-teal-600 transition-colors duration-300"
          >
            Términos
          </Link>
          <Link
            href="#"
            className="text-sm text-gray-500 hover:text-teal-600 transition-colors duration-300"
          >
            Privacidad
          </Link>
          <Link
            href="#"
            className="text-sm text-gray-500 hover:text-teal-600 transition-colors duration-300"
          >
            Ayuda
          </Link>
        </div>
      </div>
    </motion.footer>
  );
}
