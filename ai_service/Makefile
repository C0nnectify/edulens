.PHONY: help build up down logs restart clean dev-up prod-up test

help:
	@echo "EduLen AI Service - Docker Commands"
	@echo "===================================="
	@echo "make build       - Build Docker images"
	@echo "make up          - Start all services"
	@echo "make down        - Stop all services"
	@echo "make logs        - View logs"
	@echo "make restart     - Restart all services"
	@echo "make clean       - Clean up containers and volumes"
	@echo "make dev-up      - Start in development mode"
	@echo "make prod-up     - Start in production mode"
	@echo "make test        - Run tests"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

clean:
	docker-compose down -v
	rm -rf chroma_db/* logs/*

dev-up:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

prod-up:
	docker-compose up -d

test:
	docker-compose exec api pytest

shell-api:
	docker-compose exec api /bin/bash

shell-worker:
	docker-compose exec celery_worker /bin/bash

ps:
	docker-compose ps

install:
	pip install -r requirements.txt

run-local:
	uvicorn main:app --reload

celery-worker-local:
	celery -A app.core.celery_app:celery_app worker --loglevel=info

celery-beat-local:
	celery -A app.core.celery_app:celery_app beat --loglevel=info
