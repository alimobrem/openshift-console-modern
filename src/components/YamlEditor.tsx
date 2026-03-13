import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Label } from '@patternfly/react-core';
import {
  CopyIcon,
  DownloadIcon,
  EditIcon,
  UndoIcon,
  SaveIcon,
  SearchIcon,
  ExpandIcon,
  CompressIcon,
  AlignLeftIcon,
} from '@patternfly/react-icons';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { search, openSearchPanel } from '@codemirror/search';
import { EditorView } from '@codemirror/view';
import { useUIStore } from '@/store/useUIStore';

interface YamlEditorProps {
  /** The raw JSON string to display */
  value: string;
  /** Resource name for download filename */
  name: string;
  /** API URL for saving (PUT). If not provided, save is disabled. */
  apiUrl?: string;
  /** Called after a successful save with the new raw JSON */
  onSaved?: (newValue: string) => void;
}

type ViewFormat = 'json' | 'yaml';

/** Convert JSON string to YAML-like output (simple, no external dep) */
function jsonToYaml(jsonStr: string): string {
  try {
    const obj = JSON.parse(jsonStr);
    return toYaml(obj, 0);
  } catch {
    return jsonStr;
  }
}

function toYaml(value: unknown, indent: number): string {
  const pad = '  '.repeat(indent);
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (value.includes('\n')) return `|\n${value.split('\n').map(l => pad + '  ' + l).join('\n')}`;
    if (/[:#{}[\],&*?|>!'"%@`]/.test(value) || value === '' || value === 'true' || value === 'false' || value === 'null' || !isNaN(Number(value)))
      return JSON.stringify(value);
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value.map(item => {
      const rendered = toYaml(item, indent + 1);
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const lines = rendered.split('\n');
        return `${pad}- ${lines[0].trimStart()}\n${lines.slice(1).join('\n')}`;
      }
      return `${pad}- ${rendered}`;
    }).join('\n');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries.map(([k, v]) => {
      const key = /[:#{}[\],&*?|>!'"%@`\s]/.test(k) ? JSON.stringify(k) : k;
      if (typeof v === 'object' && v !== null) {
        const rendered = toYaml(v, indent + 1);
        return `${pad}${key}:\n${rendered}`;
      }
      return `${pad}${key}: ${toYaml(v, indent + 1)}`;
    }).join('\n');
  }
  return String(value);
}

const wordWrapExt = EditorView.lineWrapping;

export default function YamlEditor({ value, name, apiUrl, onSaved }: YamlEditorProps) {
  const addToast = useUIStore((s) => s.addToast);
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [format, setFormat] = useState<ViewFormat>('json');
  const [wordWrap, setWordWrap] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Track if value changed externally (e.g. resource refreshed)
  useEffect(() => {
    if (!editing) setEditValue(value);
  }, [value, editing]);

  const isDark = document.documentElement.classList.contains('dark');
  const isModified = editing && editValue !== value;
  const lineCount = (editing ? editValue : displayValue()).split('\n').length;
  const byteSize = new Blob([editing ? editValue : displayValue()]).size;

  function displayValue(): string {
    return format === 'yaml' ? jsonToYaml(value) : value;
  }

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(editing ? editValue : displayValue());
    addToast({ type: 'success', title: 'Copied to clipboard' });
  }, [editing, editValue, value, format, addToast]);

  const handleDownload = useCallback(() => {
    const content = editing ? editValue : displayValue();
    const ext = format === 'yaml' ? 'yaml' : 'json';
    const blob = new Blob([content], { type: `text/${ext}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: `Downloaded ${name}.${ext}` });
  }, [editing, editValue, value, format, name, addToast]);

  const handleFormat = useCallback(() => {
    if (!editing) return;
    try {
      const parsed = JSON.parse(editValue);
      setEditValue(JSON.stringify(parsed, null, 2));
      addToast({ type: 'success', title: 'Formatted' });
    } catch {
      addToast({ type: 'error', title: 'Invalid JSON — cannot format' });
    }
  }, [editing, editValue, addToast]);

  const handleSearch = useCallback(() => {
    const view = editorRef.current?.view;
    if (view) openSearchPanel(view);
  }, []);

  const handleEdit = useCallback(() => {
    setFormat('json'); // always edit in JSON
    setEditValue(value);
    setEditing(true);
  }, [value]);

  const handleRevert = useCallback(() => {
    setEditValue(value);
  }, [value]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEditValue(value);
  }, [value]);

  const handleSave = useCallback(async () => {
    if (!apiUrl) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(editValue);
    } catch {
      addToast({ type: 'error', title: 'Invalid JSON', description: 'Fix syntax errors before saving.' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      const newJson = JSON.stringify(updated, null, 2);
      setEditValue(newJson);
      setEditing(false);
      onSaved?.(newJson);
      addToast({ type: 'success', title: 'Resource saved' });
    } catch (err) {
      addToast({ type: 'error', title: 'Save failed', description: err instanceof Error ? err.message : String(err) });
    }
    setSaving(false);
  }, [apiUrl, editValue, addToast, onSaved]);

  const extensions = [
    format === 'yaml' && !editing ? yaml() : json(),
    search(),
    ...(wordWrap ? [wordWrapExt] : []),
  ];

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className={`os-yaml-editor${fullscreen ? ' os-yaml-editor--fullscreen' : ''}`}>
      {/* Toolbar */}
      <div className="os-yaml-editor__toolbar">
        <div className="os-yaml-editor__toolbar-left">
          {!editing && (
            <div className="os-yaml-editor__format-toggle">
              <button
                type="button"
                className={`os-yaml-editor__format-btn${format === 'json' ? ' os-yaml-editor__format-btn--active' : ''}`}
                onClick={() => setFormat('json')}
              >
                JSON
              </button>
              <button
                type="button"
                className={`os-yaml-editor__format-btn${format === 'yaml' ? ' os-yaml-editor__format-btn--active' : ''}`}
                onClick={() => setFormat('yaml')}
              >
                YAML
              </button>
            </div>
          )}
          {editing && <Label color="blue">Editing</Label>}
          {isModified && <Label color="orange">Modified</Label>}
        </div>
        <div className="os-yaml-editor__toolbar-right">
          {editing && (
            <>
              <Button variant="plain" size="sm" icon={<AlignLeftIcon />} onClick={handleFormat} aria-label="Format" title="Format JSON" />
              <Button variant="plain" size="sm" icon={<UndoIcon />} onClick={handleRevert} isDisabled={!isModified} aria-label="Revert" title="Revert changes" />
            </>
          )}
          <Button variant="plain" size="sm" icon={<SearchIcon />} onClick={handleSearch} aria-label="Search" title="Search (Ctrl+F)" />
          <Button variant="plain" size="sm" icon={wordWrap ? <AlignLeftIcon /> : <AlignLeftIcon />} onClick={() => setWordWrap(!wordWrap)} aria-label="Toggle word wrap" title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'} className={wordWrap ? 'os-yaml-editor__btn--active' : ''} />
          <Button variant="plain" size="sm" icon={fullscreen ? <CompressIcon /> : <ExpandIcon />} onClick={() => setFullscreen(!fullscreen)} aria-label="Toggle fullscreen" title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} />
          <span className="os-yaml-editor__separator" />
          <Button variant="secondary" size="sm" icon={<CopyIcon />} onClick={handleCopy}>Copy</Button>
          <Button variant="secondary" size="sm" icon={<DownloadIcon />} onClick={handleDownload}>Download</Button>
          {!editing && apiUrl && (
            <Button variant="primary" size="sm" icon={<EditIcon />} onClick={handleEdit}>Edit</Button>
          )}
          {editing && (
            <>
              <Button variant="secondary" size="sm" onClick={handleCancel}>Cancel</Button>
              <Button variant="primary" size="sm" icon={<SaveIcon />} onClick={handleSave} isLoading={saving} isDisabled={saving || !isModified}>Save</Button>
            </>
          )}
        </div>
      </div>

      {/* Editor */}
      <CodeMirror
        ref={editorRef}
        value={editing ? editValue : displayValue()}
        extensions={extensions}
        theme={isDark ? oneDark : 'light'}
        editable={editing}
        onChange={editing ? setEditValue : undefined}
        basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: editing, bracketMatching: true, indentOnInput: true }}
        style={{ fontSize: 13, borderRadius: '0 0 var(--modern-radius, 10px) var(--modern-radius, 10px)', overflow: 'hidden', border: '1px solid var(--modern-border, #eaeaea)', borderTop: 'none' }}
      />

      {/* Status bar */}
      <div className="os-yaml-editor__statusbar">
        <span>Lines: {lineCount}</span>
        <span>Size: {formatSize(byteSize)}</span>
        <span>{format.toUpperCase()}</span>
        {editing && <span>Ctrl+F to search</span>}
      </div>

      <style>{`
        .os-yaml-editor { display: flex; flex-direction: column; position: relative; }
        .os-yaml-editor--fullscreen {
          position: fixed; inset: 0; z-index: 9998;
          background: var(--modern-card, #fff);
          padding: 0;
        }
        .os-yaml-editor--fullscreen .cm-editor { max-height: none !important; height: calc(100vh - 88px) !important; }
        .os-yaml-editor__toolbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 12px; gap: 8px;
          background: var(--modern-bg, #fafafa);
          border: 1px solid var(--modern-border, #eaeaea);
          border-radius: var(--modern-radius, 10px) var(--modern-radius, 10px) 0 0;
        }
        .os-yaml-editor__toolbar-left { display: flex; align-items: center; gap: 8px; }
        .os-yaml-editor__toolbar-right { display: flex; align-items: center; gap: 4px; }
        .os-yaml-editor__format-toggle {
          display: flex; border: 1px solid var(--modern-border, #eaeaea); border-radius: 6px; overflow: hidden;
        }
        .os-yaml-editor__format-btn {
          padding: 4px 12px; font-size: 12px; font-weight: 500; border: none; cursor: pointer;
          background: transparent; color: var(--modern-text-secondary, #666);
          transition: background 0.1s, color 0.1s;
        }
        .os-yaml-editor__format-btn:hover { background: var(--modern-hover, #f5f5f5); }
        .os-yaml-editor__format-btn--active {
          background: var(--modern-accent, #0066cc) !important; color: #fff !important;
        }
        .os-yaml-editor__separator { width: 1px; height: 20px; background: var(--modern-border, #eaeaea); margin: 0 4px; }
        .os-yaml-editor__btn--active { color: var(--modern-accent, #0066cc) !important; }
        .os-yaml-editor__statusbar {
          display: flex; gap: 16px; padding: 4px 12px;
          font-size: 11px; color: var(--modern-text-muted, #999);
          background: var(--modern-bg, #fafafa);
          border: 1px solid var(--modern-border, #eaeaea); border-top: none;
          border-radius: 0 0 var(--modern-radius, 10px) var(--modern-radius, 10px);
        }
        .os-yaml-editor .cm-editor { max-height: 70vh; }
        .os-yaml-editor .cm-scroller { overflow: auto !important; }
      `}</style>
    </div>
  );
}
