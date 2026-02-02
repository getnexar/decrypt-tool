# Technical Setup

## Development Environment

### Prerequisites
- Node.js 20+
- npm 10+
- NAP CLI (`npm install -g @nexar/nap-cli`)

### Setup
```bash
npm install
```

### Development
```bash
npm run dev    # Start dev server on localhost:3000
```

### Build
```bash
npm run build  # Production build
npm run lint   # ESLint check
```

## Deployment

### NAP Deployment
```bash
nap deploy     # Deploy to NAP platform
```

### NAP Configuration
See `nexar.yaml` (to be created):
- Runtime: python3.11 (for backend processing)
- Capabilities: google-drive, cloud-storage
- Port: 8081

## Dependencies

### Production
- next@16.1.6
- react@19.2.3
- tailwindcss@4
- @phosphor-icons/react
- class-variance-authority
- clsx, tailwind-merge

### Additional (to be added)
- google-api-python-client (for GDrive)
- numpy (for optimized decryption)

## Project Structure

```
src/
├── app/              # Next.js pages and API routes
├── components/ui/    # Design system components
├── lib/              # Utilities and business logic
└── styles/           # CSS theme and fonts
```
