# Улучшение фронтенда Revenygo

## КОНТЕКСТ ПРОЕКТА

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 3.4 + Radix UI.  
Ключевые файлы:
- Сайдбар: `src/components/layout/workspace-sidebar.tsx`
- Shell: `src/components/layout/workspace-shell.tsx`
- Чат (пустое состояние): `src/components/chat/` — ищи компонент с пустым состоянием / empty state
- Композер: `src/components/chat/chat-composer.tsx` (или аналогичный)
- Страницы: `src/app/(workspace)/`
- Глобальные стили: `src/app/globals.css`
- Цвета и CSS-переменные: `src/app/globals.css`, классы темы через HSL-переменные без `hsl()`

**Перед началом:** прочитай `README.md` и пройдись по всем файлам в `src/components/` и `src/app/(workspace)/`, чтобы точно локализовать каждый компонент перед правкой. Используй `grep` и `find` для поиска по ключевым словам.

---

## ГЛОБАЛЬНЫЕ CSS-УТИЛИТЫ (добавить в globals.css ПЕРЕД началом правок)

Добавь в `src/app/globals.css` следующие утилиты — они будут использоваться во всех правках ниже:

```css
/* ─── Переливающийся градиент (shimmer) ─── */
@keyframes shimmer-gradient {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ─── Орб-пульс для акцентов ─── */
@keyframes orb-pulse {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50%       { opacity: 0.25; transform: scale(1.08); }
}

/* ─── Плавное появление ─── */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Shimmer-кнопка */
.rg-shimmer-btn {
  background: linear-gradient(135deg, #7C3AED, #C026D3, #EC4899, #7C3AED);
  background-size: 300% 300%;
  animation: shimmer-gradient 4s ease infinite;
  color: white;
}
.rg-shimmer-btn:hover {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.35);
  transition: all 0.2s ease;
}

/* Градиентный текст */
.rg-gradient-text {
  background: linear-gradient(135deg, #7C3AED, #C026D3, #EC4899);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer-gradient 5s ease infinite;
}

/* Угловой градиентный акцент на карточке */
.rg-card-corner::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 56px;
  height: 56px;
  border-radius: 0 var(--radius) 0 100%;
  opacity: 0.18;
  transition: opacity 0.2s ease;
  pointer-events: none;
}
.rg-card-corner:hover::after {
  opacity: 0.3;
}

/* Варианты цвета угловых акцентов */
.rg-corner-violet::after { background: linear-gradient(135deg, #7C3AED, #C026D3); }
.rg-corner-rose::after   { background: linear-gradient(135deg, #EC4899, #F59E0B); }
.rg-corner-blue::after   { background: linear-gradient(135deg, #3B82F6, #06B6D4); }
.rg-corner-emerald::after { background: linear-gradient(135deg, #10B981, #3B82F6); }
.rg-corner-amber::after  { background: linear-gradient(135deg, #F59E0B, #EF4444); }
.rg-corner-teal::after   { background: linear-gradient(135deg, #0D9488, #7C3AED); }

/* Переливающаяся карточка (для лучшего тарифа) */
.rg-shimmer-card {
  background: linear-gradient(135deg, #7C3AED, #C026D3, #EC4899, #7C3AED);
  background-size: 300% 300%;
  animation: shimmer-gradient 5s ease infinite;
}

/* Градиентная рамка */
.rg-gradient-border {
  position: relative;
  background: hsl(var(--background));
  border-radius: calc(var(--radius) + 1px);
}
.rg-gradient-border::before {
  content: '';
  position: absolute;
  inset: -1.5px;
  border-radius: inherit;
  background: linear-gradient(135deg, #7C3AED, #C026D3, #EC4899);
  background-size: 200% 200%;
  animation: shimmer-gradient 4s ease infinite;
  z-index: -1;
}
```

---

## ПРАВКА 1: Удалить «шапку» нового чата с текстом и кнопкой сценария

**Задача:** найти и удалить компонент/блок в пустом состоянии чата (`/chat` при отсутствии сообщений), который содержит:
- заголовок «Новый чат»
- строку «Сценарий: Свободный запрос» с кнопкой в той же строке

**Как найти:**
```bash
grep -r "Новый чат\|Свободный запрос\|empty.*state\|EmptyState\|ChatEmpty\|новый чат" src/components/chat/ --include="*.tsx" -l
grep -r "Новый чат\|Свободный запрос" src/ --include="*.tsx" -l
```

