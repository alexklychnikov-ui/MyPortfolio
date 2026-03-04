/**
 * Проверка: загружается ли DATABASE_URL из ../.env
 * Запуск из Frontend: node scripts/check-db-url.js
 * Или: dotenv -e ../.env -- node scripts/check-db-url.js
 */
const path = require('path')
const fs = require('fs')

const envPath = path.join(__dirname, '..', '..', '.env')
if (!fs.existsSync(envPath)) {
  console.error('Файл не найден:', envPath)
  process.exit(1)
}

const content = fs.readFileSync(envPath, 'utf8')
const match = content.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m)
if (!match) {
  console.error('В .env не найдена строка DATABASE_URL=...')
  process.exit(1)
}

const url = match[1].trim().replace(/^["']|["']$/g, '')
if (!url.startsWith('postgresql://')) {
  console.error('DATABASE_URL должен начинаться с postgresql://')
  process.exit(1)
}

const userMatch = url.match(/postgresql:\/\/([^:]+):/)
const hostMatch = url.match(/@([^:/]+)/)
const dbMatch = url.match(/\/([^/?]+)(\?|$)/)
console.log('DATABASE_URL найден в корневом .env')
console.log('  Пользователь:', userMatch ? userMatch[1] : '?')
console.log('  Хост:', hostMatch ? hostMatch[1] : '?')
console.log('  БД:', dbMatch ? dbMatch[1] : '?')
console.log('Если здесь всё верно — проверь пароль (спецсимволы в пароле кодируй: @ → %40, # → %23)')
