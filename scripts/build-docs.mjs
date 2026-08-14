#!/usr/bin/env node
/**
 * Builds the submission document set.
 *
 *   docs/*.md  ──renders mermaid──▶  docs/build/*.md  ──pandoc──▶  *.docx
 *
 * Mermaid fences are rendered to PNG with headless Chromium and swapped for
 * image references, because a design document that must present use-case,
 * class, sequence and entity-relationship diagrams needs actual diagrams —
 * pandoc would otherwise emit them as unreadable code blocks.
 *
 * Usage: node scripts/build-docs.mjs [--skip-diagrams]
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(root, 'docs');
const buildDir = join(docsDir, 'build');
const imageDir = join(buildDir, 'diagrams');
const outDir = join(root, 'Architects_HealthEasy-G_22424715');

const skipDiagrams = process.argv.includes('--skip-diagrams');

mkdirSync(imageDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

/* ------------------------------------------------------------------ *
 * Mermaid rendering
 * ------------------------------------------------------------------ */

const MERMAID_PAGE = `<!doctype html><html><head><meta charset="utf-8">
<style>body{margin:0;background:#fff;font-family:system-ui,sans-serif}#c{display:inline-block;padding:16px}</style>
</head><body><div id="c"></div>
<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
mermaid.initialize({ startOnLoad:false, theme:'base', themeVariables:{
  fontFamily:'system-ui, sans-serif', fontSize:'14px',
  primaryColor:'#e8f3ee', primaryTextColor:'#12241d', primaryBorderColor:'#0d6b4e',
  lineColor:'#5b6b64', secondaryColor:'#f4f2ee', tertiaryColor:'#fbfaf8'
}});
window.renderDiagram = async (code) => {
  const { svg } = await mermaid.render('g' + Math.random().toString(36).slice(2), code);
  document.getElementById('c').innerHTML = svg;
  return true;
};
window.mermaidReady = true;
</script></body></html>`;

async function renderDiagrams(jobs) {
  if (jobs.length === 0) return;

  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });

  await page.setContent(MERMAID_PAGE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.mermaidReady === true, { timeout: 30000 });

  let ok = 0;
  for (const { code, file } of jobs) {
    try {
      await page.evaluate((c) => window.renderDiagram(c), code);
      await page.waitForTimeout(120);
      const element = await page.$('#c');
      await element.screenshot({ path: file });
      ok++;
    } catch (error) {
      console.warn(`  ! diagram failed (${basename(file)}): ${String(error).split('\n')[0]}`);
    }
  }

  await browser.close();
  console.log(`  rendered ${ok}/${jobs.length} diagrams`);
}

/* ------------------------------------------------------------------ *
 * Markdown preparation
 * ------------------------------------------------------------------ */

/**
 * Replaces ```mermaid fences with image references, collecting render jobs.
 * `\r?\n` matters: git checks these sources out with CRLF endings on Windows,
 * and a bare `\n` silently matches nothing.
 */
function extractDiagrams(markdown, slug, jobs) {
  let index = 0;
  return markdown.replace(/```mermaid\r?\n([\s\S]*?)```/g, (_match, code) => {
    index += 1;
    const name = `${slug}-${String(index).padStart(2, '0')}.png`;
    const file = join(imageDir, name);
    jobs.push({ code: code.trim(), file });
    return `![](diagrams/${name})`;
  });
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

const sources = readdirSync(docsDir).filter((f) => f.endsWith('.md')).sort();

if (sources.length === 0) {
  console.error('No .md sources found in docs/. Nothing to build.');
  process.exit(1);
}

console.log(`Building ${sources.length} document(s)\n`);

const jobs = [];
const prepared = [];

for (const source of sources) {
  const slug = basename(source, '.md').toLowerCase();
  const markdown = readFileSync(join(docsDir, source), 'utf8');
  const withImages = skipDiagrams ? markdown : extractDiagrams(markdown, slug, jobs);
  const target = join(buildDir, source);
  writeFileSync(target, withImages);
  prepared.push({ source, target });
}

if (!skipDiagrams) {
  console.log('Rendering diagrams…');
  await renderDiagrams(jobs);
  console.log('');
}

for (const { source, target } of prepared) {
  const name = basename(source, '.md');
  const docx = join(outDir, `${name}.docx`);

  execFileSync(
    'pandoc',
    [
      target,
      '-o', docx,
      '--from', 'markdown+pipe_tables+yaml_metadata_block',
      '--toc',
      '--toc-depth=3',
      '--resource-path', buildDir,
      '--metadata', 'lang=en-GB'
    ],
    { cwd: buildDir, stdio: 'inherit' }
  );

  // Keep a copy beside the Markdown source for the repository.
  copyFileSync(docx, join(docsDir, `${name}.docx`));

  const words = execFileSync('pandoc', [docx, '-t', 'plain'], { encoding: 'utf8' }).split(/\s+/).length;
  console.log(`  ✓ ${name}.docx  (${words.toLocaleString()} words)`);
}

console.log(`\nSubmission package: ${outDir}`);
