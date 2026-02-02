# Repository Patterns - Decrypt Tool

## File Organization Patterns

### Source Code Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/ui/` - Nexar Design System components
- `src/lib/` - Utility functions and business logic
- `src/styles/` - CSS theme and fonts

### API Routes
- Location: `src/app/api/`
- Pattern: `src/app/api/{resource}/route.ts`
- Dynamic: `src/app/api/{resource}/[id]/route.ts`

### Component Structure
- Location: `src/components/ui/`
- Naming: PascalCase (`Button.tsx`, `Input.tsx`)
- Pattern: One component per file, export named

## Naming Conventions

### Files
- Components: PascalCase (`Button.tsx`, `ProgressBar.tsx`)
- Utilities: camelCase (`utils.ts`, `crypto.ts`)
- Types: camelCase with `.ts` extension (`types.ts`)
- API routes: `route.ts` (Next.js convention)

### Code
- Variables/Functions: camelCase (`decryptFile`, `jobStatus`)
- Constants: UPPER_SNAKE_CASE (`XOR_PAD_SIZE`, `API_BASE_URL`)
- Types/Interfaces: PascalCase (`Job`, `FileResult`, `DecryptOptions`)
- React components: PascalCase (`DecryptForm`, `ResultsTable`)

## Code Standards

### Imports
- Use `@/` path alias for src imports
- Group: external → internal → types
- Prefer named exports

### TypeScript
- Strict mode enabled
- Explicit return types on exported functions
- Use interfaces for object shapes

### React Patterns
- Functional components with hooks
- Server Components by default (Next.js 16)
- "use client" directive when needed for interactivity

### Error Handling
- API routes: Return proper HTTP status codes with JSON errors
- Client: Use try/catch with user-friendly error messages
- Log errors to console in development

## Styling Standards

### Tailwind Classes
- Use CSS variables via design system (`bg-primary`, `text-muted-foreground`)
- Spacing scale only (no arbitrary values like `p-[13px]`)
- Default radius: `rounded-xl` for cards, `rounded-lg` for smaller

### Nexar Design System
- All UI components from design system library
- Fetch from: `https://raw.githubusercontent.com/dashagolubchinaux/components/main/ui/`
- Always include hover, focus, disabled states

## Testing Standards

### Coverage Goals
- Unit tests for crypto functions (100%)
- Integration tests for API routes
- E2E tests for critical user flows

### Test Files
- Location: Collocated with source (`*.test.ts`)
- Naming: `{filename}.test.ts`

## Documentation Standards

### Code Comments
- JSDoc for exported functions
- Inline comments for complex logic only
- No commented-out code

### API Documentation
- Document request/response shapes in types.ts
- Include error response formats
