'use client'
import { useEffect, useState, useRef, forwardRef } from 'react'

// ─────────────────────────────────────────────
// Vertex shader — full-screen quad
// ─────────────────────────────────────────────
const VERT = `
attribute vec2 a_pos;
varying vec2 vUv;
void main() {
  vUv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

// ─────────────────────────────────────────────
// Fragment shader — with animated film grain + vignette
// ─────────────────────────────────────────────
const FRAG = `
precision mediump float;

uniform float uTime;
uniform float uAmplitude;
uniform float uReveal;
varying vec2  vUv;

// ── Hash-based white noise (grain) ──────────────────
float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

// ── Smooth value noise (low-freq roll) ──────────────
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 uv = vUv;
  vec2 centeredUv = 2.0 * uv - 1.0;
  float distortionStrength = uAmplitude * uReveal;

  centeredUv += distortionStrength * 0.4 * sin(1.0  * centeredUv.yx + vec2(1.2, 3.4) + uTime);
  centeredUv += distortionStrength * 0.2 * sin(5.2  * centeredUv.yx + vec2(3.5, 0.4) + uTime);
  centeredUv += distortionStrength * 0.3 * sin(3.5  * centeredUv.yx + vec2(1.2, 3.1) + uTime);
  centeredUv += distortionStrength * 1.6 * sin(0.4  * centeredUv.yx + vec2(0.8, 2.4) + uTime);

  vec3 c0 = vec3(0.000, 0.000, 0.000);
  vec3 c1 = vec3(0.937, 0.949, 0.753);
  vec3 c2 = vec3(0.624, 0.918, 0.976);
  vec3 c3 = vec3(0.463, 0.608, 0.635);

  vec3 uColors[4];
  uColors[0] = c0;
  uColors[1] = c1;
  uColors[2] = c2;
  uColors[3] = c3;

  vec3 color = uColors[0];
  for (int i = 0; i < 4; i++) {
    float r = cos(float(i) * length(centeredUv));
    color = mix(color, uColors[i], r);
  }

  // ── Film grain ───────────────────────────────────────
  // Animate grain by offsetting UV with time so it flickers each frame
  float grainSeed = uTime * 0.0001;
  vec2  grainUv   = vUv * vec2(1280.0, 720.0); // pixel density
  float grain     = hash(grainUv + grainSeed) * 2.0 - 1.0; // [-1, 1]

  // Coarser low-frequency noise rolled over time for a "dust" layer
  float dust = vnoise(vUv * 6.0 + uTime * 0.07) * 2.0 - 1.0;

  // Combine: fine grain + coarser structure
  float noiseVal = grain * 0.055 + dust * 0.018;

  // Scale grain down when reveal is still low (fade in with the image)
  noiseVal *= uReveal;

  color += noiseVal;

  // ── Vignette ─────────────────────────────────────────
  float vignette = 1.0 - dot(centeredUv * 0.55, centeredUv * 0.55);
  vignette = pow(clamp(vignette, 0.0, 1.0), 1.4);
  color *= mix(0.55, 1.0, vignette);

  gl_FragColor = vec4(mix(vec3(0.0), color, uReveal), 1.0);
}
`

// ─────────────────────────────────────────────
// WebGL helpers
// ─────────────────────────────────────────────
function compileShader(gl: WebGLRenderingContext, src: string, type: number) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    console.error('Shader error:', gl.getShaderInfoLog(s))
  return s
}

function buildProgram(gl: WebGLRenderingContext) {
  const prog = gl.createProgram()!
  gl.attachShader(prog, compileShader(gl, VERT, gl.VERTEX_SHADER))
  gl.attachShader(prog, compileShader(gl, FRAG, gl.FRAGMENT_SHADER))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    console.error('Program error:', gl.getProgramInfoLog(prog))
  return prog
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
interface ShaderPillProps {
  className?: string
  style?: React.CSSProperties
}

const ShaderPill = forwardRef<HTMLDivElement, ShaderPillProps>(
  ({ className = '', style }, ref) => {
    const [hovered, setHovered] = useState(false)

    const canvasRef   = useRef<HTMLCanvasElement>(null)
    const rafRef      = useRef<number>(0)
    const labelRef    = useRef<HTMLDivElement>(null)

    const targetPos   = useRef({ x: 0, y: 0 })
    const currentPos  = useRef({ x: 0, y: 0 })
    const hoveredRef  = useRef(false)
    const labelRafRef = useRef<number>(0)

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      targetPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const handleEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      currentPos.current = { x, y }
      targetPos.current  = { x, y }
      hoveredRef.current = true
      setHovered(true)
      animateLabel()
    }

    const handleLeave = () => {
      hoveredRef.current = false
      setHovered(false)
      cancelAnimationFrame(labelRafRef.current)
    }

    function animateLabel() {
      const LERP = 0.1

      function tick() {
        if (!hoveredRef.current) return

        currentPos.current.x += (targetPos.current.x - currentPos.current.x) * LERP
        currentPos.current.y += (targetPos.current.y - currentPos.current.y) * LERP

        if (labelRef.current) {
          labelRef.current.style.left = `${currentPos.current.x + 14}px`
          labelRef.current.style.top  = `${currentPos.current.y + 14}px`
        }

        labelRafRef.current = requestAnimationFrame(tick)
      }

      labelRafRef.current = requestAnimationFrame(tick)
    }

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const glRaw = canvas.getContext('webgl', { antialias: true, alpha: false })
      if (!glRaw) return
      const gl: WebGLRenderingContext = glRaw

      const prog       = buildProgram(gl)
      const uTime      = gl.getUniformLocation(prog, 'uTime')
      const uAmplitude = gl.getUniformLocation(prog, 'uAmplitude')
      const uReveal    = gl.getUniformLocation(prog, 'uReveal')
      const aPos       = gl.getAttribLocation(prog, 'a_pos')

      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1,  1, -1,  -1, 1,  1, 1]),
        gl.STATIC_DRAW
      )
      gl.useProgram(prog)
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

      const cfg = {
        amplitude:               0.65,
        timeSpeed:               0.008,
        holdAmplitudeMultiplier: 2.0,
        holdTimeSpeedMultiplier: 1.5,
        lerpSpeed:               0.03,
        revealDuration:          2000,
        revealDelay:             300,
      }

      let isHolding        = false
      let currentAmplitude = cfg.amplitude
      let currentTimeSpeed = cfg.timeSpeed
      let reveal           = 0
      let revealStarted    = false
      let time             = 0
      let revealStart      = 0

      function startReveal() {
        revealStarted = true
        revealStart   = performance.now() + cfg.revealDelay
      }
      setTimeout(startReveal, 0)

      const onDown  = () => { isHolding = true  }
      const onUp    = () => { isHolding = false }
      canvas.addEventListener('mousedown',  onDown)
      canvas.addEventListener('touchstart', onDown, { passive: true })
      window.addEventListener('mouseup',    onUp)
      window.addEventListener('touchend',   onUp)

      function resize() {
        if (!canvas) return
        const dpr = Math.min(window.devicePixelRatio, 2)
        canvas.width  = canvas.offsetWidth  * dpr
        canvas.height = canvas.offsetHeight * dpr
        gl.viewport(0, 0, canvas.width, canvas.height)
      }
      const ro = new ResizeObserver(resize)
      ro.observe(canvas)
      resize()

      function lerp(a: number, b: number, t: number) {
        return a + (b - a) * t
      }

      function easeOut(t: number) {
        return 1 - Math.pow(1 - t, 3)
      }

      function frame() {
        if (revealStarted) {
          const now     = performance.now()
          const elapsed = Math.max(0, now - revealStart)
          reveal        = Math.min(1, easeOut(elapsed / cfg.revealDuration))
        }

        const targetAmp   = isHolding
          ? cfg.amplitude * cfg.holdAmplitudeMultiplier
          : cfg.amplitude
        const targetSpeed = isHolding
          ? cfg.timeSpeed * cfg.holdTimeSpeedMultiplier
          : cfg.timeSpeed

        currentAmplitude = lerp(currentAmplitude, targetAmp,   cfg.lerpSpeed)
        currentTimeSpeed = lerp(currentTimeSpeed, targetSpeed, cfg.lerpSpeed)
        time += currentTimeSpeed

        gl.uniform1f(uTime,      time)
        gl.uniform1f(uAmplitude, currentAmplitude)
        gl.uniform1f(uReveal,    reveal)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        rafRef.current = requestAnimationFrame(frame)
      }

      rafRef.current = requestAnimationFrame(frame)

      return () => {
        cancelAnimationFrame(rafRef.current)
        cancelAnimationFrame(labelRafRef.current)
        ro.disconnect()
        canvas.removeEventListener('mousedown',  onDown)
        canvas.removeEventListener('touchstart', onDown)
        window.removeEventListener('mouseup',    onUp)
        window.removeEventListener('touchend',   onUp)
      }
    }, [])

    return (
      <div
        ref={ref}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onMouseMove={handleMove}
        className={`relative overflow-hidden rounded-full ${className}`}
        style={style}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {hovered && (
          <div
            ref={labelRef}
            className="absolute pointer-events-none"
            style={{
              left: currentPos.current.x + 14,
              top:  currentPos.current.y + 14,
              transform: 'translate(-10%, -50%)',
              willChange: 'left, top',
            }}
          >
            <div className="price text-white text-sm px-1 mono whitespace-nowrap">
              <span className="mix-blend-difference">Hold</span>
            </div>
          </div>
        )}
      </div>
    )
  }
)

ShaderPill.displayName = 'ShaderPill'
export default ShaderPill