# OpenShiftView

A next-generation OpenShift Console built with React, TypeScript, and real-time Kubernetes APIs. Every view is auto-generated from the API — browse any resource type, see what needs attention, and take action in seconds.

![Cluster Pulse](docs/screenshots/pulse.png)

## Features

### Cluster Pulse — Your Landing Page
See only what matters: failing pods, degraded operators, unhealthy deployments, unready nodes, and cluster CPU/memory at a glance. Namespace-scoped and cluster-wide stats are clearly separated.

### Operator Catalog & One-Click Install
Browse 500+ operators from Red Hat, Certified, and Community sources. Search, filter, and install with one click — creates Namespace, OperatorGroup, and Subscription automatically. Real-time install progress tracking (Subscribe → Plan → Install → Ready). Post-install guidance shows what custom resources to create next.

### Production Readiness Checklist
31 automated checks across 6 categories — all auto-detected from the live cluster. Covers HA control plane, storage, identity providers, encryption, monitoring, logging, autoscaling, and more. Failed checks link directly to the operator catalog or configuration page.

### Auto-Generated Resource Tables
Every resource type gets a fully functional table with sortable columns, search, per-column filters, bulk operations, keyboard navigation (j/k/Enter), CSV/JSON export, and per-row delete with teardown progress.

![Table View](docs/screenshots/table-view.png)

### Overview Pages
- **Workloads**: Deployments, StatefulSets, DaemonSets, Pods, Jobs, CronJobs with health status and inline logs
- **Networking**: Services, Routes, Ingresses, exposed endpoints with HTTPS badges, network policy warnings
- **Compute**: Per-node metrics with utilization bars, Machine Management (Machines, MachineSets, Health Checks, Autoscaling with setup guidance)
- **Storage**: PVCs, PVs, StorageClasses with capacity breakdown

![Compute View](docs/screenshots/compute.png)
![Workloads View](docs/screenshots/workloads.png)

### Smart Diagnosis with Log Analysis
CrashLoopBackOff diagnoses now show the actual error from pod logs. 10 error patterns detected: Permission denied, Connection refused, OOM, DNS failure, read-only filesystem, wrong architecture, and more — each with specific fix suggestions.

### Administration
- **Operators tab**: ClusterOperator health with version, status, and degraded messages
- **Cluster Config**: Edit OAuth, Proxy, Image registries, Ingress, Scheduler, TLS — all with real API patches
- **Updates**: View available versions, change channel, initiate upgrades
- **Snapshots**: Capture cluster state, persist to localStorage, compare side-by-side
- **Quotas**: Resource quotas and limit ranges

![Admin View](docs/screenshots/admin-updates.png)

### Deployment-Level Logs
Click "Logs" on any Deployment — see logs from all pods with tabs to switch between them or view merged output.

### Prometheus Alerts
View firing alerts with links to affected resources, browse rules with copyable PromQL, manage silences.

### YAML Editor
Edit resources with syntax highlighting, validation, diff view, and 23 templates including operator subscriptions, autoscaler configs, and logging stack setup.

### And More
- **Troubleshooting**: Interactive runbooks with affected resources inline
- **Timeline**: Chronological event feed with namespace filtering
- **Dependency Graph**: Interactive SVG with blast radius analysis
- **Quick Deploy**: Form-based deploy with DeployProgress tracking
- **Helm Charts**: Catalog with one-click install via Job

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + TypeScript 5.9 |
| **Bundler** | Rspack 1.7 (Rust-based, ~1s builds) |
| **State** | Zustand (client) + TanStack Query (server) |
| **Real-time** | WebSocket watches + polling fallback |
| **Styling** | Tailwind CSS 3.4 |
| **Testing** | Vitest + jsdom + MSW (902 tests) |
| **Icons** | Lucide React |

## Getting Started

```bash
# Install dependencies
npm install

# Log in to your cluster
oc login --server=https://api.your-cluster.example.com:6443

# Start the API proxy
oc proxy --port=8001 &

# Start the dev server (port 9000)
npm run dev
```

## Testing

```bash
npm test              # Run 902 tests
npm run type-check    # TypeScript checking
```

## Architecture

```
src/kubeview/
├── engine/              # Query, discovery, diagnosis, actions, renderers
├── views/               # 15 page components
├── components/          # Shared UI (ClusterConfig, DeployProgress, etc.)
├── hooks/               # useK8sListWatch, useNavigateTab, etc.
├── store/               # Zustand (uiStore, clusterStore)
└── App.tsx              # 23 routes
```

## Stats

- **100+** production files
- **902** tests across 58 files
- **23** routes
- **23** YAML templates
- **31** production readiness checks
- **500+** operators in catalog
- **10** error pattern detections

## License

MIT
