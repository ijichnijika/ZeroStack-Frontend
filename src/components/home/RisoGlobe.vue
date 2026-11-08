<script setup lang="ts">
/**
 * 首页背景孔版印刷旋转地球组件
 * 基于 Natural Earth 陆地掩码生成半色调网点球体，融合经纬线网格、动态套准十字准星与专色数据弧线。
 * 在提交/制版期间响应套印错位（Register Drift），并随视口可见性及系统低动效模式自适应停帧。
 */
import { onMounted, onUnmounted, ref } from 'vue'
import { LAND_WIDTH, LAND_HEIGHT, LAND_BITS } from './landMask'

const props = withDefaults(
  defineProps<{
    printing?: boolean
  }>(),
  {
    printing: false,
  },
)

const containerRef = ref<HTMLElement | null>(null)
const washCanvasRef = ref<HTMLCanvasElement | null>(null)
const pointsCanvasRef = ref<HTMLCanvasElement | null>(null)
const arcsCanvasRef = ref<HTMLCanvasElement | null>(null)

const TAU = Math.PI * 2
const AXIAL_TILT = 0.409 // 约 23.4° 地轴倾角

interface CityNode {
  name: string
  lat: number
  lon: number
}

// 核心节点：选用具有代表性的全球数字工坊与技术枢纽
const NODES: CityNode[] = [
  { name: 'Tokyo', lat: 35.68, lon: 139.76 },
  { name: 'Shanghai', lat: 31.23, lon: 121.47 },
  { name: 'Singapore', lat: 1.35, lon: 103.82 },
  { name: 'London', lat: 51.51, lon: -0.13 },
  { name: 'Paris', lat: 48.86, lon: 2.35 },
  { name: 'San Francisco', lat: 37.77, lon: -122.42 },
  { name: 'New York', lat: 40.71, lon: -74.01 },
  { name: 'Sydney', lat: -33.87, lon: 151.21 },
]

const ROUTES: [number, number][] = [
  [0, 5], // Tokyo -> SF
  [1, 3], // Shanghai -> London
  [2, 7], // Singapore -> Sydney
  [3, 6], // London -> NYC
  [4, 1], // Paris -> Shanghai
  [5, 6], // SF -> NYC
]

function latLonToVector(lat: number, lon: number): [number, number, number] {
  const phi = (lat * Math.PI) / 180
  const theta = (lon * Math.PI) / 180
  return [Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta)]
}

