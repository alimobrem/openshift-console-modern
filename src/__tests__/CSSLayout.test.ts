// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const compassCSS = readFileSync(resolve(__dirname, '../compass-theme.css'), 'utf-8');
const modernCSS = readFileSync(resolve(__dirname, '../modern-ui.css'), 'utf-8');

describe('CSS layout integrity', () => {
  it('compass-theme.css has no dangling selectors that merge with subsequent rules', () => {
    // Dangling selectors like ".pf-v6-l-grid," without a rule block
    // would merge with the next rule and break layout.
    // Check that PF6 layout classes are not used as selectors
    // combining with unrelated rules (e.g. command palette overlay).
    const lines = compassCSS.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // If a line is a PF6 layout selector ending with comma, the next non-empty
      // non-comment line should also be a selector or a "{" block, not a different component.
      if (/^\.pf-v6-l-(grid|flex|gallery|stack)\s*,\s*$/.test(line)) {
        // Find the next non-empty, non-comment line
        let j = i + 1;
        while (j < lines.length && (lines[j].trim() === '' || lines[j].trim().startsWith('/*'))) {
          // Skip comment blocks
          if (lines[j].trim().startsWith('/*')) {
            while (j < lines.length && !lines[j].includes('*/')) j++;
          }
          j++;
        }
        if (j < lines.length) {
          const nextLine = lines[j].trim();
          // Next meaningful line should be another selector in the same group or a "{" block
          // It should NOT be a completely unrelated selector like .compass-*
          expect(nextLine).not.toMatch(
            /^\.compass-/,
            `Dangling PF6 layout selector at line ${i + 1} merges with unrelated rule at line ${j + 1}`
          );
        }
      }
    }
  });

  it('modern-ui.css overrides code block styles for dark mode readability', () => {
    // Code blocks must have explicit background and color so YAML/code is readable
    expect(modernCSS).toContain('.pf-v6-c-code-block');
    expect(modernCSS).toMatch(/\.pf-v6-c-code-block\s*\{[^}]*background:/);
    expect(modernCSS).toMatch(/\.pf-v6-c-code-block\s*\{[^}]*color:/);
  });

  it('modern-ui.css does not use backdrop-filter (no glassmorphism)', () => {
    // The wildcard rule kills backdrop-filter, but no rule should set it positively
    const rules = modernCSS.split('}');
    for (const rule of rules) {
      if (rule.includes('backdrop-filter') && !rule.includes('none')) {
        // Only the kill-all rule should reference backdrop-filter
        expect(rule).toContain('none');
      }
    }
  });

  it('PF6 grid layout class is not overridden to display:flex or position:fixed', () => {
    // Ensure no CSS rule targets .pf-v6-l-grid with display:flex or position:fixed
    const gridRules = compassCSS.match(/\.pf-v6-l-grid[^{]*\{[^}]*\}/g) || [];
    for (const rule of gridRules) {
      expect(rule).not.toMatch(/display\s*:\s*flex/);
      expect(rule).not.toMatch(/position\s*:\s*fixed/);
    }
  });
});