**Что сделать:**
- Найди JSX-блок с этим содержимым
- Полностью удали этот блок (обычно это `<div>` или отдельный компонент)
- Проверь, что остальная часть пустого состояния (плашки быстрых действий, приветствие) не сломалась
- Если это отдельный компонент — удали и импорт

---

## ПРАВКА 2: Цветные градиентные уголки на плашках быстрых действий + кнопка «Шаблоны» в ту же строку

**Задача:** Плашки (Написать письмо, Сделать summary, Подготовить презентацию, Выделить ключевые выводы, Перевести текст, Разобрать встречу) должны получить цветной полупрозрачный градиентный уголок в правом верхнем углу — как у карточек ElevenLabs app/home.

**Как найти плашки:**
```bash
grep -r "Написать письмо\|Сделать summary\|Подготовить презентацию\|Перевести текст\|quick.*action\|QuickAction\|suggestion" src/ --include="*.tsx" -l
```

**Изменения в компоненте плашки:**

Каждая плашка-карточка должна:
1. Иметь `position: relative` и `overflow: hidden`
2. Получить класс `rg-card-corner` + уникальный класс угла из палитры
3. Угловой акцент — псевдоэлемент `::after` (уже объявлен в globals.css)

Назначь уголки по-разному для каждой плашки:
```
Написать письмо       → rg-corner-violet
Сделать summary       → rg-corner-blue
Подготовить презентацию → rg-corner-rose
Выделить ключевые выводы → rg-corner-amber
Перевести текст       → rg-corner-teal
Разобрать встречу     → rg-corner-emerald
```

Пример изменения одной плашки:
```tsx
// БЫЛО:
<button className="flex items-center gap-2 px-3 py-2 rounded-lg border ...">
  <Icon /> Написать письмо
</button>

// СТАЛО:
<button className="relative overflow-hidden flex items-center gap-2 px-3 py-2 rounded-lg border rg-card-corner rg-corner-violet ...">
  <Icon /> Написать письмо
</button>
```

**Кнопка «Шаблоны»:**
- Найди кнопку «Шаблоны» (или «Templates»):
  ```bash
  grep -r "Шаблоны\|Templates\|шаблон" src/components/chat/ --include="*.tsx" -l
  ```
- Если кнопка сейчас в отдельной строке/секции — перенеси её в ту же flex-строку, что и плашки
- Если плашки в `flex flex-wrap` — добавь кнопку «Шаблоны» как последний элемент этого flex-контейнера
- Кнопка должна выглядеть как outline-вариант:
  ```tsx
  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0">
    <LayoutGrid size={14} />
    Шаблоны
  </button>
  ```

---

## ПРАВКА 3: Убрать разделитель (divider) в текстовом инпуте

**Как найти:**
```bash
grep -r "divider\|separator\|border-t\|border-b\|border-r\|border-l" src/components/chat/chat-composer*.tsx --include="*.tsx"
grep -r "divide-y\|divide-x" src/components/chat/ --include="*.tsx"
```

Ищи вертикальный `<div>` или `<Separator>` или CSS-класс типа `border-t`, `border-b`, `border-border` который отделяет:
- верхнюю зону (поле ввода textarea)
- нижнюю зону (выбор модели, кнопки прикрепления и т.д.)

**Что удалить:** сам элемент-разделитель. Не удаляй flex-контейнер или layout. Только разделитель.

Если разделитель — CSS-класс `border-t` на нижней панели:
```tsx
// БЫЛО:
<div className="flex items-center gap-2 px-3 py-2 border-t border-border ...">

// СТАЛО:
<div className="flex items-center gap-2 px-3 py-2 ...">
```

---

## ПРАВКА 4: Сайдбар — убрать «Закреплённые», переименовать nav-пункты

**Как найти:**
```bash
grep -r "Закреплено\|Закреплённые\|Pinned\|pinned\|Главная\|profile\|профиль" src/components/layout/workspace-sidebar.tsx
```

**Изменения:**

1. **Удалить секцию «Закреплено»** — найди блок с заголовком «Закреплено» (или аналогичным) и все пункты внутри него. Удали весь блок включая заголовок.

2. **Переименовать «Главная» → «Чат»** — найди nav-пункт с именем «Главная» (или Home/Главная), измени label на «Чат», оставь тот же href (`/chat`).

3. **Убрать пункт «Профиль»** из основного списка навигации — профиль доступен через кнопку внизу сайдбара.

   ```bash
   # Найди все nav-пункты
   grep -n "Профиль\|profile\|Profile" src/components/layout/workspace-sidebar.tsx
   ```
   Удали только nav-ссылку «Профиль» из списка, не трогай кнопку в самом низу.

