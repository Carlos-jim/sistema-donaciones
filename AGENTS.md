# AGENTS.md - Development Guidelines for Sistema de Donaciones

This file contains essential guidelines for agentic coding agents working on this medication donation system.

## 🚀 Build, Lint & Test Commands

### Core Commands
```bash
# Build the application
npm run build

# Start development server
npm run dev

# Lint code
npm run lint

# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run single test file
npm run test -- path/to/specific.test.ts

# Run single test by pattern
npm run test -- --reporter=verbose path/to/**/*.test.ts

# Run E2E tests
npm run test:e2e

# Run specific E2E test
npx playwright test --grep "test name"
```

### Database Commands
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# Create and apply migration (production)
npx prisma migrate dev --name migration-name

# Reset database (development only)
npx prisma db push --force-reset

# View database in Prisma Studio
npx prisma studio
```

## 📋 Code Style Guidelines

### File Structure & Imports
```
// React/Next.js imports first
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

// Then external libraries
import { z } from "zod"
import { Eye, CheckCircle } from "lucide-react"

// Then internal imports (absolute paths with @)
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
```

### TypeScript & Type Definitions
```typescript
// Use concise type definitions matching Prisma output
type RequestItem = {
  id: string
  createdAt: Date
  usuarioComun: {
    nombre: string
    email: string
  }
  medicamentos: {
    id: string
    cantidad: number
    prioridad: number
    medicamento: {
      nombre: string
      presentacion: string | null
    }
  }[]
}

// Use interface for component props
interface RequestDialogProps {
  request: RequestItem
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  isOpen: boolean
}
```

### Naming Conventions
- **Files**: kebab-case (`requests-inbox.tsx`, `medication-card.tsx`)
- **Components**: PascalCase (`RequestsInbox`, `MedicationCard`)
- **Variables**: camelCase (`selectedRequest`, `isSubmitting`)
- **Constants**: UPPER_SNAKE_CASE (`MOBILE_BREAKPOINT`, `API_BASE_URL`)
- **Functions**: camelCase (`handleApprove`, `fetchRequests`)
- **Types**: PascalCase (`RequestItem`, `UserFormProps`)

### Server Actions
```typescript
"use server"

import prisma from "@/lib/prisma"

// Always validate inputs
export async function approveRequest(requestId: string) {
  if (!requestId) {
    throw new Error("Request ID is required")
  }

  try {
    await prisma.solicitud.update({
      where: { id: requestId },
      data: { estado: "APROBADA" },
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to approve request:", error)
    throw new Error("No se pudo aprobar la solicitud")
  }
}
```

### React Component Patterns
```typescript
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function Component({ data }: { data: RequestItem[] }) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleAction = async () => {
    setIsLoading(true)
    try {
      await someAction()
      toast({ title: "Success", description: "Action completed" })
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Action failed", 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleAction} disabled={isLoading}>
        {isLoading ? "Processing..." : "Action"}
      </Button>
    </div>
  )
}
```

## 🎨 UI/Component Guidelines

### Tailwind CSS Patterns
```typescript
// Use cn() utility for conditional classes
import { cn } from "@/lib/utils"

const buttonVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    },
    size: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
    },
  },
})

// Usage
<Button className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
  Button Text
</Button>
```

### Component Structure
```typescript
// 1. Imports (React, Next.js, external, internal)
// 2. Type definitions
// 3. Component function
// 4. Export default

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"

type Props = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, children }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>Title</DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
```

## 🛡️ Error Handling Guidelines

### Client-Side Error Handling
```typescript
try {
  const result = await apiCall()
  // Handle success
} catch (error) {
  console.error("API call failed:", error)
  
  // Show user-friendly error
  toast({
    title: "Error de conexión",
    description: "No se pudo completar la operación",
    variant: "destructive",
  })
}
```

### Server-Side Error Handling
```typescript
export async function serverAction(data: unknown) {
  try {
    // Validate input
    const validated = z.object({...}).parse(data)
    
    // Perform operation
    const result = await prisma.someOperation(validated)
    
    return { success: true, data: result }
  } catch (error) {
    console.error("Server action failed:", error)
    
    // Return structured error
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}
```

## 🧪 Testing Guidelines

### Unit Tests (Vitest)
```typescript
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"

describe("Button Component", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button")).toHaveTextContent("Click me")
  })

  it("handles click events", async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await userEvent.click(screen.getByRole("button"))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### E2E Tests (Playwright)
```typescript
import { test, expect } from "@playwright/test"

test("user can approve request", async ({ page }) => {
  await page.goto("/supervisor")
  await page.click('[data-testid="approve-button"]')
  
  // Verify success message
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
})
```

## 📊 Database Guidelines

### Prisma Patterns
```typescript
// Always use select for performance
const users = await prisma.usuarioComun.findMany({
  select: {
    id: true,
    nombre: true,
    email: true,
    _count: { select: { solicitudes: true } }
  },
  orderBy: { createdAt: "desc" }
})

// Use transactions for multiple operations
await prisma.$transaction(async (tx) => {
  await tx.solicitud.update({ where: { id }, data: { estado: "APROBADA" } })
  await tx.notificacion.create({
    data: { userId, message: "Solicitud aprobada", type: "SYSTEM" }
  })
})
```

## 🔧 Development Workflow

1. **Start**: Always run `npm run dev` to start development
2. **Database**: Use `npx prisma db push` for schema changes in development
3. **Testing**: Run `npm run test:watch` during development
4. **Build**: Run `npm run build` before committing
5. **Lint**: Run `npm run lint` to catch style issues

## 🎯 Key Architecture Decisions

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks + server actions
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Authentication**: Custom implementation with bcryptjs

## 📝 Notes

- All server actions must be in files with `"use server"` directive
- Client components must have `"use client"` directive
- Use absolute imports with `@/` prefix for internal modules
- Spanish is used for user-facing strings
- Database enums and constants use English
- Component files should be self-contained with clear props interface