function normalize(v: [number, number, number]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

function slerp(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
  const theta = Math.acos(dot)
  if (Math.abs(theta) < 0.001) return a
  const sinTheta = Math.sin(theta)
  const w1 = Math.sin((1 - t) * theta) / sinTheta
  const w2 = Math.sin(t * theta) / sinTheta
  return [a[0] * w1 + b[0] * w2, a[1] * w1 + b[1] * w2, a[2] * w1 + b[2] * w2]
}

// 伪随机数生成器，保持网点抖动在各帧间具有确定性
function createRandom(seed = 101) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

let animId = 0
let destroyed = false
let isVisible = true
let lastTime = 0
let rotAngle = 0
let driftX = 0
let driftY = 0
let targetDriftX = 0
let targetDriftY = 0

onMounted(() => {
  const container = containerRef.value
  const washCanvas = washCanvasRef.value
  const pointsCanvas = pointsCanvasRef.value
  const arcsCanvas = arcsCanvasRef.value
  if (!container || !washCanvas || !pointsCanvas || !arcsCanvas) return

  const mediaReduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  // 1. 生成 Fibonacci 陆地半色调点云
  const rng = createRandom(301)
  const rawBits = atob(LAND_BITS)
  const bits = new Uint8Array(rawBits.length)
  for (let i = 0; i < rawBits.length; i++) {
    bits[i] = rawBits.charCodeAt(i)
  }

  const sampleCount = window.innerWidth < 768 ? 42000 : 75000
  const spherePoints: number[] = [] // x, y, z
  const sphereDetail: number[] = [] // size, alpha

  for (let i = 0; i < sampleCount; i++) {
    const lat = Math.asin(-1 + (2 * (i + 0.5)) / sampleCount)
    const lon = i * 2.3999632297 // 黄金角弧度
    let p: [number, number, number] = [
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
      Math.cos(lat) * Math.cos(lon),
    ]

    // 微弱网点抖动模拟物理丝网微扩散
    const jx = (rng() - 0.5) * 0.012
    const jy = (rng() - 0.5) * 0.012
    const jz = (rng() - 0.5) * 0.012
    p = normalize([p[0] + jx, p[1] + jy, p[2] + jz])

    const degLon = (Math.atan2(p[0], p[2]) * 180) / Math.PI
    const degLat = (Math.asin(p[1]) * 180) / Math.PI
    const px = Math.min(LAND_WIDTH - 1, Math.floor(((degLon + 180) / 360) * LAND_WIDTH))
    const py = Math.min(LAND_HEIGHT - 1, Math.floor(((90 - degLat) / 180) * LAND_HEIGHT))
    const idx = py * LAND_WIDTH + px
    const byte = bits[idx >> 3] ?? 0

    if (byte & (1 << (idx & 7))) {
      spherePoints.push(p[0], p[1], p[2])
      sphereDetail.push(1.3 + Math.pow(rng(), 2) * 1.5, 0.45 + Math.pow(rng(), 0.5) * 0.45)
    }
  }

  const totalPoints = spherePoints.length / 3

  // 2. 初始化 WebGL 点云管线
  const gl = pointsCanvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
  })

  let useWebGL = Boolean(gl)

  let pointProgram: WebGLProgram | null = null
  let posBuffer: WebGLBuffer | null = null
  let detailBuffer: WebGLBuffer | null = null
  let uSizeLoc: WebGLUniformLocation | null = null
  let uCenterLoc: WebGLUniformLocation | null = null
  let uRadiusLoc: WebGLUniformLocation | null = null
  let uAngleLoc: WebGLUniformLocation | null = null
  let uTiltLoc: WebGLUniformLocation | null = null
  let uDprLoc: WebGLUniformLocation | null = null
  let uPrintingLoc: WebGLUniformLocation | null = null

  if (gl) {
    const vsSource = `
      precision highp float;
      attribute vec3 a_position;
      attribute vec2 a_detail;
      uniform vec2 u_size;
      uniform vec2 u_center;
      uniform float u_radius;
      uniform float u_angle;
      uniform float u_tilt;
      uniform float u_dpr;
      uniform float u_printing;
      varying float v_alpha;
      varying float v_depth;

      void main() {
        // 自转
        float ca = cos(u_angle);
        float sa = sin(u_angle);
        vec3 p = vec3(
          a_position.x * ca + a_position.z * sa,
          a_position.y,
          -a_position.x * sa + a_position.z * ca
        );

        // 地轴倾角投影
        float ct = cos(u_tilt);
        float st = sin(u_tilt);
        vec2 xy = vec2(p.x, p.y * ct - p.z * st);
        float pz = p.y * st + p.z * ct;

        // 视口坐标
        vec2 screen = u_center + vec2(xy.x, -xy.y) * u_radius;

        // 印版微错位：制版中产生专色抖动
        if (u_printing > 0.5) {
          screen += vec2(sin(u_angle * 12.0) * 1.5, cos(u_angle * 12.0) * 1.2);
        }

        // 背面消隐与明暗衰减
        float backFade = pz > 0.0 ? 1.0 : max(0.0, 1.0 + pz * 3.5) * 0.18;
        v_alpha = a_detail.y * backFade;
        v_depth = pz;

        gl_Position = vec4(
          (screen.x / u_size.x) * 2.0 - 1.0,
          1.0 - (screen.y / u_size.y) * 2.0,
          0.0,
          1.0
        );

        float depthScale = 0.75 + 0.35 * max(0.0, pz);
        gl_PointSize = a_detail.x * u_dpr * depthScale;
      }
    `

    const fsSource = `
      precision mediump float;
      varying float v_alpha;
      varying float v_depth;

      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float soft = 1.0 - smoothstep(0.32, 0.5, dist);

        // 孔版专色：正面呈现 Riso 蓝与墨黑叠印，背部呈极浅墨线
        vec3 frontColor = mix(vec3(0.09, 0.09, 0.10), vec3(0.0, 0.47, 0.75), clamp(v_depth * 1.2, 0.0, 0.8));
        vec3 color = v_depth > 0.0 ? frontColor : vec3(0.09, 0.09, 0.10);

        gl_FragColor = vec4(color, v_alpha * soft * 0.60);
      }
    `

    const createShader = (type: number, src: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      return shader
    }

    const vs = createShader(gl.VERTEX_SHADER, vsSource)
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource)
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)

    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      pointProgram = prog
      gl.useProgram(prog)

      uSizeLoc = gl.getUniformLocation(prog, 'u_size')
      uCenterLoc = gl.getUniformLocation(prog, 'u_center')
      uRadiusLoc = gl.getUniformLocation(prog, 'u_radius')
      uAngleLoc = gl.getUniformLocation(prog, 'u_angle')
      uTiltLoc = gl.getUniformLocation(prog, 'u_tilt')
      uDprLoc = gl.getUniformLocation(prog, 'u_dpr')
      uPrintingLoc = gl.getUniformLocation(prog, 'u_printing')

      posBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spherePoints), gl.STATIC_DRAW)
      const aPos = gl.getAttribLocation(prog, 'a_position')
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0)

      detailBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, detailBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereDetail), gl.STATIC_DRAW)
      const aDetail = gl.getAttribLocation(prog, 'a_detail')
      gl.enableVertexAttribArray(aDetail)
      gl.vertexAttribPointer(aDetail, 2, gl.FLOAT, false, 0, 0)
    } else {
      useWebGL = false
    }
  }

  const washCtx = washCanvas.getContext('2d')!
  const arcsCtx = arcsCanvas.getContext('2d')!
  const pointsFallbackCtx = pointsCanvas.getContext('2d')

  // 3. 尺寸与中心定位自适应
  let cachedW = 0
  let cachedH = 0
  let globeRadius = 0
  let globeCenterX = 0
  let globeCenterY = 0

  const resize = () => {
    if (!container) return
    const w = container.clientWidth
    const h = container.clientHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    cachedW = w
    cachedH = h

    for (const c of [washCanvas, pointsCanvas, arcsCanvas]) {
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
      c.style.width = `${w}px`
      c.style.height = `${h}px`
    }

    // 桌面端适度偏右沉底，形成文字与样张之下的宏大衬底
    if (w >= 900) {
      globeRadius = Math.max(250, Math.min(370, w * 0.26))
      globeCenterX = w * 0.58
      globeCenterY = Math.max(320, Math.min(h * 0.48, 400))
    } else {
      globeRadius = Math.max(160, Math.min(250, w * 0.42))
      globeCenterX = w * 0.5
      globeCenterY = Math.min(h * 0.32, 270)
    }

    if (gl) {
      gl.viewport(0, 0, pointsCanvas.width, pointsCanvas.height)
    }
  }

  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(container)

  // 4. 监听全局指针缓动，提供适度的视差倾角反馈
  const handlePointer = (e: PointerEvent) => {
    if (e.pointerType === 'touch' || mediaReduced.matches) return
    const rect = container.getBoundingClientRect()
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1
    targetDriftX = Math.max(-1, Math.min(1, nx)) * 0.12
    targetDriftY = Math.max(-1, Math.min(1, ny)) * 0.1
  }

  window.addEventListener('pointermove', handlePointer, { passive: true })

  // 3D 投射计算工具
  const project3D = (
    v: [number, number, number],
    angle: number,
    tilt: number,
  ): [number, number, number] => {
    const ca = Math.cos(angle)
    const sa = Math.sin(angle)
    const rx = v[0] * ca + v[2] * sa
    const ry = v[1]
    const rz = -v[0] * sa + v[2] * ca

    const ct = Math.cos(tilt)
    const st = Math.sin(tilt)
    const x = rx
    const y = ry * ct - rz * st
    const z = ry * st + rz * ct

    return [globeCenterX + x * globeRadius, globeCenterY - y * globeRadius, z]
  }

  // 5. 渲染循环
  const render = (time: number) => {
    if (destroyed) return

    if (!lastTime) lastTime = time
    const dt = Math.min(time - lastTime, 48) / 1000
    lastTime = time

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    if (isVisible && !mediaReduced.matches) {
      // 制版态略微提速以强化印刷机运行隐喻
      const speed = props.printing ? 0.35 : 0.14
      rotAngle += dt * speed

      driftX += (targetDriftX - driftX) * 0.08
      driftY += (targetDriftY - driftY) * 0.08
    }

    const currentTilt = AXIAL_TILT + driftY
    const currentAngle = rotAngle + driftX

    // --- Layer 1: 底衬经纬网格与技术刻度圈 ---
    washCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    washCtx.clearRect(0, 0, cachedW, cachedH)

    const cx = globeCenterX
    const cy = globeCenterY
    const r = globeRadius

    // 球体外圈与刻度圆
    washCtx.save()
    washCtx.beginPath()
    washCtx.arc(cx, cy, r, 0, TAU)
    washCtx.strokeStyle = 'rgba(23, 23, 26, 0.12)'
    washCtx.lineWidth = 1.2
    washCtx.stroke()

    // 外围辅助测量环
    washCtx.beginPath()
    washCtx.arc(cx, cy, r + 14, 0, TAU)
    washCtx.setLineDash([2, 6])
    washCtx.strokeStyle = 'rgba(0, 120, 191, 0.18)'
    washCtx.lineWidth = 0.8
    washCtx.stroke()
    washCtx.setLineDash([])

    // 刻度齿牙（每 30° 一大刻度）
    for (let i = 0; i < 24; i++) {
      const a = (i * TAU) / 24
      const x1 = cx + Math.cos(a) * (r + 10)
      const y1 = cy + Math.sin(a) * (r + 10)
      const x2 = cx + Math.cos(a) * (r + (i % 6 === 0 ? 18 : 14))
      const y2 = cy + Math.sin(a) * (r + (i % 6 === 0 ? 18 : 14))
      washCtx.beginPath()
      washCtx.moveTo(x1, y1)
      washCtx.lineTo(x2, y2)
      washCtx.strokeStyle = i % 6 === 0 ? 'rgba(255, 72, 176, 0.45)' : 'rgba(23, 23, 26, 0.15)'
      washCtx.lineWidth = i % 6 === 0 ? 1.2 : 0.6
      washCtx.stroke()
    }

    // 4 个套准十字准星
    const marks: [number, number][] = [
      [cx - r - 28, cy],
      [cx + r + 28, cy],
      [cx, cy - r - 28],
      [cx, cy + r + 28],
    ]
    for (const [mx, my] of marks) {
      washCtx.beginPath()
      washCtx.arc(mx, my, 4, 0, TAU)
      washCtx.strokeStyle = 'rgba(23, 23, 26, 0.22)'
      washCtx.lineWidth = 0.8
      washCtx.stroke()
      washCtx.beginPath()
      washCtx.moveTo(mx - 8, my)
      washCtx.lineTo(mx + 8, my)
      washCtx.moveTo(mx, my - 8)
      washCtx.lineTo(mx, my + 8)
      washCtx.stroke()
    }

    // 经纬线绘制
    washCtx.beginPath()
    washCtx.arc(cx, cy, r - 0.5, 0, TAU)
    washCtx.clip()

    // 纬线圈
    const lats = [-60, -30, 0, 30, 60]
    for (const latDeg of lats) {
      washCtx.beginPath()
      let first = true
      for (let lonDeg = 0; lonDeg <= 360; lonDeg += 6) {
        const vec = latLonToVector(latDeg, lonDeg)
        const [px, py, pz] = project3D(vec, currentAngle, currentTilt)
        if (pz > 0) {
          if (first) {
            washCtx.moveTo(px, py)
            first = false
          } else {
            washCtx.lineTo(px, py)
          }
        } else {
          first = true
        }
      }
      washCtx.strokeStyle =
        latDeg === 0
          ? 'rgba(255, 72, 176, 0.32)' // 赤道：荧光粉专色标记
          : 'rgba(23, 23, 26, 0.08)'
      washCtx.lineWidth = latDeg === 0 ? 1.2 : 0.7
      if (latDeg === 0) washCtx.setLineDash([4, 4])
      washCtx.stroke()
      washCtx.setLineDash([])
    }

    // 经线弧
    for (let lonDeg = 0; lonDeg < 360; lonDeg += 30) {
      washCtx.beginPath()
      let first = true
      for (let latDeg = -90; latDeg <= 90; latDeg += 5) {
        const vec = latLonToVector(latDeg, lonDeg)
        const [px, py, pz] = project3D(vec, currentAngle, currentTilt)
        if (pz > 0) {
          if (first) {
            washCtx.moveTo(px, py)
            first = false
          } else {
            washCtx.lineTo(px, py)
          }
        } else {
          first = true
        }
      }
      washCtx.strokeStyle = 'rgba(0, 120, 191, 0.09)'
      washCtx.lineWidth = 0.7
      washCtx.stroke()
    }

    washCtx.restore()

    // --- Layer 2: 旋转陆地半色调点阵 (WebGL / Fallback) ---
    if (useWebGL && gl && pointProgram) {
      gl.useProgram(pointProgram)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.enable(gl.BLEND)
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

      gl.uniform2f(uSizeLoc, cachedW, cachedH)
      gl.uniform2f(uCenterLoc, globeCenterX, globeCenterY)
      gl.uniform1f(uRadiusLoc, globeRadius)
      gl.uniform1f(uAngleLoc, currentAngle)
      gl.uniform1f(uTiltLoc, currentTilt)
      gl.uniform1f(uDprLoc, dpr)
      gl.uniform1f(uPrintingLoc, props.printing ? 1.0 : 0.0)

      gl.drawArrays(gl.POINTS, 0, totalPoints)
    } else if (pointsFallbackCtx) {
      pointsFallbackCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      pointsFallbackCtx.clearRect(0, 0, cachedW, cachedH)
      pointsFallbackCtx.fillStyle = 'rgba(0, 120, 191, 0.42)'
      for (let i = 0; i < totalPoints; i += 2) {
        const vx = spherePoints[i * 3] ?? 0
        const vy = spherePoints[i * 3 + 1] ?? 0
        const vz = spherePoints[i * 3 + 2] ?? 0
        const v: [number, number, number] = [vx, vy, vz]
        const [px, py, pz] = project3D(v, currentAngle, currentTilt)
        if (pz > 0.05) {
          pointsFallbackCtx.beginPath()
          pointsFallbackCtx.arc(px, py, 1.2 * (0.6 + pz * 0.4), 0, TAU)
          pointsFallbackCtx.fill()
        }
      }
    }

    // --- Layer 3: 动态跨洲航线与活跃枢纽 ---
    arcsCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    arcsCtx.clearRect(0, 0, cachedW, cachedH)

    const nodeVectors = NODES.map((n) => latLonToVector(n.lat, n.lon))
    const projectedNodes = nodeVectors.map((v) => project3D(v, currentAngle, currentTilt))

    // 绘制航线
    for (let k = 0; k < ROUTES.length; k++) {
      const route = ROUTES[k]
      if (!route) continue
      const [fromIdx, toIdx] = route
      const A = nodeVectors[fromIdx]
      const B = nodeVectors[toIdx]
      const pA = projectedNodes[fromIdx]
      const pB = projectedNodes[toIdx]
      if (!A || !B || !pA || !pB) continue

      const cycle = (((time * 0.001 * 0.35 + k * 0.42) % 1) + 1) % 1

      // 仅当端点有一侧在正面时渲染弧线
      if (pA[2] > -0.2 || pB[2] > -0.2) {
        arcsCtx.beginPath()
        let prev: [number, number] | null = null
        let headPos: [number, number] | null = null

        const steps = 40
        for (let s = 0; s <= steps; s++) {
          const t = s / steps
          const baseVec = slerp(A, B, t)
          // 弧线升高抛物线
          const lift = 1.0 + Math.sin(t * Math.PI) * 0.16
          const liftedVec: [number, number, number] = [
            baseVec[0] * lift,
            baseVec[1] * lift,
            baseVec[2] * lift,
          ]
          const [ax, ay, az] = project3D(liftedVec, currentAngle, currentTilt)

          if (az > -0.1) {
            if (!prev) {
              arcsCtx.moveTo(ax, ay)
            } else {
              arcsCtx.lineTo(ax, ay)
            }
            prev = [ax, ay]
          } else {
            prev = null
          }

          if (Math.abs(t - cycle) < 1 / steps) {
            headPos = [ax, ay]
          }
        }

        arcsCtx.strokeStyle = 'rgba(255, 72, 176, 0.28)'
        arcsCtx.lineWidth = 1.0
        arcsCtx.stroke()

        // 飞掠光点
        if (headPos) {
          arcsCtx.beginPath()
          arcsCtx.arc(headPos[0], headPos[1], 2.4, 0, TAU)
          arcsCtx.fillStyle = 'var(--pink)'
          arcsCtx.fill()
        }
      }
    }

    // 绘制城市节点脉冲
    for (let i = 0; i < projectedNodes.length; i++) {
      const node = projectedNodes[i]
      const city = NODES[i]
      if (!node || !city) continue
      const [nx, ny, nz] = node
      if (nz > 0.08) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.003 + i)

        arcsCtx.beginPath()
        arcsCtx.arc(nx, ny, 2.2, 0, TAU)
        arcsCtx.fillStyle = 'var(--ink)'
        arcsCtx.fill()

        arcsCtx.beginPath()
        arcsCtx.arc(nx, ny, 3.5 + pulse * 4.5, 0, TAU)
        arcsCtx.strokeStyle = `rgba(0, 120, 191, ${0.45 - pulse * 0.35})`
        arcsCtx.lineWidth = 0.8
        arcsCtx.stroke()

        // 节点微型文字：仅在桌面端且节点位于正对视角时以渐隐方式呈现，避免遮挡正文
        if (cachedW >= 768 && nz > 0.28) {
          const textAlpha = Math.min(0.55, (nz - 0.28) * 2.2)
          arcsCtx.font = '9px "JetBrains Mono Variable", monospace'
          arcsCtx.fillStyle = `rgba(23, 23, 26, ${textAlpha})`
          arcsCtx.fillText(city.name, nx + 6, ny + 3)
        }
      }
    }

    animId = requestAnimationFrame(render)
  }

  // 视口相交判定：滚出首屏时停用渲染循环节约资源
  const io = new IntersectionObserver((entries) => {
    isVisible = Boolean(entries[0]?.isIntersecting)
  })
  io.observe(container)

  const handleVisibility = () => {
    isVisible = !document.hidden
  }
  document.addEventListener('visibilitychange', handleVisibility)

  animId = requestAnimationFrame(render)

  onUnmounted(() => {
    destroyed = true
    cancelAnimationFrame(animId)
    ro.disconnect()
    io.disconnect()
    window.removeEventListener('pointermove', handlePointer)
    document.removeEventListener('visibilitychange', handleVisibility)
    if (gl && pointProgram) {
      if (posBuffer) gl.deleteBuffer(posBuffer)
      if (detailBuffer) gl.deleteBuffer(detailBuffer)
      gl.deleteProgram(pointProgram)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  })
})
</script>