---

## ПРАВКА 5: Переместить историю чатов сразу после основного меню + реорганизовать низ сайдбара

**Задача:** Сделать структуру сайдбара такой:

```
┌─────────────────────────┐
│ [Логотип]               │
│ [Workspace selector]    │
│                         │
│ Чат          ← nav      │
│ Сценарии     ← nav      │
│ База знаний  ← nav      │
│ Аудит        ← nav      │
│ Политики     ← nav      │
│                         │
│ ─── История чатов ────  │ ← сразу после nav
│ Чат от вчера            │
│ Анализ данных           │
│ ...                     │
│                         │
│ [Кнопка «Тарифный план»] │ ← внизу (mt-auto)
└─────────────────────────┘
```

**Что сделать:**

1. Найди блок истории чатов:
   ```bash
   grep -r "history\|ChatHistory\|история\|История" src/components/layout/ --include="*.tsx" -l
   ```

2. Перенеси компонент/блок истории чатов сразу после основного `<nav>` списка, до блока `mt-auto` с кнопками внизу.

3. Блок «Пригласить коллег / Подключить друзей» — **переместить вниз** (`mt-auto`) или **удалить**:
   - Оставь в позиции `mt-auto` только **«Тарифный план»** — это важнее и конвертирует лучше
   - Блок «Пригласить коллег» — убери его полностью из сайдбара (он может жить в профиле или настройках)

4. Кнопка «Тарифный план» должна выглядеть заметно:
   ```tsx
   <a href="/policies" className="rg-shimmer-btn flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all">
     <Sparkles size={15} />
     Тарифный план
   </a>
   ```
   Используй класс `rg-shimmer-btn` из globals.css.

---

## ПРАВКА 6: Страница тарифов — красивый дизайн с переливающейся карточкой

**Файл:** `src/app/(workspace)/policies/page.tsx` (или аналогичный — найди через grep):
```bash
grep -r "тариф\|Тариф\|план\|pricing\|Pricing\|Pro\|Базовый" src/app/ --include="*.tsx" -l
```

**Если страницы нет — создай** `src/app/(workspace)/policies/page.tsx` или найди существующую страницу с тарифами.

### Структура страницы тарифов:

```tsx
// src/app/(workspace)/policies/page.tsx
"use client"

export default function PricingPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Заголовок */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Выберите тариф
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Начните бесплатно. Обновитесь когда будете готовы.
        </p>
        {/* Переключатель месяц/год */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className="text-sm">Помесячно</span>
          {/* Toggle (Radix Switch) */}
          <span className="text-sm">Ежегодно</span>
          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">−20%</span>
        </div>
      </div>

      {/* Сетка тарифов */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Базовый */}
        <PricingCard
          name="Базовый"
          price="0 ₽"
          description="Для знакомства с платформой"
          features={[...]}
          cta="Начать бесплатно"
          variant="default"
        />

        {/* Pro — ЛУЧШИЙ ТАРИФ */}
        <PricingCard
          name="Pro"
          price="990 ₽"
          pricePeriod="/мес"
          description="Для команд и активных пользователей"
          features={[...]}
          cta="Начать 14 дней бесплатно"
          variant="featured"   // ← переливающийся градиент
          badge="Популярный"
        />

        {/* Корпоративный */}
        <PricingCard
          name="Корпоративный"
          price="По запросу"
          description="Для крупных компаний"
          features={[...]}
          cta="Связаться с нами"
          variant="default"
        />
      </div>
    </div>
  )
}
```

### Компонент PricingCard:

