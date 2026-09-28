// Static Thread for browsers without WebGL: a hairline curve over a blurred amber twin.
export default function Fallback() {
  const d = 'M80 212 C 230 196, 330 226, 460 208 S 690 196, 820 206'
  return (
    <svg viewBox="0 0 900 400" role="img" aria-label="A single glowing string, drawn as a thin curve of light">
      <defs>
        <filter id="pro-fb-blur" x="-10%" y="-200%" width="120%" height="500%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <linearGradient id="pro-fb-fade" x1="0" x2="1">
          <stop offset="0" stopColor="#FFC98A" stopOpacity="0" />
          <stop offset="0.04" stopColor="#FFC98A" />
          <stop offset="0.96" stopColor="#FFC98A" />
          <stop offset="1" stopColor="#FFC98A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="url(#pro-fb-fade)" strokeWidth="9" opacity="0.55" filter="url(#pro-fb-blur)" />
      <path d={d} fill="none" stroke="#FFF6E8" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
