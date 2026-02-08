# Next.js + Docker: Частые проблемы и решения

## 1. Проблемы сборки

### Проблема: "Module not found: Can't resolve 'fs'"

**Причина:** Использование модулей только для Node.js в клиентском коде

**Решение:**
```typescript
// ❌ Неправильно
import fs from 'fs'

// ✅ Правильно - используйте API routes
// app/api/something/route.ts
import fs from 'fs'
```

### Проблема: "EMFILE: too many open files"

**Причина:** Слишком много file watchers в разработке

**Решение:**
```bash
# В .env
CHOKIDAR_USEPOLLING=true
```

### Проблема: Сборка не удается с ошибкой "Out of memory"

**Причина:** Недостаточно памяти Docker

**Решение:**
- Увеличьте лимит памяти в настройках Docker Desktop
- Добавьте в `docker-compose.yml`:
```yaml
services:
  app:
    mem_limit: 2g
    memswap_limit: 2g
```

## 2. Проблемы выполнения

### Проблема: "Could not find a valid build in the '.next' directory"

**Причина:** Артефакты сборки скопированы неправильно

**Решение:**
```dockerfile
# Убедитесь, что эти строки есть в Dockerfile
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
```

### Проблема: Статические ресурсы возвращают 404

**Причина:** Папка public не скопирована

**Решение:**
```dockerfile
COPY --from=builder /app/public ./public
```

### Проблема: Изображения не загружаются

**Причина:** Next.js Image Optimization требует внешних сервисов

**Решение:**
```javascript
// next.config.mjs
images: {
  unoptimized: true, // Для статического экспорта или простой Docker-настройки
}
```

## 3. Проблемы сети

### Проблема: "localhost" не работает из контейнеров

**Причина:** Контейнеры используют Docker-сеть, не localhost

**Решение:**
```yaml
# Используйте имя сервиса вместо localhost
services:
  app:
    environment:
      - API_URL=http://api:8000  # Не localhost:8000
```

### Проблема: Nginx 502 Bad Gateway

**Причина:** Nginx не может достучаться до контейнера Next.js

**Решение:**
```bash
# Проверьте, запущен ли контейнер app
docker compose ps

# Проверьте логи app
docker compose logs app

# Проверьте upstream в nginx.conf
upstream nextjs_upstream {
    server app:3000;  # Должно совпадать с именем сервиса
}
```

## 4. Переменные окружения

### Проблема: `process.env` undefined в браузере

**Причина:** Server-side env vars недоступны в браузере

**Решение:**
```bash
# ❌ Неправильно - только для сервера
API_URL=...

# ✅ Правильно - доступно в браузере
NEXT_PUBLIC_API_URL=...
```

### Проблема: Env vars не загружаются в Docker

**Причина:** Файл `.env` не смонтирован правильно

**Решение:**
```yaml
# docker-compose.yml
services:
  app:
    env_file:
      - .env
```

## 5. Проблемы Hot Reload

### Проблема: Изменения не отображаются в браузере

**Причина:** Volume mounts не работают правильно

**Решение:**
```yaml
# docker-compose.override.yml
services:
  app:
    volumes:
      - ./Frontend/app:/app/app
      - /app/node_modules  # Предотвратить перезапись
      - /app/.next         # Предотвратить перезапись
```

### Проблема: "Error: watch ENOSPC"

**Причина:** Слишком много file watchers

**Решение:**
```bash
# На хост-машине
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6. Проблемы SSL/TLS

### Проблема: "Certificate not yet valid"

**Причина:** Неверное системное время

**Решение:**
```bash
# Синхронизировать время
sudo ntpdate pool.ntp.org
```

### Проблема: Лимит запросов Let's Encrypt

**Причина:** Слишком много запросов сертификатов

**Решение:**
```bash
# Используйте staging environment для тестирования
docker compose run --rm certbot certonly --staging ...
```

### Проблема: Обновление сертификата не удается

**Причина:** Certbot не может получить доступ к файлам challenge

**Решение:**
```bash
# Проверьте путь webroot
docker compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot

# Проверьте, что nginx config разрешает .well-known
location /.well-known/acme-challenge/ {
    root /var/www/certbot;
}
```

## 7. Проблемы производительности

### Проблема: Медленная начальная загрузка страницы

**Причина:** Большой размер бандла

**Решение:**
```javascript
// next.config.mjs
const nextConfig = {
  compress: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
}
```

### Проблема: Высокое использование памяти

**Причина:** Утечки памяти или недостаточные лимиты

**Решение:**
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## 8. Проблемы развертывания

### Проблема: GitHub Actions SSH не работает

**Причина:** Неверный формат SSH ключа или права доступа

**Решение:**
```bash
# Сгенерируйте правильный формат SSH ключа
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions

# Добавьте приватный ключ в GitHub secrets (включая строки BEGIN/END)
# Добавьте публичный ключ в VPS ~/.ssh/authorized_keys
```

### Проблема: Контейнер завершается немедленно

**Причина:** Процесс завершается или команда не выполняется

**Решение:**
```bash
# Проверьте код выхода
docker compose ps

# Просмотрите логи
docker compose logs app

# Проверьте, не failing ли healthcheck
docker compose exec app wget -O- http://localhost:3000
```

## 9. Проблемы статического экспорта

### Проблема: "Error: Image Optimization using the default loader is not compatible with output: export"

**Причина:** Использование Next.js Image компонента со статическим экспортом

**Решение:**
```javascript
// next.config.mjs
images: {
  unoptimized: true,
}
```

### Проблема: API routes не работают в статическом экспорте

**Причина:** API routes требуют server runtime

**Решение:**
```javascript
// next.config.mjs
output: 'export', // ❌ Без API routes
output: 'standalone', // ✅ API routes работают
```

## 10. Проблемы кэша

### Проблема: Старый код все еще работает после пересборки

**Причина:** Кэш Docker не очищен

**Решение:**
```bash
# Очистить кэш сборки
docker builder prune -af

# Принудительная пересборка
docker compose build --no-cache

# Удалить volumes
docker compose down -v
```

### Проблема: Браузер отдает кэшированный контент

**Причина:** Агрессивные caching headers

**Решение:**
```nginx
# nginx.conf
location / {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

## Команды отладки

```bash
# Статус контейнеров
docker compose ps

# Логи в реальном времени
docker compose logs -f

# Выполнить команду в контейнере
docker compose exec app sh

# Инспектировать контейнер
docker inspect nextjs-app

# Проверить сеть
docker network inspect <project>_app-network

# Использование ресурсов
docker stats

# Использование диска
docker system df

# Полная очистка
docker system prune -af --volumes
```

## Советы по предотвращению

1. **Всегда тестируйте локально сначала** перед развертыванием
2. **Используйте .dockerignore** для исключения ненужных файлов
3. **Фиксируйте версии** в Dockerfile (node:22-alpine, а не node:alpine)
4. **Мониторьте логи** регулярно на наличие ошибок
5. **Держите образы маленькими** с помощью multi-stage builds
6. **Используйте healthchecks** для автоматического восстановления
7. **Делайте резервные копии сертификатов** перед обновлением
8. **Документируйте вашу настройку** для будущего использования
9. **Протестируйте процедуру отката** до того, как она понадобится
10. **Обновляйте зависимости** регулярно

## Получение помощи

1. Проверьте логи: `docker compose logs -f`
2. Просмотрите этот документ
3. Проверьте [документацию Next.js](https://nextjs.org/docs)
4. Проверьте [документацию Docker](https://docs.docker.com/)
5. Поищите в GitHub Issues похожие проблемы