```tsx
// Создай src/components/pricing/pricing-card.tsx

type PricingCardProps = {
  name: string
  price: string
  pricePeriod?: string
  description: string
  features: string[]
  cta: string
  variant: 'default' | 'featured'
  badge?: string
}

export function PricingCard({ name, price, pricePeriod, description, features, cta, variant, badge }: PricingCardProps) {
  const isFeatured = variant === 'featured'

  return (
    <div className={cn(
      "relative rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300",
      isFeatured
        ? "rg-shimmer-card text-white shadow-2xl shadow-purple-500/30 scale-[1.03]"
        : "bg-background border border-border hover:border-purple-300 dark:hover:border-purple-700"
    )}>

      {/* Бейдж «Популярный» */}
      {badge && (
        <div className={cn(
          "absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full",
          isFeatured
            ? "bg-white text-purple-700"
            : "bg-purple-100 text-purple-700"
        )}>
          ⭐ {badge}
        </div>
      )}

      {/* Название */}
      <div>
        <h3 className={cn("text-lg font-bold mb-1", isFeatured ? "text-white" : "text-foreground")}>
          {name}
        </h3>
        <p className={cn("text-sm", isFeatured ? "text-white/70" : "text-muted-foreground")}>
          {description}
        </p>
      </div>

      {/* Цена */}
      <div className="flex items-baseline gap-1">
        <span className={cn("text-4xl font-black tracking-tight", isFeatured ? "text-white" : "rg-gradient-text")}>
          {price}
        </span>
        {pricePeriod && (
          <span className={cn("text-sm", isFeatured ? "text-white/60" : "text-muted-foreground")}>
            {pricePeriod}
          </span>
        )}
      </div>

      {/* Разделитель */}
      <div className={cn("h-px", isFeatured ? "bg-white/20" : "bg-border")} />

      {/* Фичи */}
      <ul className="flex flex-col gap-3 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <div className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
              isFeatured ? "bg-white/25" : "bg-purple-100 dark:bg-purple-950"
            )}>
              <Check size={9} className={isFeatured ? "text-white" : "text-purple-600"} strokeWidth={3} />
            </div>
            <span className={isFeatured ? "text-white/85" : "text-muted-foreground"}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* Кнопка */}
      <button className={cn(
        "w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200",
        isFeatured
          ? "bg-white text-purple-700 hover:bg-white/90 hover:shadow-lg"
          : "rg-shimmer-btn"
      )}>
        {cta}
      </button>
    </div>
  )
}
```

### Фичи для тарифов (замени на реальные):
```tsx
const PLANS = {
  basic: {
    features: [
      "До 50 запросов в день",
      "1 пользователь",
      "Базовые сценарии",
      "История чатов 7 дней",
      "Email поддержка",
    ]
  },
  pro: {
    features: [
      "Неограниченные запросы",
      "До 10 пользователей",
      "Все сценарии + кастомные",
      "Неограниченная история",
      "База знаний — 10 ГБ",
      "Приоритетная поддержка",
      "Аналитика и аудит",
    ]
  },
  enterprise: {
    features: [
      "Неограниченные пользователи",
      "On-premise деплой",
      "SSO / SAML",
      "Кастомные интеграции",
      "SLA 99.9%",
      "Персональный менеджер",
    ]
  }
}
```

---

## ПРАВКА 7: Страница организации — тогл граф/список + ширины

**Файл:** `src/app/(workspace)/organization/page.tsx`

**Как найти компоненты:**
```bash
grep -r "структура\|Структура\|OrgTree\|OrgChart\|Employee\|сотрудник" src/ --include="*.tsx" -l
```

### Изменения:

**1. Добавить тогл переключения вида:**
```tsx
"use client"
import { useState } from "react"
import { Network, List } from "lucide-react"

const [viewMode, setViewMode] = useState<'list' | 'tree'>('list')

// Тогл-кнопки в шапке страницы:
<div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
  <button
    onClick={() => setViewMode('list')}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
      viewMode === 'list'
        ? "bg-background shadow-sm text-foreground"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <List size={14} />
    Список
  </button>
  <button
    onClick={() => setViewMode('tree')}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
      viewMode === 'tree'
        ? "bg-background shadow-sm text-foreground"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <Network size={14} />
    Граф дерева
  </button>
</div>
```

**2. Изменить пропорции layout:**

Найди блок с двумя колонками (структура + карточка сотрудника):
```bash
grep -n "grid-cols\|flex.*gap\|w-\[" src/app/(workspace)/organization/page.tsx
```

Измени соотношение — структура шире, карточка сотрудника уже:
```tsx
// БЫЛО (примерно):
<div className="grid grid-cols-2 gap-6">

// СТАЛО:
<div className="grid gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
// или через Tailwind:
<div className="grid grid-cols-[2fr_1fr] gap-6">
```

Максимальная ширина компонента-структуры — убери ограничение `max-w-` если оно есть.

**3. Компонент-граф (tree view):**

При `viewMode === 'tree'` рендери дерево-граф вместо списка:

```tsx
// src/components/organization/org-tree.tsx
// Простая SVG-визуализация или вложенные div-блоки

function OrgTree({ data }: { data: OrgNode[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col items-center gap-0 min-w-[600px]">
        {/* Корневой узел */}
        <OrgTreeNode node={data[0]} level={0} />
      </div>
    </div>
  )
}

function OrgTreeNode({ node, level }: { node: OrgNode; level: number }) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="flex flex-col items-center">
      {/* Узел */}
      <div
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "relative flex items-center gap-2.5 px-4 py-3 rounded-xl border cursor-pointer transition-all",
          "hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm",
          level === 0
            ? "rg-gradient-border bg-background font-semibold"
            : "bg-background border-border"
        )}
      >
        <div className="w-7 h-7 rounded-full rg-shimmer-btn flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {node.name[0]}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{node.name}</p>
          <p className="text-xs text-muted-foreground">{node.role}</p>
        </div>
        {hasChildren && (
          <ChevronDown size={12} className={cn("ml-1 text-muted-foreground transition-transform", !expanded && "-rotate-90")} />
        )}
      </div>

      {/* Линия вниз */}
      {hasChildren && expanded && (
        <>
          <div className="w-px h-5 bg-border" />
          <div className="relative flex gap-8">
            {/* Горизонтальная линия */}
            <div className="absolute top-0 left-0 right-0 h-px bg-border" />
            {node.children!.map((child, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-px h-5 bg-border" />
                <OrgTreeNode node={child} level={level + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

---

## ПРАВКА 8: Профиль — упрощение, фото, смена темы, переключатель темно/светло

**Файл:** `src/app/(workspace)/profile/page.tsx`

**Как найти:**
```bash
grep -r "profile\|Profile\|профиль\|Профиль" src/app/ --include="*.tsx" -l
cat src/app/(workspace)/profile/page.tsx
```

### 8.1 Упрощение данных

Оставь только:
- Имя
- Email (только отображение, не редактирование)
- Должность / роль
- Компания

Убери если есть: адрес, телефон, дата рождения, сложные детали.

### 8.2 Загрузка фото профиля

```tsx
"use client"
import { useRef, useState } from "react"

const [avatarUrl, setAvatarUrl] = useState<string | null>(
  () => typeof window !== 'undefined' ? localStorage.getItem('user_avatar') : null
)
const fileInputRef = useRef<HTMLInputElement>(null)

function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const url = ev.target?.result as string
    setAvatarUrl(url)
    localStorage.setItem('user_avatar', url)
  }
  reader.readAsDataURL(file)
}

// JSX:
<div className="relative group w-20 h-20 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
  {avatarUrl ? (
    <img src={avatarUrl} alt="Аватар" className="w-20 h-20 rounded-full object-cover" />
  ) : (
    <div className="w-20 h-20 rounded-full rg-shimmer-btn flex items-center justify-center text-2xl font-bold text-white">
      {userName?.[0] ?? 'U'}
    </div>
  )}
  {/* Оверлей при hover */}
  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
    <Camera size={18} className="text-white" />
  </div>
  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
</div>
<p className="text-xs text-muted-foreground mt-1.5 text-center">Нажмите чтобы изменить</p>
```

### 8.3 Выбор цветовой темы платформы

```tsx
const ACCENT_THEMES = [
  { id: 'violet', label: 'Фиолетовый', from: '#7C3AED', to: '#C026D3' },
  { id: 'ocean',  label: 'Океан',      from: '#2563EB', to: '#0D9488' },
  { id: 'sunset', label: 'Закат',      from: '#EA580C', to: '#DB2777' },
  { id: 'forest', label: 'Лес',        from: '#16A34A', to: '#0D9488' },
  { id: 'gold',   label: 'Золото',     from: '#D97706', to: '#EA580C' },
  { id: 'slate',  label: 'Нейтральный', from: '#475569', to: '#64748B' },
]

const [activeTheme, setActiveTheme] = useState<string>(
  () => typeof window !== 'undefined'
    ? (localStorage.getItem('accent_theme') ?? 'violet')
    : 'violet'
)

function applyTheme(themeId: string) {
  setActiveTheme(themeId)
  localStorage.setItem('accent_theme', themeId)
  document.documentElement.setAttribute('data-accent', themeId)
}