<template>
  <div
    ref="containerRef"
    class="riso-globe-bed"
    :class="{ 'is-printing': printing }"
    aria-hidden="true"
  >
    <canvas ref="washCanvasRef" class="globe-layer globe-wash"></canvas>
    <canvas ref="pointsCanvasRef" class="globe-layer globe-points"></canvas>
    <canvas ref="arcsCanvasRef" class="globe-layer globe-arcs"></canvas>

    <div class="registration-meta">
      <span class="meta-plate">ZEROSTACK // ORTHO-01</span>
      <span class="meta-tag">RISO 4-DRUM</span>
    </div>
  </div>
</template>

<style scoped>
.riso-globe-bed {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: clip;
  mix-blend-mode: multiply;
  transition: transform 380ms var(--ease-out);
}

.globe-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.globe-wash {
  z-index: 1;
}

.globe-points {
  z-index: 2;
  transition: transform 420ms var(--ease-out);
}

.globe-arcs {
  z-index: 3;
}

/* 制版期间呈现孔版专色鼓套印错位效果 */
.is-printing .globe-points {
  transform: translate(2px, -1.5px);
}

.is-printing .globe-arcs {
  transform: translate(-1.5px, 1px);
}

.registration-meta {
  position: absolute;
  bottom: 24px;
  right: clamp(20px, 4vw, 48px);
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--ink-4);
  user-select: none;
  opacity: 0.72;
}

.meta-plate {
  display: inline-flex;
  align-items: center;
}

.meta-plate::before {
  content: '⌖';
  margin-right: 4px;
  color: var(--blue);
  font-size: 13px;
}

.meta-tag {
  padding: 1px 6px;
  border-radius: var(--pill);
  background: var(--yellow);
  color: var(--ink);
  font-size: 10px;
  font-weight: 600;
}

@media (max-width: 900px) {
  .registration-meta {
    bottom: 12px;
    right: 16px;
    font-size: 10px;
  }
}
</style>
