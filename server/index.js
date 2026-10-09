import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { Pool } from 'pg'

const scrypt = promisify(scryptCallback)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT || 4173)
const SESSION_DAYS = 30
const COOKIE = 'mq_session'
const MAX_BODY_BYTES = 1024 * 1024
const ZONES = [
  { id: 'funchal', name: 'Funchal', lon: -16.9256, lat: 32.6669 },
  { id: 'camara-de-lobos', name: 'Câmara de Lobos', lon: -16.9718, lat: 32.6488 },
  { id: 'ribeira-brava', name: 'Ribeira Brava', lon: -17.0627, lat: 32.6748 },
  { id: 'ponta-do-sol', name: 'Ponta do Sol', lon: -17.1013, lat: 32.6798 },
  { id: 'calheta', name: 'Calheta', lon: -17.1771, lat: 32.7167 },
  { id: 'porto-moniz', name: 'Porto Moniz', lon: -17.1667, lat: 32.8667 },
  { id: 'sao-vicente', name: 'São Vicente', lon: -17.0434, lat: 32.7967 },
  { id: 'santana', name: 'Santana', lon: -16.8809, lat: 32.8031 },
  { id: 'machico', name: 'Machico', lon: -16.7650, lat: 32.7180 },
  { id: 'santa-cruz', name: 'Santa Cruz', lon: -16.7930, lat: 32.6880 },
]
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
}) : null
const rateBuckets = new Map()

function send(res, status, data, extraHeaders = {}) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    ...extraHeaders,
  })
  res.end(body)
}

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map((item) => {
    const index = item.indexOf('=')
    return index < 0 ? ['', ''] : [item.slice(0, index).trim(), decodeURIComponent(item.slice(index + 1).trim())]
  }).filter(([key]) => key))
}

async function readJson(req) {
  const chunks = []
  let length = 0
  for await (const chunk of req) {
    length += chunk.length
    if (length > MAX_BODY_BYTES) throw Object.assign(new Error('Pedido demasiado grande.'), { status: 413 })
    chunks.push(chunk)
  }
  if (!length) return {}
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  catch { throw Object.assign(new Error('JSON inválido.'), { status: 400 }) }
}

function rateLimit(req, res) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString().split(',')[0].trim()
  const now = Date.now()
  const current = rateBuckets.get(ip)
  if (!current || now - current.start > 60_000) rateBuckets.set(ip, { start: now, count: 1 })
  else current.count += 1
  if (rateBuckets.get(ip).count > 120) {
    send(res, 429, { error: 'Demasiados pedidos. Tenta novamente dentro de um minuto.' }, { 'Retry-After': '60' })
    return false
  }
  return true
}

function cookieHeader(token, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derived = await scrypt(password, salt, 64)
  return `scrypt:${salt}:${Buffer.from(derived).toString('hex')}`
}

async function verifyPassword(password, stored) {
  const [scheme, salt, digest] = String(stored).split(':')
  if (scheme !== 'scrypt' || !salt || !digest) return false
  const derived = Buffer.from(await scrypt(password, salt, 64))
  const expected = Buffer.from(digest, 'hex')
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}

function tokenDigest(token) {
  return createHash('sha256').update(token).digest('hex')
}

async function createSession(userId) {
  const token = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000)
  await pool.query('INSERT INTO game_sessions(token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [tokenDigest(token), userId, expires])
  return token
}

async function currentUser(req) {
  const token = cookies(req)[COOKIE]
  if (!token || !pool) return null
  const result = await pool.query(
    'SELECT u.id, u.username FROM game_sessions s JOIN game_users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > NOW()',
    [tokenDigest(token)],
  )
  return result.rows[0] || null
}

function distanceMeters(a, b) {
  const rad = (degrees) => degrees * Math.PI / 180
  const dLat = rad(b[1] - a[1])
  const dLon = rad(b[0] - a[0])
  const lat1 = rad(a[1])
  const lat2 = rad(b[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)))
}

function validateRoute(points, activityType, elapsed) {
  if (!Array.isArray(points) || points.length < 3 || points.length > 20000) {
    throw Object.assign(new Error('São necessários pelo menos 3 pontos GPS para validar a atividade partilhada.'), { status: 422 })
  }
  let distance = 0
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i]
    if (!Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
      throw Object.assign(new Error('O percurso contém coordenadas inválidas.'), { status: 422 })
    }
    const [lon, lat] = point
    // Broad bounding box around Madeira island only; Porto Santo and other regions are excluded.
    if (lon < -17.35 || lon > -16.45 || lat < 32.55 || lat > 33.15) {
      throw Object.assign(new Error('Esta atividade fica fora do território jogável da ilha da Madeira.'), { status: 422 })
    }
    if (i > 0) distance += distanceMeters(points[i - 1], point)
  }
  const maxSpeed = { walking: 5.5, hiking: 5.5, running: 12, cycling: 35 }[activityType]
  if (!maxSpeed || distance < 100 || elapsed < 60 || distance / elapsed > maxSpeed) {
    throw Object.assign(new Error('A atividade não cumpre os limites mínimos de distância, duração ou velocidade.'), { status: 422 })
  }
  return Math.round(distance)
}