// JSX: секция "Цвет платформы"
<section className="space-y-3">
  <h3 className="text-sm font-semibold text-foreground">Цвет платформы</h3>
  <p className="text-xs text-muted-foreground">Влияет на кнопки, акценты и градиенты</p>
  <div className="flex items-center gap-3 flex-wrap">
    {ACCENT_THEMES.map((theme) => (
      <button
        key={theme.id}
        onClick={() => applyTheme(theme.id)}
        title={theme.label}
        className={cn(
          "w-8 h-8 rounded-full transition-all duration-200",
          activeTheme === theme.id
            ? "ring-2 ring-offset-2 ring-offset-background scale-110"
            : "hover:scale-105 opacity-70 hover:opacity-100"
        )}
        style={{
          background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
          // ring-color через style т.к. динамический цвет:
          ...(activeTheme === theme.id ? { outline: `2px solid ${theme.from}`, outlineOffset: '2px' } : {})
        }}
      />
    ))}
  </div>
</section>
```

В `globals.css` добавь CSS-переменные для каждой темы (подключатся через `data-accent`):
```css
[data-accent="violet"] { --accent-from: 262 80% 60%; --accent-to: 316 70% 55%; }
[data-accent="ocean"]  { --accent-from: 210 90% 55%; --accent-to: 175 75% 45%; }
[data-accent="sunset"] { --accent-from: 25 95% 55%;  --accent-to: 340 80% 55%; }
[data-accent="forest"] { --accent-from: 150 60% 40%; --accent-to: 180 55% 38%; }
[data-accent="gold"]   { --accent-from: 42 95% 52%;  --accent-to: 25 90% 50%; }
[data-accent="slate"]  { --accent-from: 215 25% 40%; --accent-to: 215 20% 50%; }
```

При загрузке приложения (в корневом layout или в компоненте `WorkspaceShell`) восстанавливай тему:
```tsx
useEffect(() => {
  const saved = localStorage.getItem('accent_theme') ?? 'violet'
  document.documentElement.setAttribute('data-accent', saved)
}, [])
```

### 8.4 Переключатель тёмной/светлой темы

```tsx
const [isDark, setIsDark] = useState<boolean>(
  () => typeof window !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : false
)

function toggleDark() {
  const next = !isDark
  setIsDark(next)
  document.documentElement.classList.toggle('dark', next)
  localStorage.setItem('theme_dark', String(next))
}

// JSX: строка-настройка
<div className="flex items-center justify-between py-4 border-b border-border">
  <div>
    <p className="text-sm font-medium text-foreground">Тёмный режим</p>
    <p className="text-xs text-muted-foreground mt-0.5">Переключить тему интерфейса</p>
  </div>
  {/* Radix Switch или кастомный тогл */}
  <button
    onClick={toggleDark}
    className={cn(
      "relative w-10 h-5.5 rounded-full transition-all duration-300",
      isDark
        ? "rg-shimmer-btn"
        : "bg-muted border border-border"
    )}
  >
    <span className={cn(
      "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-300",
      isDark ? "translate-x-5" : "translate-x-0.5"
    )} />
  </button>
</div>
```

При загрузке приложения в корневом layout восстанавливай тему:
```tsx
// В layout.tsx или WorkspaceShell (client component):
useEffect(() => {
  const savedDark = localStorage.getItem('theme_dark') === 'true'
  document.documentElement.classList.toggle('dark', savedDark)
}, [])
```

---

## ПОРЯДОК ВЫПОЛНЕНИЯ

Выполняй правки строго по порядку. После каждой правки — убедись что TypeScript не ругается (`npx tsc --noEmit`) и вёрстка не сломалась.

```
1. globals.css        — добавить все утилиты (без этого остальное не работает)
2. Правка 1          — удалить «Новый чат» / «Свободный запрос»
3. Правка 2          — уголки на плашках + кнопка «Шаблоны» в строку
4. Правка 3          — убрать divider в инпуте
5. Правка 4          — сайдбар: убрать «Закреплено», переименовать пункты
6. Правка 5          — история чатов переезжает вниз nav, «Тарифный план» в низ
7. Правка 6          — страница тарифов
8. Правка 7          — организация: тогл + ширины
9. Правка 8          — профиль: фото + темы + тёмный режим
```

---

## ВАЖНЫЕ ОГРАНИЧЕНИЯ

- Не трогай логику отправки сообщений, моки данных, роутинг
- Все новые Tailwind-классы в `.ts`/`.tsx` файлах в `src/lib/` — проверь что путь есть в `tailwind.config.ts → content`
- `"use client"` добавляй только там где нужны хуки (useState, useEffect, useRef)
- Не создавай новые npm-зависимости — используй уже установленные (Radix UI, lucide-react, clsx, tailwind-merge)
- CSS-классы `rg-*` из globals.css — используй через `className`, не через `style={{}}`
- Цвета в Tailwind-конфиге через HSL без `hsl()` — не нарушай это соглашение
