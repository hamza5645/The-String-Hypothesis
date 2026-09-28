#!/usr/bin/env node
// Package `dist/` (a normal Vite build) for publishing as a claude.ai Artifact:
// the host wraps the page in its own <!doctype><html><head><body> skeleton, so we emit the
// head's tags + body content without those wrappers, as artifact/index.html, and copy assets.
//
//   npm run build && node scripts/artifact.mjs
import fs from 'node:fs'
import path from 'node:path'

const dist = path.resolve('dist')
const out = path.resolve('artifact')
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? ''
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? ''

// keep: title, meta description/theme-color, icon, font links, stylesheets, module scripts, modulepreloads
const keep = head
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !/^<meta charset|^<meta name="viewport"/i.test(l))
  .join('\n')

const page = `${keep}\n<style>html,body{background:#05070B;margin:0}</style>\n${body.trim()}\n`
fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, 'index.html'), page)
fs.cpSync(path.join(dist, 'assets'), path.join(out, 'assets'), { recursive: true })

const files = fs.readdirSync(path.join(out, 'assets'))
let total = 0
for (const f of files) total += fs.statSync(path.join(out, 'assets', f)).size
console.log(`artifact/index.html (${page.length} B) + ${files.length} assets (${(total / 1024 / 1024).toFixed(2)} MB)`)
if (/src="\/|href="\/(?!\/)/.test(page)) console.warn('WARNING: absolute paths found — base must be ./')
