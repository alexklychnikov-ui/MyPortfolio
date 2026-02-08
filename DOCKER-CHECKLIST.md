# Чек-лист Docker-развертывания

## Предварительный чек-лист

- [ ] Docker установлен локально
- [ ] Docker Compose доступен
- [ ] Файл `.env` настроен с правильными значениями
- [ ] `DOMAIN` установлен в `.env`
- [ ] `LETSENCRYPT_EMAIL` установлен в `.env`
- [ ] DNS A запись указывает на IP VPS
- [ ] GitHub secrets настроены (SSH_HOST, SSH_USER, SSH_PRIVATE_KEY)

## Локальная разработка

- [ ] Запустите `docker compose up` для запуска среды разработки
- [ ] Откройте http://localhost и убедитесь, что сайт загружается
- [ ] Протестируйте hot-reload, изменив файл
- [ ] Проверьте `docker compose logs` на наличие ошибок

## Развертывание в Production

### Первичная настройка

- [ ] Подключитесь к VPS по SSH
- [ ] Обновите систему: `sudo apt update && sudo apt upgrade -y`
- [ ] Установите Docker: `curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh`
- [ ] Установите Docker Compose: `sudo apt install docker-compose-plugin -y`
- [ ] Добавьте пользователя в группу docker: `sudo usermod -aG docker $USER`
- [ ] Настройте firewall: `sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable`
- [ ] Создайте директорию проекта: `sudo mkdir -p /opt/portfolio && sudo chown $USER:$USER /opt/portfolio`
- [ ] Клонируйте репозиторий: `git clone <repo-url> .`
- [ ] Настройте файл `.env`
- [ ] Запустите настройку SSL: `chmod +x setup-ssl.sh && ./setup-ssl.sh`
- [ ] Запустите контейнеры: `docker compose up -d`

### Проверка

- [ ] Проверьте статус контейнеров: `docker compose ps`
- [ ] Убедитесь, что все контейнеры запущены
- [ ] Проверьте логи: `docker compose logs -f`
- [ ] Откройте https://yourdomain.com
- [ ] Убедитесь, что SSL-сертификат действителен
- [ ] Протестируйте редирект HTTP → HTTPS
- [ ] Протестируйте весь функционал сайта

### Настройка CI/CD

- [ ] Добавьте SSH ключ в secrets репозитория GitHub
- [ ] Настройте secret `SSH_HOST`
- [ ] Настройте secret `SSH_USER`
- [ ] Настройте secret `SSH_PORT` (если нестандартный)
- [ ] Сделайте push в ветку `main`
- [ ] Убедитесь, что workflow GitHub Actions запускается
- [ ] Убедитесь, что развертывание прошло успешно
- [ ] Проверьте VPS на наличие обновленных контейнеров

## Частые проблемы и решения

### Порт уже занят

```bash
# Проверить что использует порт 80/443
sudo lsof -i :80
sudo lsof -i :443

# Остановить конфликтующий сервис (например, системный nginx)
sudo systemctl stop nginx
```

### Проблемы с SSL-сертификатом

```bash
# Ручное обновление сертификатов
docker compose run --rm certbot renew

# Проверка статуса сертификата
docker compose run --rm certbot certificates

# Принудительное обновление
docker compose run --rm certbot renew --force-renewal
```

### Контейнер не запускается

```bash
# Проверить логи
docker compose logs app
docker compose logs nginx

# Перезапустить конкретный сервис
docker compose restart app

# Пересобрать с нуля
docker compose up -d --build --force-recreate
```

### Ошибки сборки

```bash
# Очистить кэш Docker
docker builder prune -af

# Удалить все контейнеры и volumes
docker compose down -v

# Пересобрать
docker compose build --no-cache
```

### Проблемы с памятью

```bash
# Проверить использование ресурсов Docker
docker stats

# Увеличить лимит памяти в настройках Docker Desktop
```

## Процедура отката

```bash
# 1. Проверить предыдущие коммиты
git log --oneline

# 2. Переключиться на предыдущую версию
git checkout <commit-hash>

# 3. Повторно развернуть
./deploy.sh

# 4. Проверить
docker compose ps
docker compose logs -f
```

## Регулярное обслуживание

### Еженедельно

- [ ] Проверить здоровье контейнеров: `docker compose ps`
- [ ] Просмотреть логи: `docker compose logs --tail=100`
- [ ] Проверить использование диска: `docker system df`

### Ежемесячно

- [ ] Обновить базовые образы: `docker compose pull`
- [ ] Очистить старые образы: `docker image prune -af --filter "until=30d"`
- [ ] Сделать резервную копию SSL-сертификатов: `tar -czf certs-backup.tar.gz certs/`
- [ ] Проверить обновления Docker: Проверить наличие новых версий

### Ежеквартально

- [ ] Просмотреть и обновить Docker-образы до последних версий
- [ ] Проверить security headers в конфигурации nginx
- [ ] Обновить конфигурацию SSL/TLS при необходимости
- [ ] Проверить workflow GitHub Actions

## Вопросы масштабирования

### Когда нужно масштабировать

- [ ] Использование CPU постоянно > 70%
- [ ] Использование памяти постоянно > 80%
- [ ] Время отклика > 2 секунды
- [ ] Увеличивается количество ошибок

### Варианты масштабирования

1. **Добавить больше реплик приложения**
   ```yaml
   services:
     app:
       deploy:
         replicas: 3
   ```

2. **Увеличить ресурсы**
   - Обновить тариф VPS
   - Добавить больше RAM/CPU

3. **Добавить CDN**
   - Cloudflare для статических ресурсов
   - Снизить нагрузку на исходный сервер

4. **Разделить concerns**
   - Отдельный сервер базы данных
   - Отдельный сервер кэша (Redis)

## Чек-лист безопасности

- [ ] Только аутентификация по SSH ключу
- [ ] Firewall настроен правильно
- [ ] Регулярные обновления безопасности
- [ ] SSL/TLS сертификаты актуальны
- [ ] Security headers настроены в nginx
- [ ] Rate limiting включен
- [ ] Нет чувствительных данных в логах
- [ ] Регулярное резервное копирование SSL-сертификатов
- [ ] GitHub secrets настроены правильно
- [ ] Контейнер запущен от non-root пользователя

## Рекомендации по мониторингу

### Базовый мониторинг

```bash
# Здоровье контейнеров
docker compose ps

# Использование ресурсов
docker stats

# Логи
docker compose logs -f
```

### Продвинутый мониторинг

Рассмотрите настройку:
- [ ] Prometheus + Grafana
- [ ] Мониторинг доступности (UptimeRobot, Pingdom)
- [ ] Отслеживание ошибок (Sentry)
- [ ] Агрегация логов (ELK stack, Loki)

## Контакты и поддержка

При возникновении проблем:
1. Проверьте логи: `docker compose logs -f`
2. Просмотрите этот чек-лист
3. Проверьте документацию Docker
4. Проверьте руководство по Docker-развертыванию Next.js