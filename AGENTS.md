# Agent Quick Reference — @spitchligware/ui-shared-components

## Project Overview
Библиотека UI-компонентов для React 19 + MUI v7 на TypeScript. Компоненты экспортируются в `dist/index.js` через tsc (ESM/TS). Зависимости-пираты: @mui/material, @mui/icons-material, @mui/x-date-pickers, react-i18next, lodash, moment, uuid.

## Directory Map
```
src/components/
├── common-table/         — Таблица v2 с фильтрами и пагинацией
│   ├── filters/          — BoolFilterV2, DateFilterV2, NumberFilterV2, SelectFilterV2, StringFilterV2, OperatorMenu
│   ├── panel/            — UI фильтров: иконка в шапке колонки (ColumnFilterButton),
│   │                       редактор в поповере (FilterPopover → ValueEditor / PeriodEditor),
│   │                       выбор операции внутри поповера (OperatorSelect),
│   │                       шапка поповера с названием колонки и сбросом (EditorHeader),
│   │                       сводка активных фильтров чипсами (TableFilterPanel)
│   └── types/            — filter.types.ts, table-v2.types.tsx, table-v2.fields.ts
├── help/                 — Редактор и вьювер справочных статей
└── rule-set/             — Визуальный редактор правил (BooleanLogicRuleSet / UserLogicRuleSet)

src/hooks/                — useDragAndDrop
```

## Component Quick Reference
- **CommonTableV2** — основная таблица. Поддерживает сортировку, фильтрацию (все фильтры из common-table/filters), пагинацию.
  Фильтр колонки открывается иконкой в её же шапке; над таблицей остаётся только сводка активных фильтров с кнопкой сброса,
  и она скрыта целиком, пока ни один фильтр не выставлен. Отключается пропсами `showColumnFilters` / `showFilterPanel`.
  Операция выбирается в самом поповере (`OperatorSelect`, блок «Условие»): все варианты на виду, выбранный подсвечен.
  Набор операций даёт `operatorsForField` по типу колонки, переопределяется через `filterProps.operators`.
  Чип в сводке всегда называет операцию — `describeFilterParts` / `periodParts` отдают её отдельно от значения,
  чтобы чип развёл их по тону.
  Сброс фильтра — крестик в шапке поповера; цель сброса (`defaultFilterFor`) считает `FilterPopover` и передаёт
  оба редактора пропом `reset`, так что «Сбросить» на чипе, в панели и в поповере значат одно и то же.
  Колонка с чекбоксом фиксирована (44px): запас ширины забирает служебная колонка-филлер в конце строки.
  Конфигурация колонок через `columns: TableColumnsType<TData> | 'flex' | null`. Вычисляемые колонки — `ComputedColumnProps` с параметром `id`, возвращающим JSX.
- **CommonTablePaginator** — нижняя панель нумерации страниц MUI.
- **HelpEditor** – WYSIWYG-редактор на contentEditable. Инструменты: bold, italic, underline, H1/H2/p/ul/ol/code и вставка ссылок (внутренних `help:<slug>` или внешних URL) и изображений. Многоязычность через locale switches.
- **HelpContext / HelpDialog / HelpAnchor** – контекст для хранения статей справки и отображение их в модальном окне, якорные ссылки из HelpEditor. В режиме редактирования `HelpDialog` показывает кнопки «Экспорт» / «Импорт», если переданы `onExport` / `onImport`; формат файла определяет потребитель, библиотека лишь отдаёт выбранный `File` (см. README).
- **HelpTree** – дерево навигации по статьям (из `help.types`).
- **RuleSetEditor** + helpers — визуальный редактор наборов правил. Поддерживает BooleanLogicRuleSet / UserLogicRuleSet, с проверкой валидности и утилитой сборки.
  Рядом **RuleOrder**, **SystemConditionRuleWrapper**.

## Rule for editing source code
1. Не трогать файлы без явного запроса на изменение. Рефакторинг/добавление – только после согласования.
2. Один `FC` export per file с props в интерфейсе — единый стиль компонентов.
3. При взаимодействии с CommonTableV2 проверять совместимость с фильтрами и типами из `filter.types.ts`, `table-v2.fields.ts`.
4. `help.rte.ts` и `common-table.utils.tsx` - вспомогательные библиотеки, не изменять без понимания целей использования.
5. Для rule-set соблюдать структуру: Types (`ruleset.types.ts`), Utils (`*.utils.ts`), Validation (`*.validation.ts`), Wrappers для визуала (UI).

## Build & Test Commands
```bash
# Сборка проекта
npm run build:all  # clean + tsc

# Тесты (Vitest)
npm test           # все тесты один раз (95 passing)
npm run test:watch # watch mode с HMR
npx vitest run --coverage  # с покрытием
```

## Testing Guidelines
Проект использует **Vitest** для unit-тестирования чистых утилит. Все 95 тестов проходят успешно.

### Для новых тестов учитывайте:
1. **Pure utilities (без DOM)** — тестируйте напрямую через Vitest в `src/**/__tests__/*.test.ts`
2. **Component tests** (требуют setup) — для MUI компонентов нужно mocking и jsdom environment
3. **TypeScript strict mode** — тесты должны компилироваться (`npx tsc --noEmit`)

### Структура тестов:
```
src/components/rule-set/utils/__tests__/     # Pure utility tests (ruleset.utils, validation)
src/common-table/__tests__/                  # Common table utils
src/help/__tests__/                          # Help sanitize utilities
src/hooks/__tests__/                         # Hooks utilities (parseBucketPath, etc.)
```

### Coverage статус:
- ✅ **Pure utilities** — 95 тестов покрывают все чистые функции (ruleset.utils, validation, common-table.utils, help.sanitize, hooks)
- 📋 **Components** — требуют настройки Vitest с jsdom + mocking MUI/i18n для React Testing Library

## Next Steps for Tests
Для добавления component-level тестов:
1. Установить `@testing-library/react`, `@testing-library/jest-dom`
2. Настроить jsdom environment в vitest.config.ts
3. Mock'ать MUI (@mui/material, @mui/icons-material) и react-i18next (TranslationProvider)
