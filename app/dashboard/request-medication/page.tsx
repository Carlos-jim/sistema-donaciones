"use client";

import { MedicationRequestForm } from "@/components/medication-request-form";

export default function RequestMedicationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <MedicationRequestForm />
      </div>
    </div>
  );
}
