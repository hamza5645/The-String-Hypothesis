// Dev / screenshot URL parameters (query string; ignored in production hosting that strips it).
//   ?solo=<chapterId>   render only that chapter (section + scene)
//   &p=0.5              scroll to this chapter progress (0..1) after layout
//   &step=<stepId>      scroll so that step's midpoint is centered
//   &sp=0.5             ...at this step progress instead of 0.5
//   &freeze=2.5         freeze the stage clock at t = 2.5s (deterministic screenshots)
//   &quality=low|medium|high   force a quality tier
//   &deeper=1           start with "deeper physics" mode on
//   &nowebgl=1          force the no-WebGL fallback

const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()

const num = (k: string) => {
  const v = q.get(k)
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export const params = {
  solo: q.get('solo'),
  p: num('p'),
  step: q.get('step'),
  sp: num('sp'),
  freeze: num('freeze'),
  quality: q.get('quality') as 'low' | 'medium' | 'high' | null,
  deeper: q.get('deeper') === '1',
  nowebgl: q.get('nowebgl') === '1',
  shot: q.has('shot'),
}
