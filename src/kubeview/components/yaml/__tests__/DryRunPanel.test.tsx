import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf-8');
}

describe('DryRunPanel', () => {
  const source = readSrc('DryRunPanel.tsx');

  describe('dry-run API integration', () => {
    it('sends dryRun=All query parameter', () => {
      expect(source).toContain('?dryRun=All');
    });

    it('uses the same HTTP method as the real request', () => {
      expect(source).toContain("method: 'POST' | 'PUT'");
      expect(source).toContain('method,');
    });

    it('sends YAML content type', () => {
      expect(source).toContain("'Content-Type': 'application/yaml'");
    });

    it('includes impersonation headers', () => {
      expect(source).toContain('getImpersonationHeaders');
      expect(source).toContain('Impersonate-User');
    });

    it('sends the YAML body', () => {
      expect(source).toContain('body: yaml');
    });
  });

  describe('error handling', () => {
    it('parses K8s field-level validation errors', () => {
      expect(source).toContain('details?.causes');
      expect(source).toContain('cause.field');
      expect(source).toContain('cause.message');
    });

    it('shows error count in header', () => {
      expect(source).toContain('Validation failed');
      expect(source).toContain('error');
    });

    it('handles network errors gracefully', () => {
      expect(source).toContain('Dry-run request failed');
    });
  });

  describe('success state', () => {
    it('shows valid confirmation', () => {
      expect(source).toContain('Valid');
      expect(source).toContain('ready to apply');
    });

    it('converts server response to YAML for comparison', () => {
      expect(source).toContain('resourceToYaml');
    });

    it('computes server-applied defaults', () => {
      expect(source).toContain('defaultsApplied');
      expect(source).toContain('computeYamlDiffs');
    });

    it('shows clean state when no defaults applied', () => {
      expect(source).toContain('No additional fields will be added by the server');
    });
  });

  describe('server defaults display', () => {
    it('shows added fields in green', () => {
      expect(source).toContain("'bg-green-500'");
      expect(source).toContain("type === 'added'");
    });

    it('shows modified fields in blue', () => {
      expect(source).toContain("'bg-blue-500'");
      expect(source).toContain("'modified'");
    });

    it('has expandable defaults section', () => {
      expect(source).toContain('Server-applied defaults');
      expect(source).toContain('setShowDiff');
    });

    it('has expandable full YAML preview', () => {
      expect(source).toContain('Server result YAML');
      expect(source).toContain('setShowFullYaml');
    });
  });

  describe('warnings', () => {
    it('parses Warning response header', () => {
      expect(source).toContain("res.headers.get('Warning')");
    });

    it('displays warnings with amber styling', () => {
      expect(source).toContain('text-amber-400');
      expect(source).toContain('text-amber-300');
    });
  });

  describe('UI controls', () => {
    it('has re-validate button', () => {
      expect(source).toContain('Re-validate');
      expect(source).toContain('runDryRun');
    });

    it('has close button', () => {
      expect(source).toContain('onClose');
    });

    it('auto-runs on mount', () => {
      expect(source).toContain('useEffect');
      expect(source).toContain('runDryRun');
    });
  });

  describe('integration with views', () => {
    it('is imported in CreateView', () => {
      const createView = fs.readFileSync(path.join(__dirname, '../../../views/CreateView.tsx'), 'utf-8');
      expect(createView).toContain('DryRunPanel');
      expect(createView).toContain('showDryRun');
      expect(createView).toContain("method=\"POST\"");
    });

    it('is imported in YamlEditorView', () => {
      const editorView = fs.readFileSync(path.join(__dirname, '../../../views/YamlEditorView.tsx'), 'utf-8');
      expect(editorView).toContain('DryRunPanel');
      expect(editorView).toContain('showDryRun');
      expect(editorView).toContain("method=\"PUT\"");
    });

    it('CreateView uses POST for dry-run', () => {
      const createView = fs.readFileSync(path.join(__dirname, '../../../views/CreateView.tsx'), 'utf-8');
      expect(createView).toContain('method="POST"');
    });

    it('YamlEditorView uses PUT for dry-run', () => {
      const editorView = fs.readFileSync(path.join(__dirname, '../../../views/YamlEditorView.tsx'), 'utf-8');
      expect(editorView).toContain('method="PUT"');
    });

    it('CreateView has Validate button', () => {
      const createView = fs.readFileSync(path.join(__dirname, '../../../views/CreateView.tsx'), 'utf-8');
      expect(createView).toContain('Validate');
      expect(createView).toContain('ShieldCheck');
    });

    it('YamlEditorView shows Validate only when changes exist', () => {
      const editorView = fs.readFileSync(path.join(__dirname, '../../../views/YamlEditorView.tsx'), 'utf-8');
      expect(editorView).toContain('hasChanges');
      expect(editorView).toContain('Validate');
    });
  });
});
