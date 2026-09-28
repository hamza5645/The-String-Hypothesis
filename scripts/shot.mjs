#!/usr/bin/env node
// Screenshot harness for chapter development.
//
//   node scripts/shot.mjs --chapter vibration --p 0,0.5,1          (solo chapter at progress values)
//   node scripts/shot.mjs --chapter vibration --step lab --sp 0.5  (center a named step)
//   node scripts/shot.mjs --y 0.1,0.12,0.14                        (full journey at document fractions)
//   options: --w 1440 --h 900 --mobile (390x844 @2x, touch) --freeze 2.5 --quality high|medium|low
//            --out shots --wait 600 --deeper --base http://127.0.0.1:5173 --label name
//
// Prints the PNG paths plus any console errors / page errors. Exit code 1 if errors occurred.
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const argv = process.argv.slice(2)
const opt = (k, d) => {
  const i = argv.indexOf('--' + k)
  if (i < 0) return d
  const v = argv[i + 1]
  return v === undefined || v.startsWith('--') ? true : v
}
const base = opt('base', 'http://127.0.0.1:5173')
const chapter = opt('chapter', null)
const ps = String(opt('p', '')).split(',').filter(Boolean)
const step = opt('step', null)
const sps = String(opt('sp', '0.5')).split(',').filter(Boolean)
const ys = String(opt('y', '')).split(',').filter(Boolean)
const mobile = !!opt('mobile', false)
const W = Number(opt('w', mobile ? 390 : 1440))
const H = Number(opt('h', mobile ? 844 : 900))
const freeze = opt('freeze', '2.5')
const quality = opt('quality', 'high')
const out = opt('out', 'shots')
const wait = Number(opt('wait', 700))
const deeper = !!opt('deeper', false)
const label = opt('label', '')
fs.mkdirSync(out, { recursive: true })

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
})
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  hasTouch: mobile,
})
const page = await ctx.newPage()
const errors = []
const IGNORE = [/THREE\.Clock: This module has been deprecated/, /GPU stall due to ReadPixels/, /Automatic fallback to software WebGL/]
page.on('console', (m) => {
  if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.some((r) => r.test(m.text()))) errors.push(`[console.${m.type()}] ${m.text()}`)
})
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))

const shots = []
async function settle() {
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 30000 }).catch(() => errors.push('[harness] __stageReady timeout'))
  await page.waitForTimeout(wait)
}
const q = (o) => Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== false).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
const tag = mobile ? 'm' : `${W}x${H}`

if (chapter) {
  const targets = step ? sps.map((sp) => ({ step, sp })) : (ps.length ? ps : ['0.5']).map((p) => ({ p }))
  for (const t of targets) {
    const url = `${base}/?${q({ solo: chapter, ...t, freeze, quality, shot: 1, deeper: deeper ? 1 : null })}`
    await page.goto(url, { waitUntil: 'load' })
    await settle()
    const name = `${chapter}${label ? '-' + label : ''}-${t.step ? t.step + '@' + t.sp : 'p' + t.p}-${tag}.png`
    const file = path.join(out, name)
    await page.screenshot({ path: file })
    shots.push(file)
  }
} else if (ys.length) {
  await page.goto(`${base}/?${q({ freeze, quality, shot: 1, deeper: deeper ? 1 : null })}`, { waitUntil: 'load' })
  await settle()
  for (const y of ys) {
    await page.evaluate((f) => window.scrollTo(0, f * (document.documentElement.scrollHeight - innerHeight)), Number(y))
    await page.waitForTimeout(wait + 500)
    const file = path.join(out, `journey${label ? '-' + label : ''}-y${y}-${tag}.png`)
    await page.screenshot({ path: file })
    shots.push(file)
  }
} else {
  console.error('Pass --chapter <id> or --y <fractions>')
  process.exit(2)
}

const gl = await page.evaluate(() => {
  const c = document.querySelector('canvas')
  const g = c && (c.getContext('webgl2') || c.getContext('webgl'))
  if (!g) return 'no-webgl'
  const d = g.getExtension('WEBGL_debug_renderer_info')
  return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'webgl'
})
await browser.close()
console.log(`renderer: ${gl}`)
for (const s of shots) console.log('shot:', s)
const uniq = [...new Set(errors)]
if (uniq.length) {
  console.log(`\n${uniq.length} console problems:`)
  for (const e of uniq.slice(0, 40)) console.log('  ' + e)
  process.exit(1)
}
