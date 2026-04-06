# Revenygo

Корпоративный **AI workspace** (рабочее место): чат с LLM в духе ChatGPT/Claude, сценарии, база знаний, политики, аудит, админка и онбординг. Сейчас это в основном **фронтенд на Next.js** с **демо-данными** (`src/lib/mock/*`) и **localStorage** для черновиков состояния (чаты, сайдбар, преференсы UI).

---

## Стек

| Слой | Технологии |
|------|------------|
| Фреймворк | **Next.js 15** (App Router), **React 19** |
| Язык | **TypeScript** (strict), алиас импортов `@/*` → `src/*` |
| Стили | **Tailwind CSS 3.4**, CSS-переменные темы в `src/app/globals.css` |
| UI | **Radix UI** (dialog, dropdown, checkbox, scroll-area, …), **lucide-react** для иконок |
| Утилиты классов | `clsx` + `tailwind-merge` → **`cn()`** в `src/lib/utils/index.ts` |
| Варианты компонентов | **class-variance-authority (cva)** в части UI (например `Button`) |

Шрифты: **Geist** и **Geist Mono** (Google Fonts) в `src/app/layout.tsx`.

---

## Структура репозитория

```
src/
  app/                    # App Router: страницы, layout, globals.css
    (workspace)/        # Защищённая зона: shell + сайдбар
      chat/             # Главный чат
      knowledge/        # База знаний
      scenarios/        # Каталог сценариев
      admin/, audit/, policies/, organization/, profile/
    onboarding/         # Воронка онбординга
    login/              # Вход (демо)
    layout.tsx          # Корневой layout, шрифты, metadata
  components/
    chat/               # Чат: композер, пузыри, пустое состояние, диалоги
    layout/             # WorkspaceShell, сайдбар, история чатов
    ui/                 # Переиспользуемые примитивы (shadcn-подобный стиль)
    auth/, onboarding/, knowledge/, scenarios/, admin/, …
  lib/
    chat/               # Модели чата, сегменты сообщений, layout колонки, localStorage префсов
    mock/               # Моки данных и сценариев
    history/            # Синхронизация списка чатов (localStorage + события)
    session/            # Сессия workspace (демо)
    utils/              # `cn()`
  types/
    index.ts            # Доменные типы: ChatThread, ChatMessage, Scenario, …
```

**Важно для Tailwind:** классы, объявленные **только** в `src/lib/**/*.ts` (строковые константы), попадают в CSS только если эти файлы перечислены в `tailwind.config.ts` → `content`. В проекте уже добавлен `./src/lib/**/*.{js,ts,jsx,tsx,mdx}` — при добавлении новых «библиотечных» утилит с классами не удаляй этот путь.

---

## Маршруты и layout

- **`/`** — лендинг/вход в продукт.
- **`/login`** — форма входа (демо).
- **`/onboarding/*`** — шаги онбординга.
- **`/(workspace)/*`** — обёртка `WorkspaceAccessGuard` + **`WorkspaceShell`** (сайдбар + main). Страницы: `/chat`, `/knowledge`, `/scenarios`, `/admin`, `/audit`, `/policies`, `/organization`, `/profile`.

Редирект в `next.config.ts`: `/history` → `/chat`.

---

## Стили и дизайн-система

1. **Тема через CSS variables** (`:root` и `.dark` в `globals.css`): `--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--radius` и т.д. Значения в формате **HSL без `hsl()`** — так принято в shadcn/Tailwind theme extend.
2. **Tailwind** мапит эти токены в `tailwind.config.ts` (`colors.border`, `background`, …).
3. **Компоновка чата:** единая ширина колонки задаётся в **`src/lib/chat/chat-column-layout.ts`** (`chatColumnClassName`, `CHAT_COLUMN_CLASS` — `max-w-[712px]` и отступы). Менять ширину читаемой колонки — **там**.
4. Составные классы: **`cn("...", condition && "…")`** чтобы `tailwind-merge` корректно разрешал конфликты (`flex-1` vs `shrink-0` и т.п.).
5. Кастом: анимация орба `.rg-orb-sheen` в `globals.css`.

Тёмная тема переключается классом **`dark`** на корневом элементе (если добавите переключатель — следите за этим контрактом).

---

## Как запускать

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production-сборка
npm run lint         # ESLint (next/core-web-vitals)
```

Полезное при «залипании» HMR на некоторых ФС/облаках:

```bash
npm run dev:poll     # polling watcher (см. next.config.ts)
npm run dev:turbo    # Turbopack
npm run dev:clean    # сброс .next и dev
```

---

## Как писать код (соглашения)

1. **Клиентские границы:** директива `"use client"` там, где нужны хуки, браузерные API, события. Layout workspace — client из-за guard и shell.
2. **Типы домена** — в `src/types/index.ts`; импорт `@/types` или `@/types/index`.
3. **Моки** — `src/lib/mock/*`; не смешивать с прод-API до появления бэкенда.
4. **Персистенция в браузере** — модули вроде `chat-threads-storage.ts`, `chat-ui-prefs-storage.ts`, `workspace-sidebar-storage.ts`; при изменении схемы — миграции/версионирование по месту.
5. **Чат:** основной контейнер — `ChatWorkspace`; композер — `ChatComposer`; список сообщений — `ChatMessageList` + `ChatMessageBubble`. Новые возможности чата лучше вешать на эти узлы или выносить в `src/lib/chat`.
6. **UI-примитивы** — расширять `src/components/ui/*` в том же стиле (Radix + Tailwind + `cn`).
7. **Язык интерфейса** в проекте — **русский** (`lang="ru"` в корне).

---

## Для LLM и новых разработчиков: быстрые якоря

| Задача | Куда смотреть |
|--------|----------------|
| Новая страница в продукте | `src/app/(workspace)/<route>/page.tsx` |
| Оболочка, отступы чата, сайдбар | `workspace-shell.tsx`, `workspace-sidebar.tsx` |
| Логика чата, отправка (демо) | `chat-workspace.tsx`, `chat-composer.tsx` |
| Ширина колонки чата | `src/lib/chat/chat-column-layout.ts` |
| Модели/лейблы в композере | `src/lib/chat/unified-chat-models.ts` |
| Типы сообщений и тредов | `src/types/index.ts` |
| Новый мок-список / сценарий | `src/lib/mock/` |
| Кнопки, инпуты, диалоги | `src/components/ui/` |

При добавлении **новых Tailwind-классов только в `src/lib`** убедитесь, что файл попадает под `content` в `tailwind.config.ts` (иначе стили не сгенерируются).

---

## Лицензия и статус

Проект **private** (`package.json`). Бэкенд и реальная авторизация в этом репозитории не заданы — ориентир на дальнейшую интеграцию API поверх текущего UI.
