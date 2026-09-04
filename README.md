# @spitchlingware/ui-shared-components

Библиотека переиспользуемых UI-компонентов для React, построенная на MUI v7.

## Быстрый старт

```bash npm
npm install @spitchlingware/ui-shared-components
```

Компоненты импортируются из одной точки:

```tsx
import { HelpEditor } from '@spitchlingware/ui-shared-components';
```

> Полная документация по каждому компоненту приведена ниже. Рекомендуется также ознакомиться с [AGENTS.md](./AGENTS.md) — сжатым описанием проекта для разработчика и AI-ассистентов, которое экономит контекст при дальнейшей работе.

---

## Зависимости (peer)

Эти пакеты должны быть установлены у **потребителя**:

```json
{
  "@mui/icons-material": "^7.3.11",
  "@mui/material":        "^7.3.8",
  "@mui/x-date-pickers":  "^8.27.0",
  "lodash":               "^4.18.1",
  "moment":               "^2.30.1",
  "moment-timezone":      "^0.6.3",
  "react":                "^19.2.4",
  "react-i18next":        "^17.0.8",
  "uuid":                 "^11.0.1"
}
```

---

## Компоненты

### CommonTableV2 — универсальная таблица с сортировкой, фильтрами и пагинацией

Компонент рендерит таблицу `MUIDataTable` / Material Table с поддержкой:

- **Сортировки** по любой колонке (команда sort из таблицы фильтров).
- **Фильтры**:
  - `StringFilterV2` / операторы startsWith, contains, endsWith.
  - `NumberFilterV2` — операции >=, <=, между, равно/не равно.
  - `DateFilterV2` — дата или диапазон дат (включая "сегодня", "текущий день").
  - `BoolFilterV2` / операторы isTrue, isFalse, isEmpty, isNotEmpty.
  - `SelectFilterV2` / dropdown select с поддержкой строковых и числовых значений (`valueMapping`).
- **Выбор операции — в самом поповере**: над полем ввода лежит блок «Условие»
  (`OperatorSelect`) со всеми доступными операциями; текущая подсвечена, поэтому
  и прочитать, и сменить её можно без дополнительного клика. Набор операций
  берётся из типа колонки, но колонка может задать свой через
  `filterProps.operators`. Редакторы значения получают `hideOperator` — свою
  иконку выбора операции они в поповере не рисуют (при отдельном использовании
  вне таблицы рисуют, как и раньше).
- **«Очистить» — в футере поповера**, слева от «Отмена» / «Применить»:
  возвращает колонку к нетронутому состоянию (тот же `defaultFilterFor`, что
  пишут ✕ на чипе и «Сбросить всё») и сразу же применяет это и закрывает
  поповер — подтверждать «Применить» не нужно. Пока очищать нечего
  (`isFilterUntouched`), кнопка неактивна. Подпись — `table:table.clear`.
- **Сводка над таблицей** всегда называет операцию: `Имя: начинается с ivan`,
  а не `Имя: ivan` — одно и то же значение под `contains`, `startsWith` и `eq`
  раньше выглядело одинаково. На узком экране операции со знаком
  (`= ≠ > ≥ < ≤`) показываются знаком.
- Ключи i18n поповера: `table:table.condition`, `table:table.value`,
  `table:table.<операция>`.
- **Поиск** через поле поиска (global filter).
- **Пагинация**: вложенный компонент `CommonTablePaginator`.

Вычисляемые колонки можно определять динамически:

```tsx
ComputedColumnProps = { id: string; column: IColumnProps<TData> };
```

### HelpEditor — WYSIWYG редактор для справочных статей

`HelpEditor` — визуальный HTML-редактор `帮助` (ручная вставка форматирования, списков и медиа контента), привязанный к внутреннему хранилищу HTML. Основные возможности:

- Форматирование текста: **bold**, *italic*, <u>underline</u>, заголовки H1/H2/Paragraph, блоки кода (pre).
- Списки unordered / ordered.
- Вставка ссылок — как внешних (`https://...`), так и внутренних `help:<slug>` с якорями на статьи из **HelpTree**.
- Вставка изображений по URL с автоматическим масштабированием.
- Поддержка multilocale (переключатель языков в тулбаре).

Компонуем компоненты:

```tsx
import HelpEditor from '@spitchlingware/ui-shared-components/dist/components/help/HelpEditor';
import { HelpAnchorProps } from '@spitchlingware/ui-shared-components/dist/types/HelpEditorProps';
// или из библиотеки целиком для простого использования:
import { HelpEditor, HelpAnchor, HelpDialog, HelpTree } from '@spitchlingware/ui-shared-components';
```

Вместе с `HelpDialog` + `HelpContext`, `HelpButton` и `HelpTree`, это образует **справочный хелпер** для встраивания статей в приложение. Сами статьи состоят из HTML-контента, написанного через HelpEditor.

Итог: HelpArticleView рендерит полученное html разбивает его по заголовкам / вставляет ссылки на статьи как `HelpAnchor`, превращая контент статьи в навигацию между статьями.

#### Экспорт / импорт справочника

`HelpDialog` в режиме редактирования показывает кнопки «Экспорт» и «Импорт», если переданы соответствующие обработчики. Сам формат переноса библиотека не знает — она лишь отдаёт потребителю выбранный файл:

- `onExport?: () => void` — кнопка «Экспорт» (скрыта, если проп не передан);
- `onImport?: (file: File) => void` — кнопка «Импорт»: открывает системный диалог выбора файла и отдаёт выбранный файл; значение `input` сбрасывается, поэтому повторный выбор того же файла снова вызовет обработчик;
- `importAccept?: string` — фильтр расширений для диалога выбора, по умолчанию `.zip`;
- `transferBusy?: boolean` — блокирует обе кнопки на время выполнения операции.

---

### RuleSetEditor — визуальный редактор правил и условий

Компонент редактора правил (`RuleSetEditor`) с валидацией и визуальным отображением:

- **BooleanLogicRuleSet** — правила булева типа (AND/OR, not).
- **UserLogicRuleSet** — наборы пользовательских правил с условиями.
  Каждый из них поддерживает `Operator` / `value`, а так же **SystemConditionRuleWrapper**, который рендерит условие и добавляет логику проверки через утилиты (validations и утилити сборки).
  
```tsx
import { RuleSetEditor, RuleOrder } from '@spitchlingware/ui-shared-components';
// дополнительные компоненты: AsyncAutocomplete, SystemConditionRuleWrapper;
```

Утилиты `ruleset.utils.ts`, `ruleset.validation.ts` (валидация и сериализация) — являются дополнительными модулями библиотеки. `useBuilderRuleSetV2` может использоваться в контексте CommonTableV2 для фильтрации через правила (как правило, для динамического построения таблиц).

---

## Утилиты / Hooks

- **hooks/useDragAndDrop** для Drag&Drop сортировки.
- Утилиты RTE (`help.rte.ts`), sanitize (`help.sanitize.ts`) — внутренняя реализация WYSIWYG, обычно **не экспортируются** напрямую потребителю.
- `common-table.utils.tsx` / helpers для общих алгоритмов фильтрации и вычисления колонок.

---

## Сборка

```bash npm run build:all
npm run clean          # удаление dist/ перед сборкой
tsc                    # чистый compile TypeScript -> ESM, без bundling
```

Финальная точка — `dist/index.js`, типы лежат в `dist/*.d.ts`.

---

## LICENSE: ISC. Автор указан как «». Рекомендуется кастомизирующий MIT/proprietary перед публикацией на npm.
