# Changelog

## [4.1.0] - 2026-03-19

### Added
- **HyperShift / Hosted Control Plane support** — Auto-detects hosted clusters via Infrastructure resource (`controlPlaneTopology: External`). Adapts health checks, production readiness, and compute view for hosted control plane model.
- **Persistent topology badge** — "Hosted" pill in CommandBar visible on every view when running on a HyperShift cluster.
- **"Hosted Control Plane" badge** on Pulse daily briefing with tooltip explaining the hosting model.
- **Control Plane InfoCard** in Admin overview showing topology type (Hosted/Self-managed) and API server URL.
- **Snapshot topology tracking** — `controlPlaneTopology` captured in cluster snapshots and included in diff comparisons.
- **Prerequisites section** in README with OCP, Node.js, oc CLI, and browser requirements.

### Changed
- **Health checks adapted for HyperShift** — HA Control Plane, MachineHealthChecks, and Cluster Autoscaling checks skip on hosted clusters (irrelevant when CP is external). Production Readiness shows "Hosted Control Plane: Managed externally" as auto-pass.
- **Etcd backup check** auto-passes on HyperShift with "Managed by hosting provider" instead of SSH backup instructions.
- **Worker Nodes check** threshold adjusted to 1+ on HyperShift (vs 2+ on traditional) since all nodes are workers.
- **Machine Management section** hidden on HyperShift ComputeView with info block explaining NodePool model.
- **Machine API queries gated** — Machines, MachineSets, MachineHealthChecks, MachineAutoscalers, and ClusterAutoscaler queries disabled on HyperShift clusters (`enabled: !isHyperShift`) to avoid unnecessary API calls.
- **AdminView** unified to read `isHyperShift` from `useClusterStore` instead of deriving locally, matching all other views.
- **Create button hidden** for Nodes in resource browser (nodes are provisioned via MachineSet/NodePool, not created directly).
- **README rewritten** — Added 10 previously undocumented features, fixed stale test/health check counts, added all keyboard shortcuts, added prerequisites section.

### Fixed
- Control plane operator list on Pulse no longer shows missing operators as broken on HyperShift — only shows operators that actually exist in the cluster.
- Health check count corrected from 67 to 76 (Security view's 9 checks were previously uncounted).

### Stats
- **1162 tests** across 63 test files (up from 1128/61 in v4.0.0)
- **76 health checks** (31 cluster + 45 domain)
- **13 views**, 35 routes
- Build time: ~1s (Rspack)

---

## [4.0.0] - 2026-03-15

### Added
- **Project renamed** from ShiftOps to **OpenShift Pulse**
- **New logo** — Blue gradient P with sparkles (`docs/logo.svg`)
- **Favicon** — Inline SVG P letter in `public/index.html`
- **Welcome view** — Hero, cluster status, Pulse CTA, quick nav, start-here cards, all views grid, key capabilities showcase, keyboard shortcuts
- **Pulse view** — 4-tab cluster health: Daily Briefing (risk score ring, CP status, certs, attention items), Issues, Runbooks, Namespace Health
- **Security view** — 9-check security audit, policy status, vulnerability context
- **Admin view** — 9 tabs: Overview, Readiness (31 checks), Operators, Cluster Config (10 editable sections), Updates, Snapshots, Quotas, Certificates, Timeline
- **Cluster Snapshots** — Capture and compare cluster state (ClusterVersion, nodes, operators, CRDs, storage classes, RBAC, config)
- **Cluster Timeline** — Event timeline with 1h/6h/24h ranges, severity filters, namespace filtering
- **Production Readiness** — 31-check automated score across infrastructure, security, observability, reliability
- **Deployment Rollback** — Revision history with container image diffs, one-click rollback
- **Pod/Node Terminal** — WebSocket exec with GitHub-dark theme, command history, suggestions
- **Dry-Run Validation** — Server-side dry-run before applying YAML changes
- **Dock Panel** — Resizable bottom panel for terminal and log sessions
- **Resource Creation** — 5 modes: Quick Deploy, Templates, Helm, Import YAML, Installed operators
- **Operator Catalog** — Browse 500+ operators, one-click install with 4-step progress tracking
- **Smart Diagnosis** — 10 error patterns detected from pod logs with fix suggestions
- **User Impersonation** — `Impersonate-User` headers on all API calls, CRLF-sanitized
- **WebSocket watches** — Real-time resource updates with 60s polling fallback
- **OAuth proxy deployment** — 2 replicas, PDB, topology spread, zero-downtime, security hardened

### Security
- Passed 15-finding security audit (1 critical, 4 high, 7 medium, 3 low — all resolved)
- Helm command injection, SSRF, CRLF injection, path traversal, RegExp DoS — all fixed
- CSP, HSTS, X-Frame-Options, TLS verification, readOnlyRootFilesystem
