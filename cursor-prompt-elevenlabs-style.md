# Cursor Prompt: Restyle Revenygo → ElevenLabs Design System

## КОНТЕКСТ

Это Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 3.4 + Radix UI проект.  
Задача: полностью переписать визуальный слой фронтенда под дизайн-систему **ElevenLabs** (elevenlabs.io/app).  
Логику, моки, типы, роутинг — не трогать. Только внешний вид.

---

## 1. ДИЗАЙН-ТОКЕНЫ — globals.css

Замени все CSS-переменные в `src/app/globals.css` на следующие. Тёмная тема через класс `dark` на корневом элементе.

```css
:root {
  /* Фоны */
  --background: 0 0% 100%;           /* #FFFFFF — основной фон контента */
  --background-secondary: 0 0% 97%; /* #F7F7F7 — фон сайдбара и плашек */
  --background-tertiary: 0 0% 94%;  /* #F0F0F0 — hover-состояния, active nav */

  /* Текст */
  --foreground: 0 0% 4%;            /* #0A0A0A — основной текст */
  --muted-foreground: 0 0% 45%;     /* #737373 — вторичный текст, подписи */
  --placeholder: 0 0% 65%;          /* #A6A6A6 — плейсхолдеры */

  /* Граница */
  --border: 0 0% 90%;               /* #E5E5E5 — все border по умолчанию */
  --border-strong: 0 0% 75%;        /* #BFBFBF — акцентные border (hover, focus) */

  /* Первичный цвет (CTA кнопки) */
  --primary: 0 0% 4%;               /* #0A0A0A — чёрный */
  --primary-foreground: 0 0% 100%;  /* #FFFFFF */

  /* Вторичный (outline кнопки, теги) */
  --secondary: 0 0% 97%;
  --secondary-foreground: 0 0% 4%;

  /* Muted (фон карточек onboarding inactive) */
  --muted: 0 0% 97%;

  /* Акцент (не используется как основной, только для workspace-dot) */
  --accent: 24 100% 50%;            /* #FF6600 — оранжевый ElevenLabs */
  --accent-foreground: 0 0% 100%;

  /* Радиус скруглений */
  --radius: 0.5rem;                 /* 8px — кнопки, инпуты, теги */
  --radius-md: 0.75rem;             /* 12px — карточки, панели */
  --radius-lg: 1rem;                /* 16px — крупные блоки */
}

.dark {
  --background: 0 0% 8%;
  --background-secondary: 0 0% 11%;
  --background-tertiary: 0 0% 14%;
  --foreground: 0 0% 95%;
  --muted-foreground: 0 0% 55%;
  --placeholder: 0 0% 40%;
  --border: 0 0% 18%;
  --border-strong: 0 0% 30%;
  --primary: 0 0% 95%;
  --primary-foreground: 0 0% 5%;
  --secondary: 0 0% 14%;
  --secondary-foreground: 0 0% 90%;
  --muted: 0 0% 13%;
}
```

---

## 2. ШРИФТ

В `src/app/layout.tsx` замени шрифт на **Inter** из Google Fonts (ближайший к тому, что использует ElevenLabs):

```ts
import { Inter } from 'next/font/google'
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
})
```

В `globals.css` добавь:
```css
body {
  font-family: var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
```

---

## 3. TAILWIND CONFIG

В `tailwind.config.ts` убедись, что цвета маппятся на CSS-переменные. Добавь/исправь:

```ts
theme: {
  extend: {
    borderRadius: {
      DEFAULT: 'var(--radius)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      full: '9999px',
    },
    fontSize: {
      xs: ['11px', '16px'],
      sm: ['12px', '18px'],
      base: ['14px', '20px'],
      md: ['15px', '22px'],
      lg: ['16px', '24px'],
      xl: ['18px', '26px'],
      '2xl': ['22px', '30px'],
      '3xl': ['28px', '36px'],
    },
    transitionTimingFunction: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  }
}
```

---

## 4. САЙДБАР — `workspace-sidebar.tsx`

Переделай полностью под структуру ElevenLabs:

### Структура (сверху вниз):
```
┌─────────────────────────────┐  ← width: 240px, border-right: 1px solid border
│ [II] Revenygo               │  ← логотип: жирный текст, "II" префикс как у ElevenLabs
│                             │
│ 🟠 Workspace Name    ⌄     │  ← workspace selector: цветная точка + chevron
│                             │
│ Home                        │  ← nav items
│ Сценарии                    │
│ База знаний                 │
│ Аудит                       │
│ Политики                    │
│ Организация                 │
│                             │
│ Закреплено ────────────     │  ← секция с лейблом "Закреплено" 11px uppercase
│ Чат                         │
│ Профиль                     │
│                             │
│ ┌──────────────────────┐   │
│ │ ➤ Пригласить коллег  │   │  ← плашка внизу с border, rounded-md
│ │  Делитесь сценариями  │   │
│ └──────────────────────┘   │
│                             │
│ Разработчики                │
│ [⬆] Обновить план          │  ← Upgrade-кнопка: чёрная, full-width
└─────────────────────────────┘
```

### CSS-правила сайдбара:
```tsx
// Контейнер сайдбара
className="w-[240px] flex-shrink-0 h-screen flex flex-col bg-[hsl(var(--background-secondary))] border-r border-[hsl(var(--border))] py-3 px-3"

// Логотип
className="flex items-center gap-1.5 px-2 py-2 mb-1"
// Текст логотипа:
className="text-base font-semibold text-[hsl(var(--foreground))] tracking-tight"
// "II" префикс — отдельный span, font-weight 800, text-[hsl(var(--foreground))]

// Workspace selector
className="flex items-center gap-2 px-2 py-1.5 mb-3 rounded-[var(--radius)] hover:bg-[hsl(var(--background-tertiary))] cursor-pointer transition-colors duration-150"
// Цветная точка: w-3 h-3 rounded-full bg-orange-500

// Nav item (неактивный)
className="flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius)] text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--background-tertiary))] hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors duration-150 select-none"

// Nav item (активный)
className="flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius)] text-sm text-[hsl(var(--foreground))] bg-[hsl(var(--background-tertiary))] font-medium cursor-pointer"

// Секция "Закреплено"
className="px-2 py-1 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mt-3 mb-1"

// Плашка "Пригласить"
className="mx-1 p-3 rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))]"

// Upgrade кнопка
className="mx-1 mt-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[var(--radius)] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
```

### Иконки: используй lucide-react, размер 15px для nav items, цвет наследуется от текста.

---

## 5. ВЕРХНЯЯ ШАПКА — `WorkspaceShell`

```tsx
// Top bar
className="h-[52px] flex items-center border-b border-[hsl(var(--border))] px-4 gap-3 flex-shrink-0 bg-[hsl(var(--background))]"

// Breadcrumb: "Страница" — text-sm text-[hsl(var(--foreground))] font-medium
// Breadcrumb separator: text-[hsl(var(--muted-foreground))]

// Правая часть: кнопки Feedback, Docs в стиле:
className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors px-3 py-1.5 rounded-[var(--radius)] hover:bg-[hsl(var(--background-tertiary))]"

// Кнопка с иконкой (Ask, Share):
className="flex items-center gap-1.5 text-sm ..."
```

---

## 6. КНОПКИ — `src/components/ui/button.tsx`

Полностью перепиши варианты через `cva`:

```ts
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none",
  {
    variants: {
      variant: {
        // Чёрная CTA кнопка — основная
        default: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 active:scale-[0.98]",
        // Outline — вторичная
        outline: "border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--background-tertiary))] active:scale-[0.98]",
        // Ghost — прозрачная
        ghost: "bg-transparent text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--background-tertiary))] hover:text-[hsl(var(--foreground))]",
        // Destructive
        destructive: "bg-red-600 text-white hover:bg-red-700",
        // Link
        link: "text-[hsl(var(--foreground))] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4",
        lg: "h-10 px-5 text-base",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

---

## 7. ИНПУТЫ И ФОРМЫ

```tsx
// Input
className="h-9 w-full rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--placeholder))] outline-none transition-colors focus:border-[hsl(var(--border-strong))] focus:ring-0 hover:border-[hsl(var(--border-strong))]"

// Select / Dropdown trigger — аналогично

