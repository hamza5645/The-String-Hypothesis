import { MapSvg } from './MapSvg'
import { useM } from './store'

// No-WebGL fallback: the whole map, top-down. Bridges follow the Lab's toggles (all shown until one is used),
// so the fallback keeps the pieces counter live.
export default function Fallback() {
  const T = useM((s) => s.T)
  const S = useM((s) => s.S)
  const L = useM((s) => s.L)
  const C = useM((s) => s.C)
  const any = T || S || L || C
  const on = { T, S, L, C }
  return <MapSvg className="mth-fallback" active={any ? (b) => on[b.kind] : (b) => b.kind !== 'C'} />
}
