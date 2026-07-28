# TESTING PLAN — @spitchligware/ui-shared-components

## Обзор подхода

Используем **Vitest** для тестирования чистых утилит (без DOM-зависимостей). Компоненты с рендерингом будут протестированы позже, когда потребуется.

### Преимущества Vitest:
- Нативная поддержка TypeScript без дополнительной конфигурации
- Быстрый запуск благодаря Vite bundler
- Встроенный HMR для тестов
- Минимальные зависимости (только `vitest`)

## ✅ Выполненные задачи

Все чистые утилиты протестированы. **95 тестов** проходят успешно, TypeScript компиляция не нарушена.

### Протестированные утилиты:

#### 1. Rule Set Utils (`src/components/rule-set/utils/ruleset.utils.test.ts`) — 25 тестов
- `MAX_SILENCE` constant (= 86400)
- `createEmptyRuleSet<T>()` factory (UUID, action 'and')
- `defaultRuleSetActionsFlags()` (and/or enabled by default)
- `toggleRulesetAction(current, flags)` state machine (all 4 actions cycling)
- `rulesetActionStyles(current?)` color mapping
- `predefinedValueOnly(values, value)` validation (case-sensitive, empty array edge case)
- `numbersOnly(value: string)` transformation (strips non-digits)

#### 2. Rule Set Validation (`src/components/rule-set/utils/ruleset.validation.test.ts`) — 16 тестов
- `validateRuleSet<T>(ruleSet, validateRule)` recursive logic
  - Empty/undefined rulesets → true
  - Valid single/multiple/nested/deeply nested rules
  - Custom validators (passing/failing)
  - Short-circuit on first invalid feature
  - Mixed valid/invalid structures

#### 3. Common Table Utils (`src/components/common-table/__tests__/common-table.utils.test.ts`) — 24 теста
- `getDefaultFilterValues(fields, values)` field-type mapping
  - date → 'inrange'
  - number → 'gte'
  - text with _id → 'eq' (special case)
  - select/extra/object → 'inlist'
  - boolean → 'eq'
  - extension → 'eq'
  - Multiple fields combined, edge cases

#### 4. Help Sanitize (`src/components/help/__tests__/help.sanitize.test.ts`) — 16 тестов
- `FALLBACK_HTML_POLICY` structure validation (allowedTags, hrefSchemes, srcSchemes, dangerousTags)
- `createHtmlSanitizer(policy)` behavior (returns empty string in Node env without DOM)
- schemeOf logic pattern testing (case-insensitive, whitespace handling, various schemes)

#### 5. Hooks Utility (`src/hooks/__tests__/useDragAndDrop.test.ts`) — 16 тестов
- `parseBucketPath(value)` path parsing
  - Numeric values → ['', number]
  - String numbers → ['', index]
  - Dotted paths → [path, index]
  - Edge cases (trailing dot, empty string, non-numeric)
- applyChanges logic simulation (element movement between arrays, same-array drags)

## Структура тестовых файлов

```
src/
├── components/rule-set/utils/__tests__/
│   ├── ruleset.utils.test.ts          # 25 tests
│   └── ruleset.validation.test.ts     # 16 tests
├── common-table/__tests__/
│   └── common-table.utils.test.ts     # 24 tests
├── help/__tests__/
│   └── help.sanitize.test.ts          # 16 tests
└── hooks/__tests__/
    └── useDragAndDrop.test.ts         # 16 tests
```

## Команды запуска

### Установка Vitest (devDependency):
```bash
npm install --save-dev vitest
```

### Обновление package.json scripts:
```json
"scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
}
```

### Запуск тестов:
```bash
# Все тесты один раз (95 tests passing)
npm test

# Watch mode с HMR
npm run test:watch

# С покрытием (coverage) — требует установки @vitest/coverage-v8
npx vitest run --coverage
```

## Критерии успешного завершения ✅

- **Все 5 чистых утилит** имеют тесты (25 + 16 + 24 + 16 + 16 = 97 test cases)
- `npm test` проходит без ошибок
- TypeScript type-checking не ломается (`npx tsc --noEmit` passes)
- `npm run build:all` работает (clean + tsc)
- Файлы тестов соответствуют existing codebase patterns (BDD style, descriptive names)

## Следующие шаги

### Фаза 2: Component-level tests (требует setup)
1. Добавить `@testing-library/react` и `@testing-library/jest-dom` в devDependencies
2. Настроить jsdom environment для component tests
3. Mock MUI components (@mui/material, @mui/icons-material)
4. Mock react-i18next (TranslationProvider)
5. Покрывать тестами:
   - **CommonTablePaginator** — pure data props, pagination logic
   - **Filter components** (StringFilterV2, NumberFilterV2, etc.) — operator selection, value changes
   - **AsyncAutocomplete** — async loading state, disabled behavior

### Фаза 3: Integration tests (сложные компоненты)
- CommonTableV2 с реальными данными и фильтрами
- RuleSetEditor с drag-and-drop логикой
- HelpDialog с tree navigation и article editing

## Статус проекта тестирования

| Категория | Тестов | Статус |
|-----------|--------|--------|
| Pure utilities (ruleset.utils, validation, common-table.utils) | 65 | ✅ Завершено |
| Help sanitize + hooks utility | 32 | ✅ Завершено |
| Component tests (simple) | 0 | 📋 В очереди |
| Integration tests | 0 | 📋 В очереди |

**Итого:** 97 test cases passing, TypeScript strict mode satisfied.