function nearestZone(points) {
  const middle = points[Math.floor(points.length / 2)]
  return ZONES.reduce((best, zone) => {
    const distance = distanceMeters(middle, [zone.lon, zone.lat])
    return !best || distance < best.distance ? { id: zone.id, distance } : best
  }, null).id
}

async function gameState(user) {
  const [mine, totals, board, zones] = await Promise.all([
    pool.query('SELECT id, activity_type, zone_id, trail_id, distance_m, duration_s, xp_awarded, created_at FROM game_activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [user.id]),
    pool.query('SELECT COALESCE(SUM(xp_awarded), 0)::int AS xp, COUNT(*)::int AS activities, COALESCE(SUM(distance_m), 0)::int AS distance_m FROM game_activities WHERE user_id = $1', [user.id]),
    pool.query(`SELECT u.username, COALESCE(SUM(a.xp_awarded), 0)::int AS xp, COUNT(a.id)::int AS activities
      FROM game_users u LEFT JOIN game_activities a ON a.user_id = u.id
      GROUP BY u.id, u.username ORDER BY xp DESC, activities DESC, u.username ASC LIMIT 20`),
    pool.query(`SELECT z.id, z.name, COALESCE(SUM(a.xp_awarded), 0)::int AS total_xp,
      COUNT(a.id)::int AS activity_count, (SELECT u.username FROM game_activities a2 JOIN game_users u ON u.id = a2.user_id
      WHERE a2.zone_id = z.id GROUP BY u.id, u.username ORDER BY SUM(a2.xp_awarded) DESC, u.username ASC LIMIT 1) AS leading_player
      FROM game_zones z LEFT JOIN game_activities a ON a.zone_id = z.id GROUP BY z.id, z.name ORDER BY z.name`),
  ])
  const totalXp = totals.rows[0].xp
  return {
    user: { id: user.id, username: user.username },
    stats: { xp: totalXp, level: Math.floor(totalXp / 250) + 1, activities: totals.rows[0].activities, distanceMeters: totals.rows[0].distance_m },
    activities: mine.rows,
    leaderboard: board.rows,
    zones: zones.rows,
    territoryNote: 'O território jogável é exclusivamente a ilha da Madeira. A zona é estimada pelo ponto central da atividade e não constitui uma fronteira cadastral oficial.',
  }
}

async function handleApi(req, res, url) {
  if (!pool) return send(res, 503, { error: 'A API multiplayer ainda não está configurada. É necessária a variável DATABASE_URL no serviço web.' })
  if (!rateLimit(req, res)) return
  if (req.method === 'GET' && url.pathname === '/api/health') {
    try { await pool.query('SELECT 1'); return send(res, 200, { ok: true, database: 'connected', territory: 'madeira-island-only' }) }
    catch { return send(res, 503, { ok: false, database: 'unavailable' }) }
  }
  if (req.method === 'POST' && ['/api/auth/register', '/api/auth/login'].includes(url.pathname)) {
    const body = await readJson(req)
    const username = String(body.username || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return send(res, 400, { error: 'O nome de jogador deve ter 3–20 caracteres: letras, números ou _.' })
    if (password.length < 12 || password.length > 128) return send(res, 400, { error: 'A palavra-passe deve ter entre 12 e 128 caracteres.' })
    let user
    if (url.pathname.endsWith('/register')) {
      try {
        const result = await pool.query('INSERT INTO game_users(id, username, password_hash) VALUES ($1, $2, $3) RETURNING id, username', [randomUUID(), username, await hashPassword(password)])
        user = result.rows[0]
      } catch (error) {
        if (error.code === '23505') return send(res, 409, { error: 'Este nome de jogador já está ocupado.' })
        throw error
      }
    } else {
      const result = await pool.query('SELECT id, username, password_hash FROM game_users WHERE lower(username) = lower($1)', [username])
      if (!result.rows[0] || !(await verifyPassword(password, result.rows[0].password_hash))) return send(res, 401, { error: 'Nome de jogador ou palavra-passe incorretos.' })
      user = { id: result.rows[0].id, username: result.rows[0].username }
    }
    const token = await createSession(user.id)
    return send(res, 200, { user }, { 'Set-Cookie': cookieHeader(token, SESSION_DAYS * 86400) })
  }
  if (req.method === 'GET' && url.pathname === '/api/auth/me') {
    const user = await currentUser(req)
    return user ? send(res, 200, { user }) : send(res, 401, { error: 'Sessão não iniciada.' })
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    const token = cookies(req)[COOKIE]
    if (token) await pool.query('DELETE FROM game_sessions WHERE token_hash = $1', [tokenDigest(token)])
    return send(res, 200, { ok: true }, { 'Set-Cookie': cookieHeader('', 0) })
  }
  const user = await currentUser(req)
  if (!user) return send(res, 401, { error: 'Inicia sessão para aceder ao modo global.' })
  if (req.method === 'GET' && url.pathname === '/api/game/state') return send(res, 200, await gameState(user))
  if (req.method === 'POST' && url.pathname === '/api/activities') {
    const body = await readJson(req)
    const activityType = String(body.activityType || '')
    if (!['walking', 'running', 'cycling', 'hiking'].includes(activityType)) return send(res, 400, { error: 'Modalidade inválida.' })
    const elapsed = Math.floor(Number(body.elapsed))
    if (!Number.isFinite(elapsed) || elapsed <= 0 || elapsed > 86400) return send(res, 422, { error: 'Duração inválida.' })
    const distance = validateRoute(body.points, activityType, elapsed)
    const zoneId = nearestZone(body.points)
    const xp = Math.floor(distance / 100) + 25
    const id = randomUUID()
    const clientActivityId = String(body.clientActivityId || '')
    if (!/^[a-zA-Z0-9_-]{8,80}$/.test(clientActivityId)) return send(res, 400, { error: 'Identificador de atividade inválido.' })
    try {
      const result = await pool.query(`INSERT INTO game_activities(id, client_activity_id, user_id, activity_type, zone_id, trail_id, distance_m, duration_s, xp_awarded, route_sample_count, started_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (user_id, client_activity_id) DO NOTHING RETURNING id, xp_awarded, zone_id`,
      [id, clientActivityId, user.id, activityType, zoneId, typeof body.trailId === 'string' ? body.trailId.slice(0, 40) : null, distance, elapsed, xp, body.points.length, body.startedAt ? new Date(body.startedAt) : null])
      if (!result.rows[0]) return send(res, 200, { ok: true, duplicate: true, message: 'Esta atividade já tinha sido sincronizada.' })
      return send(res, 201, { ok: true, activity: result.rows[0], message: 'Atividade validada e sincronizada.' })
    } catch (error) {
      if (error.code === '22007' || error.code === '22008') return send(res, 422, { error: 'Data de atividade inválida.' })
      throw error
    }
  }
  return send(res, 404, { error: 'Endpoint não encontrado.' })
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url)
    if (!['GET', 'HEAD'].includes(req.method || 'GET')) return send(res, 405, { error: 'Método não permitido.' })
    let requested = decodeURIComponent(url.pathname)
    if (requested === '/') requested = '/index.html'
    const resolved = path.resolve(DIST, `.${requested}`)
    if (!resolved.startsWith(DIST + path.sep)) return send(res, 403, { error: 'Acesso negado.' })
    let file = resolved
    try { if (!(await stat(file)).isFile()) throw new Error('not a file') }
    catch { file = path.join(DIST, 'index.html') }
    const content = await readFile(file)
    const extension = path.extname(file)
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json' }
    res.writeHead(200, { 'Content-Type': types[extension] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' })
    res.end(req.method === 'HEAD' ? undefined : content)
  } catch (error) {
    if (!res.headersSent) send(res, error.status || 500, { error: error.status ? error.message : 'Erro interno do servidor.' })
    else res.destroy()
    if (!error.status) console.error('Request failed:', error.message)
  }
})

async function start() {
  if (pool) {
    const schema = await readFile(path.join(ROOT, 'server/schema.sql'), 'utf8')
    await pool.query(schema)
    await pool.query('DELETE FROM game_sessions WHERE expires_at < NOW()')
    console.log('Madeira Quest multiplayer database ready')
  } else {
    console.warn('DATABASE_URL not set: static site mode only; multiplayer API disabled')
  }
  server.listen(PORT, '0.0.0.0', () => console.log(`Madeira Quest server listening on ${PORT}`))
}

start().catch((error) => {
  console.error('Startup failed:', error.message)
  process.exitCode = 1
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    server.close()
    if (pool) await pool.end()
    process.exit(0)
  })
}