// Search input (например в базе знаний, голосах):
className="h-9 w-full rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 text-sm ..."
// иконка поиска: absolute left-3, w-4 h-4, text-[hsl(var(--muted-foreground))]
```

---

## 8. КАРТОЧКИ ОНБОРДИНГА — `src/app/onboarding/*`

Онбординг ElevenLabs — это шаги с выбором карточек:

```tsx
// Сетка карточек выбора
className="grid grid-cols-2 md:grid-cols-4 gap-3"

// Карточка (неактивная)
className="flex flex-col items-start gap-3 p-4 rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] cursor-pointer transition-all duration-200 hover:border-[hsl(var(--border-strong))] hover:shadow-sm select-none"

// Карточка (выбранная)
className="... border-[hsl(var(--foreground))] border-[1.5px]"

// Карточки НЕВЫБРАННЫХ элементов (когда есть выбор) — эффект затухания:
// Применяй opacity-40 ко всем карточкам кроме выбранной через transition-opacity duration-200

// Иконка внутри карточки: w-5 h-5 text-[hsl(var(--foreground))]
// Текст карточки: text-sm font-medium text-[hsl(var(--foreground))]

// Прогресс-точки внизу страницы онбординга:
className="flex items-center gap-1.5"
// Точка: w-1.5 h-1.5 rounded-full bg-[hsl(var(--border))]
// Активная точка: w-4 h-1.5 rounded-full bg-[hsl(var(--foreground))] (расширенная)
// Анимация: transition-all duration-300

// Кнопки навигации: "Назад" — ghost, "Продолжить" — default (чёрная)
```

---

## 9. ЧАТ — `ChatWorkspace`, `ChatMessageBubble`, `ChatComposer`

### Пустое состояние чата (Home-style):
```tsx
// Приветствие
<h2 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
  Добрый день, {userName}
</h2>
// Подзаголовок — text-sm text-[hsl(var(--muted-foreground))] mt-1

// Карточки быстрых действий (как Instant speech, Audiobook у ElevenLabs):
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6"
// Карточка:
className="flex flex-col items-start p-4 rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] cursor-pointer hover:bg-[hsl(var(--background-tertiary))] hover:border-[hsl(var(--border-strong))] transition-all duration-150"
```

### Бабл сообщения пользователя:
```tsx
// User bubble
className="ml-auto max-w-[75%] rounded-[var(--radius-md)] rounded-br-sm bg-[hsl(var(--background-tertiary))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))]"

// Assistant bubble — без фона, просто текст с отступом
className="max-w-[75%] text-sm text-[hsl(var(--foreground))] leading-relaxed"
```

### Композер:
```tsx
// Обёртка
className="border border-[hsl(var(--border))] rounded-[var(--radius-md)] bg-[hsl(var(--background))] focus-within:border-[hsl(var(--border-strong))] transition-colors"

// Textarea внутри — без border, без outline
// Нижняя панель с кнопками: border-t border-[hsl(var(--border))]

// Кнопка отправки: icon-size, default variant (чёрная) когда есть текст, outline когда пустой
```

---

## 10. КАРТОЧКИ СЦЕНАРИЕВ / БАЗЫ ЗНАНИЙ

```tsx
// Контейнер страницы
className="p-6 max-w-[1200px]"

// Заголовок страницы
className="text-xl font-semibold text-[hsl(var(--foreground))] mb-1"
// Подзаголовок: text-sm text-[hsl(var(--muted-foreground))] mb-5

// Фильтры-теги (Conversational, Narration...)
className="flex items-center gap-2 flex-wrap mb-5"
// Тег:
className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))] bg-[hsl(var(--background))] hover:border-[hsl(var(--border-strong))] hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors"
// Активный тег:
className="... bg-[hsl(var(--foreground))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--foreground))]"

// Грид карточек
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"

// Карточка
className="p-4 rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-[hsl(var(--border-strong))] hover:shadow-[0_1px_8px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer"
```

---

## 11. ADMIN / AUDIT / SETTINGS СТРАНИЦЫ

```tsx
// Секция настроек (Settings-style)
className="divide-y divide-[hsl(var(--border))]"

// Строка настройки
className="flex items-center justify-between py-4"
// Левая часть: label text-sm font-medium + description text-xs text-[hsl(var(--muted-foreground))] mt-0.5
// Правая часть: кнопка или toggle

// Toggle (Radix Switch):
// track: w-9 h-5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background-tertiary))] data-[state=checked]:bg-[hsl(var(--foreground))] data-[state=checked]:border-[hsl(var(--foreground))] transition-colors
// thumb: w-4 h-4 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4

// Table (audit log):
// thead: text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider border-b border-[hsl(var(--border))]
// tr hover: hover:bg-[hsl(var(--background-secondary))]
// td: text-sm text-[hsl(var(--foreground))] py-3 border-b border-[hsl(var(--border))]
```

---

## 12. АНИМАЦИИ

Добавь в `globals.css`:

```css
/* Плавный переход для всех интерактивных элементов */
*, *::before, *::after {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Fade-in для страниц */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-enter {
  animation: fadeIn 0.2s ease forwards;
}

/* Shimmer для skeleton-загрузки */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    hsl(var(--background-tertiary)) 25%,
    hsl(var(--border)) 50%,
    hsl(var(--background-tertiary)) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius);
}

