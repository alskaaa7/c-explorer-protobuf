# C/C++ File Analyzer with Protobuf

Анализатор C/C++ файлов с использованием Google Protobuf для быстрой и эффективной сериализации данных.

## Содержание
- [Особенности](#особенности)
- [Структура проекта](#структура-проекта)
- [Требования](#требования)
- [Установка](#установка)
- [Запуск](#запуск)
- [Использование](#использование)
- [API](#api)
- [Технологии](#технологии)

## Особенности

- **Protobuf-ориентированный анализ**: Все данные передаются в бинарном формате Google Protobuf
- **Быстрая сериализация**: Ускоренная обработка по сравнению с JSON
- **Компактные данные**: Меньший размер передаваемых данных
- **Детальный анализ C/C++ файлов**:
  - Подсчет строк кода, комментариев, пустых строк
  - Обнаружение функций с их параметрами
  - Анализ include директив
  - Предпросмотр содержимого файла
- **Интерфейс**: Vue 3 + Element Plus
- **Полная поддержка C/C++**: `.c`, `.cpp`, `.h`, `.hpp`, `.cc`, `.cxx`, `.hxx`

## Структура проекта

## Требования

### Backend
- Python 3.8+
- FastAPI
- Uvicorn
- Google Protobuf
- protobuf==4.25.1

### Frontend
- Node.js 18+
- Vue 3
- Element Plus
- protobufjs

## Структура проекта

### backend:
- main.py # FastAPI приложение
- schema.proto # Protobuf схема
- schema_pb2.py # Сгенерированный Python код
- uploads/ # Загруженные файлы

### frontend:
- public/
- proto/
- schema.proto # Protobuf схема для фронтенда
#### src/
- main.js # Точка входа Vue
- App.vue # Главный компонент
##### components/ # Vue компоненты
- utils/ # Утилиты
- router/ # Маршрутизация

### Остальное:
- package.json # Зависимости фронтенда
- vite.config.js # Конфигурация Vite
- index.html # HTML шаблон
- README.md

## Установка

### 1. Клонирование репозитория
```
git clone <repository-url>
cd analyzer-project
```

## Настройка бэкенда

### Переход в директорию бэкенда
```cd backend```

### Установка зависимостей Python
```pip install fastapi uvicorn protobuf==4.25.1```

### Генерация protobuf кода (если необходимо)
```protoc --python_out=. schema.proto```

## Настройка фронтенда

### Переход в директорию фронтенда
```cd frontend```

### Установка зависимостей Node.js
```npm install```

### Копирование protobuf схемы в public директорию
```
mkdir -p public/proto
cp ../backend/schema.proto public/proto/
```

## Запуск бэкенда

```
cd backend
python main.py
```


- Сервер запустится на http://localhost:8000 
- API документация: http://localhost:8000/docs
- Альтернативная документация: http://localhost:8000/redoc


## Запуск фронтенда

```
cd frontend
npm run dev
```

- Фронтенд запустится на http://localhost:5173

