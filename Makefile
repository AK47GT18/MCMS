.PHONY: dev prod logs shell restart clean build up down ps help

# Colors for output
YELLOW := \033[0;33m
GREEN := \033[0;32m
BLUE := \033[0;34m
NC := \033[0m # No Color

help:
	@echo "$(BLUE)Mkaka Construction Management System - Docker Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make dev        - Start development environment"
	@echo "  make build      - Build Docker images"
	@echo "  make up         - Start containers"
	@echo "  make down       - Stop containers"
	@echo "  make ps         - Show container status"
	@echo ""
	@echo "$(YELLOW)Management:$(NC)"
	@echo "  make logs       - View container logs (all services)"
	@echo "  make shell      - Enter PHP container shell"
	@echo "  make restart    - Restart all containers"
	@echo "  make clean      - Remove containers and volumes (WARNING: data loss)"
	@echo ""
	@echo "$(YELLOW)Production:$(NC)"
	@echo "  make prod       - Start production environment"
	@echo ""

dev:
	@echo "$(GREEN)🚀 Starting development environment...$(NC)"
	docker-compose up -d
	@echo ""
	@echo "$(GREEN)✅ Development environment started$(NC)"
	@echo ""
	@echo "$(YELLOW)Access points:$(NC)"
	@echo "  🌐 Application:  $(BLUE)http://localhost$(NC)"
	@echo "  📊 phpMyAdmin:   $(BLUE)http://localhost:8081$(NC)"
	@echo "  📝 OnlyOffice:   $(BLUE)http://localhost:8080$(NC)"
	@echo "  📧 MailHog:      $(BLUE)http://localhost:8025$(NC)"
	@echo ""
	@echo "$(YELLOW)Database:$(NC)"
	@echo "  Host: localhost:3306"
	@echo "  User: mkaka_user"
	@echo "  Pass: mkaka_secure_pass_2026"
	@echo ""

prod:
	@echo "$(GREEN)🚀 Starting production environment...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✅ Production environment started$(NC)"

build:
	@echo "$(GREEN)🔨 Building Docker images...$(NC)"
	docker-compose build --no-cache
	@echo "$(GREEN)✅ Build complete$(NC)"

up:
	@echo "$(GREEN)⬆️  Starting containers...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Containers started$(NC)"
	@make ps

down:
	@echo "$(YELLOW)⬇️  Stopping containers...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Containers stopped$(NC)"

ps:
	@echo "$(BLUE)Container Status:$(NC)"
	docker-compose ps

logs:
	@echo "$(BLUE)📋 Viewing logs (Ctrl+C to exit)...$(NC)"
	docker-compose logs -f

shell:
	@echo "$(BLUE)🐚 Entering PHP container...$(NC)"
	docker-compose exec php sh

restart:
	@echo "$(YELLOW)🔄 Restarting containers...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✅ Containers restarted$(NC)"
	@make ps

clean:
	@echo "$(YELLOW)⚠️  WARNING: This will remove containers and volumes!$(NC)"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "$(GREEN)✅ All data removed!$(NC)"; \
	else \
		echo "$(BLUE)Cancelled.$(NC)"; \
	fi

# Convenience targets
start: up
stop: down
status: ps
view-logs: logs
php-shell: shell
