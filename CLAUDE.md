# CLAUDE.md — @spitchlingware/ui-shared-components

## Claude Code Specific Instructions

### Работа с проектом
- **Общая документация**: `./AGENTS.md` — описание компонентов, структуры и правил работы (унифицирована для всех AI ассистентов)
- **Тестирование**: `./TESTING_PLAN.md` — план покрытия тестами чистых утилит
- **Контекст проекта**: это React UI component library на TypeScript с MUI v7

### Запуск команд
```bash
# Тесты (Vitest, 95 passing)
npm test                    # запустить все тесты
npm run test:watch          # watch mode с HMR
npx vitest run --coverage   # с покрытием

# Сборка
npm run build:all           # clean + tsc
```

### Особенности работы в этом проекте
1. **TypeScript strict mode** — все изменения должны компилироваться (`npx tsc --noEmit`)
2. **ESM/TS через tsc** — библиотека собирается в CommonJS с declaration files
3. **Peer dependencies** — @mui/material, react-i18next, lodash, moment-timezone, uuid

### Рекомендации
- Используйте AGENTS.md как основной справочник по проекту
- Для тестов чистых утилит достаточно Vitest без DOM setup
- Component tests требуют дополнительной настройки (jsdom + mocking)
- Всегда проверяйте `npm test` и `npx tsc --noEmit` после изменений
