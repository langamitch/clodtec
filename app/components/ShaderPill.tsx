'use client'
import { useEffect, useRef, forwardRef } from 'react'

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
// Fragment shader — faithful port of the Odyn shader
// Original: sinusoidal distortion + 4-colour cosine mix + reveal
// Colours:  #000000 / #eff2c0 / #9feaf9 / #769ba2
// ─────────────────────────────────────────────
const FRAG = `
precision mediump float;

uniform float uTime;
uniform float uAmplitude;
uniform float uReveal;
varying vec2  vUv;

void main() {
  vec2 uv = vUv;
  vec2 centeredUv = 2.0 * uv - 1.0;
  float distortionStrength = uAmplitude * uReveal;

  // ── exact distortion from original ──
  centeredUv += distortionStrength * 0.4 * sin(1.0  * centeredUv.yx + vec2(1.2, 3.4) + uTime);
  centeredUv += distortionStrength * 0.2 * sin(5.2  * centeredUv.yx + vec2(3.5, 0.4) + uTime);
  centeredUv += distortionStrength * 0.3 * sin(3.5  * centeredUv.yx + vec2(1.2, 3.1) + uTime);
  centeredUv += distortionStrength * 1.6 * sin(0.4  * centeredUv.yx + vec2(0.8, 2.4) + uTime);

  // ── 4 colours from original palette ──
  vec3 c0 = vec3(0.000, 0.000, 0.000); // #000000
  vec3 c1 = vec3(0.937, 0.949, 0.753); // #eff2c0
  vec3 c2 = vec3(0.624, 0.918, 0.976); // #9feaf9
  vec3 c3 = vec3(0.463, 0.608, 0.635); // #769ba2

  vec3 uColors[4];
  uColors[0] = c0;
  uColors[1] = c1;
  uColors[2] = c2;
  uColors[3] = c3;

  // ── exact colour loop from original ──
  vec3 color = uColors[0];
  for (int i = 0; i < 4; i++) {
    float r = cos(float(i) * length(centeredUv));
    color = mix(color, uColors[i], r);
  }

  // ── reveal fade from black (original: mix(vec3(0), color, uReveal)) ──
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
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafRef    = useRef<number>(0)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const gl = canvas.getContext('webgl', { antialias: true, alpha: false })
      if (!gl) return

      const prog       = buildProgram(gl)
      const uTime      = gl.getUniformLocation(prog, 'uTime')
      const uAmplitude = gl.getUniformLocation(prog, 'uAmplitude')
      const uReveal    = gl.getUniformLocation(prog, 'uReveal')
      const aPos       = gl.getAttribLocation(prog, 'a_pos')

      // Full-screen quad
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

      // ── shader config (mirrors original) ──
      const cfg = {
        amplitude:               0.65,
        timeSpeed:               0.008,
        holdAmplitudeMultiplier: 2.0,
        holdTimeSpeedMultiplier: 1.5,
        lerpSpeed:               0.03,
        revealDuration:          2000,   // ms
        revealDelay:             300,    // ms
      }

      // ── state ──
      let isHolding       = false
      let currentAmplitude = cfg.amplitude
      let currentTimeSpeed = cfg.timeSpeed
      let reveal           = 0
      let revealStarted    = false
      let time             = 0

      // ── reveal animation (replaces GSAP tween) ──
      let revealStart = 0
      function startReveal() {
        revealStarted = true
        revealStart   = performance.now() + cfg.revealDelay
      }
      setTimeout(startReveal, 0)

      // ── hold interaction (mouse + touch) ──
      const onDown  = () => { isHolding = true  }
      const onUp    = () => { isHolding = false }
      canvas.addEventListener('mousedown',  onDown)
      canvas.addEventListener('touchstart', onDown, { passive: true })
      window.addEventListener('mouseup',    onUp)
      window.addEventListener('touchend',   onUp)

      // ── resize ──
      function resize() {
        const dpr = Math.min(window.devicePixelRatio, 2)
        canvas.width  = canvas.offsetWidth  * dpr
        canvas.height = canvas.offsetHeight * dpr
        gl.viewport(0, 0, canvas.width, canvas.height)
      }
      const ro = new ResizeObserver(resize)
      ro.observe(canvas)
      resize()

      // ── lerp helper ──
      function lerp(a: number, b: number, t: number) {
        return a + (b - a) * t
      }

      // ── ease-out (matches "ease-secondary" feel) ──
      function easeOut(t: number) {
        return 1 - Math.pow(1 - t, 3)
      }

      // ── render loop ──
      function frame() {
        // Update reveal
        if (revealStarted) {
          const now     = performance.now()
          const elapsed = Math.max(0, now - revealStart)
          reveal        = Math.min(1, easeOut(elapsed / cfg.revealDuration))
        }

        // Lerp amplitude & speed (hold interaction)
        const targetAmp   = isHolding
          ? cfg.amplitude * cfg.holdAmplitudeMultiplier
          : cfg.amplitude
        const targetSpeed = isHolding
          ? cfg.timeSpeed * cfg.holdTimeSpeedMultiplier
          : cfg.timeSpeed

        currentAmplitude = lerp(currentAmplitude, targetAmp,   cfg.lerpSpeed)
        currentTimeSpeed = lerp(currentTimeSpeed, targetSpeed, cfg.lerpSpeed)
        time += currentTimeSpeed

        // Upload uniforms
        gl.uniform1f(uTime,      time)
        gl.uniform1f(uAmplitude, currentAmplitude)
        gl.uniform1f(uReveal,    reveal)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        rafRef.current = requestAnimationFrame(frame)
      }

      rafRef.current = requestAnimationFrame(frame)

      return () => {
        cancelAnimationFrame(rafRef.current)
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
        className={`overflow-hidden rounded-full ${className}`}
        style={style}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    )
  }
)

ShaderPill.displayName = 'ShaderPill'
export default ShaderPill