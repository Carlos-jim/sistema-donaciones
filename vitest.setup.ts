import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    $transaction: vi.fn((callback) =>
      callback({
        donacion: { create: vi.fn() },
        medicamento: { findFirst: vi.fn(), create: vi.fn() },
        donacionMedicamento: { create: vi.fn() },
      })
    ),
    usuarioComun: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    solicitud: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    donacion: {
      create: vi.fn(),
    },
    medicamento: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    solicitudMedicamento: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    donacionMedicamento: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    notificacion: {
      create: vi.fn(),
    },
  },
}));
