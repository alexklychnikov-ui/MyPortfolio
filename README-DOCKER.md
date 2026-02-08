# Руководство по Docker-развертыванию

## Локальная разработка

### Предварительные требования
- Установлен Docker Desktop
- Git

### Быстрый старт

1. **Клонирование репозитория**
   ```bash
   git clone <repo-url>
   cd <project-dir>
   ```

2. **Настройка окружения**
   ```bash
   cp .env.example .env
   # Отредактируйте .env при необходимости (для локальной разработки настройки по умолчанию подходят)
   ```

3. **Запуск контейнеров**
   ```bash
   docker compose up
   ```

4. **Доступ к сайту**
   - Откройте http://localhost
   - Hot-reload включен для Next.js

### Полезные команды

```bash
# Запуск в фоне
docker compose up -d

# Просмотр логов
docker compose logs -f

# Остановка контейнеров
docker compose down

# Пересборка контейнеров
docker compose up -d --build

# Выполнение команды в контейнере app
docker compose exec app sh
```

### Разработка с Hot-Reload

С помощью `docker-compose.override.yml` вы получаете:
- Автоматическую перезагрузку при изменении файлов
- Прямой доступ к dev-серверу Next.js на порту 3000
- Nginx proxy на порту 80

## Развертывание в Production (Ubuntu VPS)

### 1. Первичная настройка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo apt install docker-compose-plugin -y

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Включение Docker
sudo systemctl enable docker

# Настройка firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Настройка проекта

```bash
# Создание директории проекта
sudo mkdir -p /opt/portfolio
sudo chown $USER:$USER /opt/portfolio
cd /opt/portfolio

# Клонирование репозитория
git clone <repo-url> .

# Настройка окружения
cp .env.example .env
nano .env
# Установите DOMAIN, LETSENCRYPT_EMAIL и т.д.
```

### 3. Настройка SSL-сертификата

```bash
# Сделать скрипт исполняемым
chmod +x setup-ssl.sh

# Запустить настройку SSL
./setup-ssl.sh
```

### 4. Запуск в Production

```bash
# Запуск контейнеров
docker compose up -d

# Проверка статуса
docker compose ps

# Просмотр логов
docker compose logs -f
```

## GitHub Actions CI/CD

### Необходимые Secrets

Добавьте эти в настройки репозитория GitHub:

| Secret | Описание |
|--------|----------|
| `SSH_HOST` | IP-адрес VPS |
| `SSH_USER` | Имя пользователя SSH (например, `root` или deploy-пользователь) |
| `SSH_PRIVATE_KEY` | Приватный SSH ключ |
| `SSH_PORT` | Порт SSH (по умолчанию `22`) |

### Процесс развертывания

1. Push в ветку `main`
2. GitHub Actions собирает Docker-образ
3. Подключается к VPS через SSH
4. Получает последние изменения
5. Пересобирает контейнеры
6. Zero-downtime развертывание

## Обслуживание

### Просмотр логов

```bash
# Все сервисы
docker compose logs -f

# Конкретный сервис
docker compose logs -f app
docker compose logs -f nginx
```

### Обновление проекта

```bash
# Ручное развертывание
chmod +x deploy.sh
./deploy.sh
```

### Очистка

```bash
# Удаление старых образов
docker image prune -af

# Удаление неиспользуемых volumes
docker volume prune -f

# Полная очистка
docker system prune -af
```

### Резервное копирование SSL-сертификатов

```bash
# Резервное копирование директории certs
tar -czf certs-backup-$(date +%Y%m%d).tar.gz certs/
```

## Решение проблем

### Контейнер не запускается

```bash
# Проверить логи
docker compose logs app

# Перезапустить конкретный сервис
docker compose restart app
```

### Проблемы с SSL-сертификатом

```bash
# Ручное обновление
docker compose run --rm certbot renew

# Проверка статуса сертификата
docker compose run --rm certbot certificates
```

### Порт уже занят

```bash
# Проверить что использует порт 80
sudo lsof -i :80

# Остановить конфликтующий сервис
sudo systemctl stop nginx  # если запущен системный nginx
```

### Ошибки сборки

```bash
# Очистить кэш Docker
docker builder prune -af

# Пересобрать с нуля
docker compose build --no-cache
```

## Откат

```bash
# Просмотр предыдущих коммитов
git log --oneline

# Переключение на предыдущую версию
git checkout <previous-commit-hash>

# Повторное развертывание
./deploy.sh
```

## Масштабирование

### Добавление экземпляров приложения

```yaml
# В docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
```

### Добавление балансировщика нагрузки

Рассмотрите добавление HAProxy или Traefik для нескольких экземпляров.

## Мониторинг

### Здоровье контейнеров

```bash
docker compose ps
```

### Использование ресурсов

```bash
docker stats
```

### Использование диска

```bash
docker system df
```
