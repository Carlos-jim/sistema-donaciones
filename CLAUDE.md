# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # prisma generate && next build
npm run lint         # ESLint with Next.js rules
npm run test         # Vitest unit tests (single run)
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright E2E tests
npm run db:seed      # Seed database with node --loader ts-node/esm prisma/seed.ts

# Prisma
npx prisma db push       # Push schema changes to DB
npx prisma studio        # Open Prisma Studio GUI
npx prisma generate      # Regenerate Prisma client
```

## Architecture

**Stack**: Next.js 15 (App Router) + PostgreSQL (Neon) + Prisma ORM + Supabase (file storage) + Tailwind CSS + shadcn/ui

**Purpose**: Medication donation platform matching donors (individuals and health entities) with people who need medications. Includes location-based matching, prescription uploads, and a multi-stage approval workflow.

### User Roles & Auth

There are multiple separate authentication systems, each with their own JWT flow:

- **Common users** (`TipoUsuario.COMUN`): Donate and request medications → `/api/auth/*`
- **Health entities** (`TipoUsuario.ENTE_SALUD`): Organizations that donate → `/api/auth/*`
- **Supervisors**: Approve/reject requests → `/api/supervisor/auth/login`
- **Pharmacies**: Fulfillment points → `/pharmacy/*`
- **Admins**: System management (`RolAdministrador`: SUPER_ADMIN, ADMIN, MODERADOR)

JWT tokens are stored as HTTP-only cookies (7-day expiration). Middleware in [middleware.ts](middleware.ts) protects `/dashboard/*` routes and redirects authenticated users away from `/login` and `/register`.

Auth is layered in [lib/auth/](lib/auth/): `auth.service.ts` → `token.service.ts` / `password.service.ts` / `user.repository.ts`.

### Core Data Flow

1. Users donate medications (`Donacion` + `DonacionMedicamento`)
2. Users request medications (`Solicitud` + `SolicitudMedicamento` with priorities)
3. Supervisors/admins approve requests via `/supervisor/requests-inbox/`
4. Matching logic triggers `Notificacion` records when donations match requests
5. Pharmacies (`Farmacia`) serve as fulfillment points with location data
6. Prescriptions uploaded to Supabase via `/api/upload/recipe`

### Key Prisma Enums

- `EstadoSolicitud`: PENDIENTE → APROBADA → EN_PROCESO → RECIBIDA → LISTA_PARA_RETIRO → COMPLETADA | RECHAZADA
- `EstadoDonacion`: DISPONIBLE → RESERVADA → RECIBIDA → ENTREGADA | EXPIRADA
- `TiempoEspera`: BAJO, MEDIO, ALTO (request urgency)

### Directory Structure

```
app/
  api/              # REST API routes (auth, donations, requests, pharmacies, notifications, upload)
  dashboard/        # Authenticated user pages (donate, request, browse)
  pharmacy/         # Pharmacy module with server actions
  supervisor/       # Supervisor approval module
  login/ register/  # Auth pages
components/
  ui/               # shadcn/ui components
  map-view.tsx      # Google Maps + Leaflet map
  *.tsx             # Feature components (cards, forms, etc.)
lib/
  auth/             # Auth service layer (token, password, user repository)
  prisma.ts         # Prisma client singleton
  supabase.ts       # Supabase client
  distance.ts       # Distance calculation utility
prisma/
  schema.prisma     # Database schema
  seed.ts           # Database seed
__tests__/          # Vitest unit tests
e2e/                # Playwright E2E tests
scripts/            # Utility scripts for test data and seeding
```

## Coding Conventions

- **Language**: UI strings and comments in Spanish; DB enums and code identifiers in English
- **File naming**: kebab-case for files, PascalCase for components, camelCase for variables, UPPER_SNAKE_CASE for constants
- **Client components**: Add `"use client"` directive; server actions need `"use server"`
- **Validation**: Use Zod for all API input validation
- **Styling**: Tailwind CSS with `cn()` utility from `lib/utils.ts`; use CVA for variant components
- **Imports**: React → external packages → internal (`@/` alias maps to root)

## Required Environment Variables

```env
DATABASE_URL          # Neon PostgreSQL connection string
JWT_SECRET            # JWT signing secret
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
PASSWORD_SUPABASE
```

## Build Notes

`next.config.mjs` ignores TypeScript and ESLint errors during build (`ignoreBuildErrors: true`). Fix errors locally before assuming the build is clean.
