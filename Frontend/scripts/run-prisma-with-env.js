/**
 * Копирует DATABASE_URL из корневого .env (папка Portfolio) в Frontend/.env и запускает prisma.
 */
const path = require('path')
const fs = require('fs')
const { spawnSync } = require('child_process')

const frontendDir = path.resolve(__dirname, '..')
const projectRoot = path.resolve(frontendDir, '..')
const rootEnv = path.join(projectRoot, '.env')
if (!fs.existsSync(rootEnv)) {
  console.error('Не найден .env в корне проекта:', rootEnv)
  process.exit(1)
}

let content = fs.readFileSync(rootEnv, 'utf8')
if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)
let databaseUrl = null
const lines = content.split(/\r?\n/)
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim()
  if (trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq <= 0) continue
  let key = trimmed.slice(0, eq).trim().replace(/\s/g, '')
  if (key.charCodeAt(0) === 0xFEFF) key = key.slice(1)
  const keyNorm = key.toUpperCase().replace(/\s/g, '')
  if (keyNorm !== 'DATABASE_URL' && keyNorm !== 'POSTGRES_URL' && keyNorm !== 'DB_URL' && !keyNorm.endsWith('DATABASE_URL')) continue
  let val = trimmed.slice(eq + 1).trim().replace(/\r/g, '')
  if (!val && i + 1 < lines.length && lines[i + 1] && !lines[i + 1].trim().startsWith('#')) val = lines[i + 1].trim()
  const hashIdx = val.indexOf('#')
  if (hashIdx !== -1 && !val.slice(0, hashIdx).includes('%23'))
    val = val.slice(0, hashIdx).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
    val = val.slice(1, -1)
  val = val.trim().replace(/[\u200B-\u200D\uFEFF]/g, '')
  if (val.startsWith('postgres://')) val = 'postgresql://' + val.slice(11)
  if (/^[a-zA-Z0-9]+:\/\//.test(val) && !val.startsWith('postgresql://') && !val.startsWith('postgres://'))
    val = 'postgresql://' + val.replace(/^[a-zA-Z0-9]+:\/\//, '')
  if (val.startsWith('postgresql://')) {
    databaseUrl = val
  } else if (val && (val.includes('postgresql://') || val.includes('postgres://'))) {
    const match = val.match(/(postgres(?:ql)?:\/\/[^\s'"]+)/)
    if (match) databaseUrl = match[1].startsWith('postgres://') ? 'postgresql://' + match[1].slice(11) : match[1]
  }
  if (!databaseUrl && keyNorm === 'DATABASE_URL' && val.length > 0) {
    console.error('DATABASE_URL найден, но значение не похоже на URL. Начало значения:', JSON.stringify(val.slice(0, 50)))
  }
  if (databaseUrl) break
}

if (!databaseUrl) {
  const keys = []
  for (const line of lines) {
    const t = line.trim()
    if (t.startsWith('#') || !t.includes('=')) continue
    const eq = t.indexOf('=')
    keys.push(t.slice(0, eq).trim())
  }
  console.error('В корневом .env не найден корректный DATABASE_URL.')
  console.error('Файл:', rootEnv)
  console.error('Переменные в файле:', keys.join(', ') || '(нет строк с =)')
  console.error('Добавь строку: DATABASE_URL=postgresql://user:password@host:5432/portfolio')
  process.exit(1)
}

const frontendEnv = path.join(frontendDir, '.env')
const line = 'DATABASE_URL=' + databaseUrl + '\n'
fs.writeFileSync(frontendEnv, line, 'utf8')

const masked = databaseUrl.replace(/:([^:@]+)@/, ':****@')
if (process.env.DEBUG_DB_URL) console.log('DEBUG DATABASE_URL:', masked)

const env = { ...process.env, DATABASE_URL: databaseUrl }
const prismaCli = path.join(frontendDir, 'node_modules', 'prisma', 'build', 'index.js')
const result = spawnSync(process.execPath, [prismaCli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: frontendDir,
  env,
  windowsHide: true,
})
process.exit(result.status ?? 1)
