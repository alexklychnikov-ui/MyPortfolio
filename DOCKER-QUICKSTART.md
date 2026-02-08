# Docker Quick Start (Краткое руководство)

## 🚀 Локальный запуск

```bash
# 1. Настроить окружение
cp .env.example .env

# 2. Запустить контейнеры
docker compose up

# 3. Открыть http://localhost
```

### Полезные команды

```bash
# Фоновый запуск
docker compose up -d

# Просмотр логов
docker compose logs -f

# Остановка
docker compose down

# Пересборка
docker compose up -d --build
```

---

## 🌐 Production (Ubuntu VPS)

### Первичная настройка (один раз)

```bash
# 1. Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y

# 2. Настроить firewall
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable

# 3. Создать директорию проекта
sudo mkdir -p /opt/portfolio
sudo chown $USER:$USER /opt/portfolio
cd /opt/portfolio

# 4. Клонировать репозиторий
git clone <repo-url> .

# 5. Настроить .env
cp .env.example .env
nano .env
# Установить: DOMAIN, LETSENCRYPT_EMAIL

# 6. Получить SSL сертификат
chmod +x setup-ssl.sh
./setup-ssl.sh

# 7. Запустить
docker compose up -d
```

### Обновление проекта

```bash
# Через GitHub Actions (автоматически)
git push origin main

# Вручную
chmod +x deploy.sh
./deploy.sh
```

---

## 🔧 Мониторинг

```bash
# Статус контейнеров
docker compose ps

# Логи
docker compose logs -f

# Ресурсы
docker stats

# Здоровье
curl http://localhost:3000/api/health
```

---

## 🔙 Откат

```bash
# 1. Посмотреть коммиты
git log --oneline

# 2. Откатиться
git checkout <hash>

# 3. Пересобрать
./deploy.sh
```

---

## 📚 Полная документация

- `README-DOCKER.md` — полное руководство
- `DOCKER-CHECKLIST.md` — чек-лист
- `NEXTJS-DOCKER-TROUBLESHOOTING.md` — решение проблем
