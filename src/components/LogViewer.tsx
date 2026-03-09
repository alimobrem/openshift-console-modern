/**
 * LogViewer Component - Live log streaming viewer
 *
 * Required CSS classes (prefix: compass-log-):
 *
 *   .compass-log-viewer          - Root container, flex column, full height, border
 *   .compass-log-toolbar         - Toolbar area, flex row, gap, padding, border-bottom, align-items center
 *   .compass-log-toolbar-group   - Grouping within toolbar, flex row, gap, align-items center
 *   .compass-log-body            - Log content area, flex 1, overflow-y auto, font-family monospace, font-size 13px
 *   .compass-log-line            - Single log line, flex row, padding 2px 12px, white-space pre-wrap (toggled)
 *   .compass-log-line--even      - Even rows: subtle background (e.g., rgba(0,0,0,0.02) light / rgba(255,255,255,0.02) dark)
 *   .compass-log-line--error     - color: var(--pf-t--global--color--status--danger--default, #c9190b)
 *   .compass-log-line--warn      - color: var(--pf-t--global--color--status--warning--default, #f0ab00)
 *   .compass-log-line--debug     - color: var(--pf-t--global--color--disabled--default, #6a6e73); opacity 0.75
 *   .compass-log-line-number     - width 50px, text-align right, user-select none, color muted, padding-right 12px, flex-shrink 0
 *   .compass-log-line-content    - flex 1, min-width 0
 *   .compass-log-line--nowrap    - white-space nowrap, overflow-x hidden, text-overflow ellipsis
 *   .compass-log-highlight       - background-color: yellow; color: black (search match highlight)
 *   .compass-log-status          - Toolbar status text (line count, streaming indicator), font-size small, color muted
 *   .compass-log-paused-banner   - Small banner indicating streaming is paused
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Button,
  SearchInput,
  Select,
  SelectOption,
  MenuToggle,
} from '@patternfly/react-core';
import {
  PlayIcon,
  PauseIcon,
  DownloadIcon,
  CopyIcon,
  CompressIcon,
  ExpandIcon,
} from '@patternfly/react-icons';
import { useUIStore } from '@/store/useUIStore';

interface LogViewerProps {
  podName: string;
  namespace: string;
  containers: string[];
}

interface LogLine {
  id: number;
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

type LogLevel = LogLine['level'];

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
const HTTP_PATHS = [
  '/api/v1/users',
  '/api/v1/health',
  '/api/v1/orders',
  '/api/v1/products',
  '/api/v1/auth/token',
  '/api/v1/metrics',
  '/api/v1/config',
  '/api/v2/search',
  '/healthz',
  '/readyz',
  '/livez',
  '/api/v1/events',
  '/api/v1/notifications',
];
const STATUS_CODES = [200, 200, 200, 200, 201, 204, 301, 400, 401, 403, 404, 500, 503];
const USER_AGENTS = ['Mozilla/5.0', 'curl/7.88.1', 'Go-http-client/2.0', 'python-requests/2.31.0'];
const CLIENT_IPS = ['10.128.0.14', '10.128.0.22', '10.130.2.5', '172.16.0.101', '192.168.1.55'];

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLogLine(id: number): LogLine {
  const timestamp = new Date();
  const rand = Math.random();

  // ~5% ERROR, ~10% WARN, ~15% DEBUG, ~70% INFO
  let level: LogLevel;
  if (rand < 0.05) level = 'ERROR';
  else if (rand < 0.15) level = 'WARN';
  else if (rand < 0.30) level = 'DEBUG';
  else level = 'INFO';

  let message: string;

  switch (level) {
    case 'ERROR': {
      const errorMessages = [
        `Connection refused to database at postgres:5432 - retrying in 5s`,
        `Failed to process request: context deadline exceeded after 30s`,
        `OOMKilled: container exceeded memory limit (512Mi)`,
        `Unhandled exception in worker thread #${randomInt(1, 8)}: NullPointerException`,
        `TLS handshake failed with upstream service catalog-api: certificate expired`,
        `POST /api/webhook - 502 Bad Gateway (${randomInt(1000, 5000)}ms)`,
        `Redis connection pool exhausted (max: 50, active: 50, waiting: 12)`,
        `Panic recovered in handler: runtime error: index out of range [${randomInt(5, 20)}]`,
      ];
      message = randomItem(errorMessages);
      break;
    }
    case 'WARN': {
      const warnMessages = [
        `High latency detected on ${randomItem(HTTP_PATHS)}: ${randomInt(800, 3000)}ms (threshold: 500ms)`,
        `Connection pool utilization at ${randomInt(75, 95)}% (${randomInt(38, 48)}/50)`,
        `Deprecated API version v1beta1 called by client ${randomItem(CLIENT_IPS)}`,
        `Rate limit approaching for tenant org-${randomInt(100, 999)}: ${randomInt(900, 990)}/1000 requests`,
        `Disk usage at ${randomInt(80, 95)}% on /var/log - consider rotation`,
        `Slow query detected: SELECT * FROM orders WHERE status='pending' (${randomInt(500, 2000)}ms)`,
        `Certificate for *.internal.svc expires in ${randomInt(5, 30)} days`,
        `Retry attempt ${randomInt(2, 5)}/5 for upstream service payment-api`,
      ];
      message = randomItem(warnMessages);
      break;
    }
    case 'DEBUG': {
      const debugMessages = [
        `Request headers: Host=${randomItem(HTTP_PATHS).split('/')[1]}.svc.cluster.local, X-Request-ID=${crypto.randomUUID?.() ?? `req-${randomInt(10000, 99999)}`}`,
        `Cache lookup for key user:${randomInt(1000, 9999)}: ${Math.random() > 0.5 ? 'HIT' : 'MISS'}`,
        `DNS resolved catalog-api.default.svc.cluster.local -> ${randomItem(CLIENT_IPS)} in ${randomInt(1, 5)}ms`,
        `gRPC channel state change: READY -> IDLE (connection ${randomInt(1, 20)})`,
        `JWT token validated for sub=user-${randomInt(100, 999)}, exp=${Math.floor(Date.now() / 1000) + 3600}`,
        `Worker pool stats: active=${randomInt(2, 8)}, idle=${randomInt(0, 4)}, pending=${randomInt(0, 3)}`,
        `Outbound request to https://api.external.io/v2/verify - ${randomInt(50, 200)}ms`,
      ];
      message = randomItem(debugMessages);
      break;
    }
    default: {
      const infoMessages = [
        `${randomItem(HTTP_METHODS)} ${randomItem(HTTP_PATHS)} ${randomItem(STATUS_CODES)} ${randomInt(1, 400)}ms - ${randomItem(CLIENT_IPS)} "${randomItem(USER_AGENTS)}"`,
        `Health check passed: all ${randomInt(3, 8)} dependencies healthy`,
        `Listening on :${randomItem([8080, 8443, 3000, 9090] as const)}`,
        `Connected to PostgreSQL at postgres.database.svc:5432/appdb`,
        `Scheduled job cleanup-sessions completed in ${randomInt(100, 1500)}ms, removed ${randomInt(0, 150)} expired sessions`,
        `WebSocket connection established from ${randomItem(CLIENT_IPS)} (total active: ${randomInt(10, 200)})`,
        `Configuration reloaded from ConfigMap app-config (version: v${randomInt(1, 50)})`,
        `Request processed: orderId=ORD-${randomInt(10000, 99999)}, items=${randomInt(1, 10)}, total=$${(Math.random() * 500 + 10).toFixed(2)}`,
        `Serving static assets from /var/www/html (${randomInt(20, 200)} files, ${randomInt(1, 50)}MB)`,
        `Graceful shutdown initiated, draining ${randomInt(0, 15)} active connections`,
        `Started container with PID ${randomInt(1, 500)}, uid=1000, gid=1000`,
        `Kubernetes readiness probe: HTTP ${randomItem(HTTP_PATHS)} -> 200 OK`,
      ];
      message = randomItem(infoMessages);
      break;
    }
  }

  return { id, timestamp, level, message };
}

function formatTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

function getLogLevelClass(level: LogLevel): string {
  switch (level) {
    case 'ERROR': return 'compass-log-line--error';
    case 'WARN': return 'compass-log-line--warn';
    case 'DEBUG': return 'compass-log-line--debug';
    default: return '';
  }
}

function highlightText(text: string, search: string): React.ReactNode {
  if (!search) return text;

  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedSearch})`, 'gi');
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="compass-log-highlight">{part}</span>
    ) : (
      part
    )
  );
}

export default function LogViewer({ podName, containers }: LogViewerProps) {
  const addToast = useUIStore((s) => s.addToast);

  const [logs, setLogs] = useState<LogLine[]>(() => {
    const initial: LogLine[] = [];
    for (let i = 0; i < 50; i++) {
      initial.push(generateLogLine(i + 1));
    }
    return initial;
  });
  const [streaming, setStreaming] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [selectedContainer, setSelectedContainer] = useState(containers[0] ?? '');
  const [containerSelectOpen, setContainerSelectOpen] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);

  const logBodyRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(51);

  // Streaming interval
  useEffect(() => {
    if (!streaming) return;

    const interval = setInterval(() => {
      const count = Math.random() > 0.5 ? 2 : 1;
      const newLines: LogLine[] = [];
      for (let i = 0; i < count; i++) {
        newLines.push(generateLogLine(nextIdRef.current++));
      }
      setLogs((prev) => [...prev, ...newLines]);
    }, randomInt(1000, 2000));

    return () => clearInterval(interval);
  }, [streaming]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logBodyRef.current) {
      logBodyRef.current.scrollTop = logBodyRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Detect manual scroll to pause auto-scroll
  const handleScroll = useCallback(() => {
    const el = logBodyRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(isAtBottom);
  }, []);

  const filteredLogs = useMemo(() => {
    if (!searchValue) return logs;
    const lower = searchValue.toLowerCase();
    return logs.filter(
      (line) =>
        line.message.toLowerCase().includes(lower) ||
        line.level.toLowerCase().includes(lower)
    );
  }, [logs, searchValue]);

  const rawLogText = useCallback((): string => {
    return filteredLogs
      .map(
        (line) =>
          `${formatTimestamp(line.timestamp)} [${line.level}] ${line.message}`
      )
      .join('\n');
  }, [filteredLogs]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(rawLogText()).then(() => {
      addToast({
        type: 'success',
        title: 'Logs copied',
        description: `${filteredLogs.length} log lines copied to clipboard`,
      });
    }).catch(() => {
      addToast({
        type: 'error',
        title: 'Copy failed',
        description: 'Unable to copy logs to clipboard',
      });
    });
  }, [rawLogText, filteredLogs.length, addToast]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([rawLogText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${podName}_${selectedContainer}_${new Date().toISOString().slice(0, 19)}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Logs downloaded',
      description: `Saved ${filteredLogs.length} log lines`,
    });
  }, [rawLogText, podName, selectedContainer, filteredLogs.length, addToast]);

  const handleToggleStreaming = useCallback(() => {
    setStreaming((prev) => !prev);
  }, []);

  const handleToggleWordWrap = useCallback(() => {
    setWordWrap((prev) => !prev);
  }, []);

  const handleToggleTimestamps = useCallback(() => {
    setShowTimestamps((prev) => !prev);
  }, []);

  return (
    <div className="compass-log-viewer">
      <div className="compass-log-toolbar">
        <div className="compass-log-toolbar-group">
          <Select
            isOpen={containerSelectOpen}
            selected={selectedContainer}
            onSelect={(_event, selection) => {
              setSelectedContainer(selection as string);
              setContainerSelectOpen(false);
              setLogs([]);
              nextIdRef.current = 1;
            }}
            onOpenChange={(isOpen) => setContainerSelectOpen(isOpen)}
            toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                onClick={() => setContainerSelectOpen(!containerSelectOpen)}
                className="os-log__container-toggle"
              >
                {selectedContainer}
              </MenuToggle>
            )}
          >
            {containers.map((container) => (
              <SelectOption key={container} value={container}>
                {container}
              </SelectOption>
            ))}
          </Select>

          <SearchInput
            placeholder="Filter logs..."
            value={searchValue}
            onChange={(_event, value) => setSearchValue(value)}
            onClear={() => setSearchValue('')}
            className="os-log__search-input"
          />
        </div>

        <div className="compass-log-toolbar-group">
          <span className="compass-log-status">
            {filteredLogs.length} lines
            {searchValue && ` (filtered from ${logs.length})`}
            {streaming && (
              <span className="compass-log-status-streaming"> ● Streaming</span>
            )}
          </span>

          <Button
            variant="plain"
            onClick={handleToggleStreaming}
            aria-label={streaming ? 'Pause streaming' : 'Resume streaming'}
            title={streaming ? 'Pause streaming' : 'Resume streaming'}
          >
            {streaming ? <PauseIcon /> : <PlayIcon />}
          </Button>

          <Button
            variant="plain"
            onClick={handleToggleTimestamps}
            aria-label={showTimestamps ? 'Hide timestamps' : 'Show timestamps'}
            title={showTimestamps ? 'Hide timestamps' : 'Show timestamps'}
          >
            {showTimestamps ? 'TS' : <span className="os-log__timestamps-inactive">TS</span>}
          </Button>

          <Button
            variant="plain"
            onClick={handleToggleWordWrap}
            aria-label={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
            title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
          >
            {wordWrap ? <CompressIcon /> : <ExpandIcon />}
          </Button>

          <Button
            variant="plain"
            onClick={handleCopy}
            aria-label="Copy all logs"
            title="Copy all logs"
          >
            <CopyIcon />
          </Button>

          <Button
            variant="plain"
            onClick={handleDownload}
            aria-label="Download logs"
            title="Download logs"
          >
            <DownloadIcon />
          </Button>
        </div>
      </div>

      {!streaming && (
        <div className="compass-log-paused-banner">
          Streaming paused.{' '}
          <Button variant="link" isInline onClick={handleToggleStreaming}>
            Resume
          </Button>
        </div>
      )}

      <div
        className="compass-log-body"
        ref={logBodyRef}
        onScroll={handleScroll}
      >
        {filteredLogs.map((line, index) => {
          const levelClass = getLogLevelClass(line.level);
          const evenClass = index % 2 === 0 ? 'compass-log-line--even' : '';
          const wrapClass = !wordWrap ? 'compass-log-line--nowrap' : '';

          return (
            <div
              key={line.id}
              className={`compass-log-line ${evenClass} ${levelClass} ${wrapClass}`}
            >
              <span className="compass-log-line-number">{line.id}</span>
              <span className="compass-log-line-content">
                {showTimestamps && (
                  <span className="compass-log-timestamp">
                    {formatTimestamp(line.timestamp)}{' '}
                  </span>
                )}
                <span className="compass-log-level">[{line.level}]</span>{' '}
                {highlightText(line.message, searchValue)}
              </span>
            </div>
          );
        })}
      </div>

      {!autoScroll && (
        <Button
          className="compass-log-scroll-bottom"
          variant="primary"
          size="sm"
          onClick={() => {
            setAutoScroll(true);
            if (logBodyRef.current) {
              logBodyRef.current.scrollTop = logBodyRef.current.scrollHeight;
            }
          }}
        >
          Scroll to bottom
        </Button>
      )}

      <style>{`
        .compass-log-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 400px;
          border: 1px solid var(--pf-t--global--border--color--default, #d2d2d2);
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          background: var(--pf-t--global--background--color--primary--default, #fff);
        }

        .compass-log-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--pf-t--global--border--color--default, #d2d2d2);
          background: var(--pf-t--global--background--color--secondary--default, #f0f0f0);
        }

        .compass-log-toolbar-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .compass-log-body {
          flex: 1;
          overflow-y: auto;
          overflow-x: auto;
          font-family: 'Red Hat Mono', 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 13px;
          line-height: 1.5;
          padding: 4px 0;
        }

        .compass-log-line {
          display: flex;
          flex-direction: row;
          padding: 1px 12px;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .compass-log-line--even {
          background: rgba(0, 0, 0, 0.025);
        }

        .compass-log-line--nowrap {
          white-space: nowrap;
          overflow: hidden;
        }

        .compass-log-line--nowrap .compass-log-line-content {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .compass-log-line--error {
          color: var(--pf-t--global--color--status--danger--default, #c9190b);
        }

        .compass-log-line--warn {
          color: var(--pf-t--global--color--status--warning--default, #f0ab00);
        }

        .compass-log-line--debug {
          color: var(--pf-t--global--color--disabled--default, #6a6e73);
          opacity: 0.75;
        }

        .compass-log-line-number {
          width: 50px;
          min-width: 50px;
          text-align: right;
          padding-right: 12px;
          user-select: none;
          color: var(--pf-t--global--color--disabled--default, #6a6e73);
          flex-shrink: 0;
        }

        .compass-log-line-content {
          flex: 1;
          min-width: 0;
        }

        .compass-log-timestamp {
          color: var(--pf-t--global--color--disabled--default, #6a6e73);
        }

        .compass-log-level {
          font-weight: 600;
        }

        .compass-log-highlight {
          background-color: #fdd835;
          color: #000;
          border-radius: 2px;
          padding: 0 1px;
        }

        .compass-log-status {
          font-size: 12px;
          color: var(--pf-t--global--color--disabled--default, #6a6e73);
          white-space: nowrap;
        }

        .compass-log-status-streaming {
          color: var(--pf-t--global--color--status--success--default, #3e8635);
          animation: compass-log-pulse 2s ease-in-out infinite;
        }

        .compass-log-paused-banner {
          padding: 4px 12px;
          font-size: 12px;
          background: var(--pf-t--global--color--status--warning--default, #f0ab00);
          color: #000;
          text-align: center;
        }

        .compass-log-scroll-bottom {
          position: absolute;
          bottom: 16px;
          right: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          z-index: 10;
        }

        @keyframes compass-log-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* Dark theme adjustments */
        .pf-v6-theme-dark .compass-log-line--even,
        .pf-v5-theme-dark .compass-log-line--even {
          background: rgba(255, 255, 255, 0.03);
        }

        .pf-v6-theme-dark .compass-log-highlight,
        .pf-v5-theme-dark .compass-log-highlight {
          background-color: #f9a825;
          color: #000;
        }
      `}</style>
    </div>
  );
}