/* Scale при нажатии на карточки */
.card-pressable:active {
  transform: scale(0.99);
  transition: transform 0.1s ease;
}
```

---

## 13. ЛОГОТИП В САЙДБАРЕ

Переделай логотип под стиль ElevenLabs (II-префикс):

```tsx
// Примерная реализация:
<div className="flex items-center gap-1 px-2 py-2">
  <span className="font-black text-base tracking-tighter text-[hsl(var(--foreground))]">II</span>
  <span className="font-semibold text-base text-[hsl(var(--foreground))] tracking-tight">Revenygo</span>
</div>
```

---

## 14. ДИАЛОГИ / МОДАЛКИ — Radix Dialog

```tsx
// Overlay
className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"

// Content
className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[hsl(var(--background))] rounded-[var(--radius-lg)] border border-[hsl(var(--border))] p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"

// Header
className="mb-4"
// Title: text-base font-semibold text-[hsl(var(--foreground))]
// Description: text-sm text-[hsl(var(--muted-foreground))] mt-1

// Footer
className="flex items-center justify-end gap-2 mt-6"
// Кнопки: outline + default
```

---

## 15. DROPDOWN МЕNUS — Radix Dropdown

```tsx
// Content
className="z-50 min-w-[180px] bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-[var(--radius-md)] p-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)] animate-in fade-in-0 zoom-in-95"

// Item
className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius)] text-sm text-[hsl(var(--foreground))] cursor-pointer hover:bg-[hsl(var(--background-tertiary))] transition-colors select-none outline-none"

// Separator
className="my-1 h-px bg-[hsl(var(--border))]"

// Destructive item
className="... text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
```

---

## 16. СТРАНИЦА LOGIN / ONBOARDING ENTRY

```tsx
// Центрированный layout с минимализмом ElevenLabs:
className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--background))] p-4"

// Логотип вверху
// Заголовок: text-2xl font-semibold text-center mb-1
// Подзаголовок: text-sm text-[hsl(var(--muted-foreground))] text-center mb-8

// Форма: max-w-sm w-full flex flex-col gap-3
// Label: text-sm font-medium text-[hsl(var(--foreground))] mb-1
// Кнопка submit: w-full default variant h-10

// Ссылка внизу: text-sm text-[hsl(var(--muted-foreground))] text-center mt-4
// Ссылка в тексте: text-[hsl(var(--foreground))] underline-offset-2 hover:underline font-medium
```

---

## ПОРЯДОК ВЫПОЛНЕНИЯ

1. `globals.css` — новые CSS-переменные и анимации
2. `tailwind.config.ts` — обнови borderRadius и fontSize
3. `layout.tsx` — замени шрифт на Inter
4. `src/components/ui/button.tsx` — перепиши варианты
5. `src/components/ui/input.tsx` — перепиши стили
6. `src/components/layout/workspace-sidebar.tsx` — полная переработка под ElevenLabs структуру
7. `src/components/layout/workspace-shell.tsx` — top bar 52px с breadcrumb
8. `src/app/onboarding/*` — карточки с эффектом затухания и точки прогресса
9. `src/components/chat/*` — новые бабблы, composer, пустое состояние
10. `src/app/(workspace)/scenarios/*` — фильтры-теги, грид карточек
11. `src/app/(workspace)/knowledge/*` — аналогично scenarios
12. `src/app/(workspace)/admin/*`, `audit/*`, `policies/*` — table + settings строки
13. `src/components/ui/dialog.tsx`, `dropdown-menu.tsx` — новые стили

---

## КЛЮЧЕВЫЕ ПРИНЦИПЫ ElevenLabs которые нужно соблюдать

- **Чистый белый** фон, никакого серого для основного контента  
- **Чёрный** для всех primary CTA (не синий, не фиолетовый)  
- **Минимум теней** — только 1px border везде, shadow только у dropdown/modal  
- **Скругления**: 8px кнопки/инпуты, 12px карточки — без исключений  
- **Типографика плоская**: 400 для body, 500–600 для заголовков, никаких жирных body  
- **Иконки 15px** в nav, 16px в action кнопках — через lucide-react  
- **Hover на карточках**: border darkens (border-strong), лёгкая тень 0 1px 8px rgba(0,0,0,0.06)  
- **Переходы**: 150ms ease для nav/hover, 200ms для карточек, 300ms для page-level  
- **Opacity-эффект** на онбординге при выборе карточки: невыбранные → opacity-40  
- Никакого `ring` при focus на кнопках — только `outline-none`  
- Все border — `1px solid hsl(var(--border))`, не `2px`, не `0.5px`
