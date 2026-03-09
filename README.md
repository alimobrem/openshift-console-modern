# Modern OpenShift Console

A modernized rebuild of the OpenShift Console using cutting-edge technologies and best practices as of 2026.

## Technology Stack

### Core
- **React 19.2.4** - Latest stable React with improved performance
- **TypeScript 5.9.3** - Type-safe development
- **Node.js 24.x LTS** (Krypton) - Latest LTS runtime

### Build & Tooling
- **Rspack 1.7** - Rust-based bundler (3-5x faster than Webpack)
- **SWC** - Fast TypeScript/JavaScript compiler
- **Tailwind CSS 3.4** - Utility-first styling
- **PostCSS** - CSS processing

### State Management
- **Zustand** - Lightweight global state management
- **TanStack Query** - Server state management and caching

### UI Components
- **shadcn/ui** - Modern, accessible component patterns
- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React** - Beautiful icon library

### Routing
- **React Router 7** - Client-side routing

## Getting Started

### Prerequisites
- Node.js 24.x or higher
- npm 10.x or higher

### Installation

```bash
# Install dependencies
npm install

# Start development server (port 9000)
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Production build with optimizations
- `npm run build:dev` - Development build without minification
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Lint and auto-fix code
- `npm run format` - Format code with Prettier
- `npm test` - Run tests with Vitest
- `npm run clean` - Clear build cache

### Project Structure

```
openshift-console-modern/
├── public/              # Static assets
│   └── index.html
├── src/
│   ├── components/      # React components
│   │   ├── ui/         # shadcn/ui components
│   │   └── Layout.tsx  # Main layout component
│   ├── pages/          # Page components
│   │   ├── Overview.tsx
│   │   ├── Workloads.tsx
│   │   ├── Networking.tsx
│   │   └── Storage.tsx
│   ├── store/          # Zustand state stores
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── App.tsx         # Main app component
│   ├── index.tsx       # Entry point
│   └── index.css       # Global styles
├── rspack.config.ts    # Rspack configuration
├── tsconfig.json       # TypeScript configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── package.json
```

## Features

### Current
- ✅ Modern React 19 architecture
- ✅ Lightning-fast Rspack builds
- ✅ Type-safe TypeScript development
- ✅ Responsive, accessible UI with shadcn/ui
- ✅ Dark/light mode support
- ✅ Client-side routing
- ✅ Global state management with Zustand
- ✅ Server state caching with TanStack Query

### Planned
- 🚧 Kubernetes API integration
- 🚧 Real-time cluster monitoring
- 🚧 Pod logs viewer
- 🚧 Resource YAML editor
- 🚧 RBAC management
- 🚧 Multi-cluster support
- 🚧 Advanced filtering and search
- 🚧 Metrics and monitoring dashboards

## Architecture Decisions

### Why Rspack over Webpack?
- 3-5x faster build times
- Drop-in Webpack replacement with API compatibility
- Better for enterprise-scale applications
- Native Rust performance

### Why React 19?
- Latest stable version with performance improvements
- Better concurrent rendering
- Improved effects management
- Enhanced security

### Why shadcn/ui?
- Full control over components (copy-paste approach)
- Built on accessible Radix UI primitives
- Modern, customizable design system
- Excellent TypeScript support

### Why Zustand?
- Minimal boilerplate (~3KB)
- Simple API
- Excellent performance
- Perfect for global client state

## Performance

Rspack provides significant performance improvements:
- Cold build: ~5 seconds (vs 15-30s with Webpack)
- Hot rebuild: ~200ms
- Near-instant HMR even in large codebases

## Contributing

This is a demonstration project showcasing modern web development practices for rebuilding the OpenShift Console.

## License

MIT

## References

- [OpenShift Console (original)](https://github.com/openshift/console)
- [Rspack Documentation](https://rspack.dev)
- [React 19 Documentation](https://react.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [TanStack Query](https://tanstack.com/query)
