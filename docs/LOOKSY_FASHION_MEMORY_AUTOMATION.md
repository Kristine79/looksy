# LOOKSY — Fashion Memory Automation (Phase 7)

## Обзор

Phase 7 превращает поведенческие сигналы пользователя (носит, сохраняет,
пропускает, меняет) в **долговременные Fashion Memories** без единого LLM-вызова.
Детерминированная логика выявляет повторяющиеся паттерны (цвета, категории,
антипаттерны) и накапливает их как кандидатные воспоминания с обязательными
доказательствами (evidence), по которым система всегда может объяснить,
откуда взялось то или иное предпочтение.

Реализует прикладной слой decay, обещанный в ADR-014, и принцип
"user corrections are final" из продуктовой документации: явно отклонённое
пользователем воспоминание не пересоздаётся из слабых сигналов.

## Архитектура

```
recordWear / recordSave / recordSwap / recordSkip (outfits/actions.ts)
        │  FeedbackService.record*()
        ▼
triggerMemoryAutomation(userId)   ── функция-хук, fire-and-forget, ошибки глотает
        │  outfits ← recommendations (односторонний импорт через composition root)
        ▼
MemoryAutomationService.processSignals(userId)
        │ 1. extractCandidates()
        │    ├─ detectColorPreferences(wardrobe, wearHistory)  → color_preference
        │    ├─ detectStyleTendencies(wardrobe, wearHistory)   → style_tendency
        │    └─ detectNegativePreferences(feedback)            → negative_preference
        ▼
        │ 2. upsertCandidate(userId, candidate)  ── дубликаты, противоречия,
        │    │                                      пользовательские коррекции
        ▼
        │ 3. applyDecay(userId)  ── пересчёт confidence из freshness-взвешенных
        │                           evidence + демоция статуса
        ▼
   fashion_memories / memory_evidence (существующая схема)
```

## Компоненты

| Компонент | Файл | Ответственность |
|---|---|---|
| `MemoryAutomationService` | `src/modules/recommendations/automationService.ts` | Извлечение кандидатов, upsert с дедупликацией/противоречиями, decay, агрегация confidence |
| `MemoryAutomationHook` | `src/modules/outfits/feedbackService.ts` | Контракт-функция `(userId) => Promise<void>`; вызов после каждого record* |
| `createMemoryAutomationHook()` | `src/modules/recommendations/server.ts` | Composition root: ленивый синглтон сервиса + репозитория |
| `findMemoryByTypeCategory` | `src/modules/recommendations/repository.ts` | Поиск существующих воспоминаний по ключу (type, category) — основа дедупликации |
| `findPositiveMemoryByTag` | `src/modules/recommendations/repository.ts` | Разрешение негативного сигнала против позитивных предпочтений |
| `findMemoriesForDecay` | `src/modules/recommendations/repository.ts` | Загрузка memory + evidence для прохода decay |
| `findActiveMemories` | `src/modules/recommendations/repository.ts` | Чтение для контекста: только не-deleted воспоминания |
| `RecommendationContextService` | `src/modules/recommendations/contextService.ts` | Питает prompt воспоминаниями пользователя (без `deleted`) |

## Правила накопления

### 1. Ключ воспоминания

Уникальный ключ — `(type, category)` с нормализованным слагом категории:
`color:navy`, `style:earth-tones`, `negative:formal`. Один паттерн = одна
каноническая запись: новые сигналы доклеиваются как evidence, а не плодят
дубликаты.

### 2. Пороги создания

- **color_preference**: ≥ 2 worn-вещей с одинаковым цветом и суммарный wear ≥ 2.
- **style_tendency**: ≥ 2 worn-вещей одной категории с суммарным wear ≥ 2.
- **negative_preference**: ≥ 2 skip-действий с одинаковым тегом контекста
  (occasion/weather из `outfit_feedback.context`).

Контекст пишется в `outfit_feedback.context` самим UI: при "Not for me"
(`notForMeAction`) `FeedbackButtons` передаёт occasion текущего look'а —
без него изолированный skip не создаёт воспоминание (фикс `f45dc37`).

Порог задан константой `CREATION_SIGNAL_THRESHOLD = 2`. Один изолированный
эпизод никогда не превращается в предпочтение.

### 3. Evidence (обязательное)

Каждое воспоминание несёт минимум одну запись `memory_evidence` с `sourceType`
и `sourceId`, указывающими на породившую её сущность (item / outfit_feedback).
Trust Layer всегда может показать происхождение воспоминания.

Веса сигналов (`SIGNAL_WEIGHTS`):

| Тип evidence | Вес |
|---|---|
| `saved_preference` | 0.6 |
| `worn_frequency`, `outfit_feedback`, `negative` | 0.5 |
| `style_pattern`, `color_harmony` | 0.4 |

### 4. Противоречия

Негативный кандидат (`negative:formal`) сперва разрешается против позитивных
воспоминаний с тем же тегом (`style:formal`, `color:formal`, `context:formal`).
При совпадении на позитивное воспоминание вешается evidence типа `negative`
с флагом `data.contradiction: true` — его вклад вычитается при агрегации, и
confidence падает через обычный проход decay. Дублирующее воспоминание не
создаётся. Если конфликта нет — негативный паттерн становится собственным
воспоминанием `negative_preference`.

Важно: полярность хранится во флаге `data.contradiction`, а не в отрицательном
confidence — CHECK-ограничение `chk_memory_evidence_confidence` допускает
только [0, 1]. Знак восстанавливается в приложении (ADR-014).

### 5. Пользовательские коррекции

Воспоминание со `status = deleted` и `userCorrectedAt` (явно отклонено
пользователем) не пересоздаётся, пока не накопятся ≥ 5 свежих
поддерживающих сигналов (`USER_CORRECTION_OVERRIDE_FRESH_SIGNALS`). Сильным
набором сигналов можно переопределить коррекцию — но не одним событием.
Старая `deleted`-запись сохраняется в истории.

### 6. Decay (ADR-014)

При каждом проходе (после каждого feedback-действия) для каждого не-deleted
воспоминания confidence пересчитывается как средний вклад evidence:

```
confidence = Σ(weight × freshness(ageDays)) / количество evidence
```

Полосы свежести (LOOKSY_PRODUCT_INNOVATIONS §3.5):

| Возраст | Фактор |
|---|---|
| ≤ 30 дней | 1.0 |
| ≤ 90 дней | 0.85 |
| ≤ 180 дней | 0.7 |
| ≤ 365 дней | 0.5 |
| старше | 0.3 |

Старые воспоминания не удаляются — они демотируются через
`computeStatusFromConfidence` (confirmed → possible → emerging → fading →
dormant). Свежий сигнал возвращает воспоминание к жизни.

Подтверждённые пользователем воспоминания (`userConfirmedAt`) закреплены:
они не деградируют при активности в пределах 365 дней. Долгое бездействие
(> 365 дней без последнего сигнала) демотирует и их.

`consistency = supporting / total` — при противоречиях падает, сигнализируя
"воспоминание оспорено".

## Интеграция

- **Вход**: `FeedbackService` вызывает `triggerMemoryAutomation()` после
  каждого `recordWear / recordSave / recordSwap / recordSkip`. Синхронно,
  без очередей и воркеров (граница Phase 7). Ошибки логируются как
  `memory_automation_failed` и никогда не ломают пользовательское действие.
- **Импорт**: outfits ← recommendations односторонний. Хук строится лениво
  в `outfits/actions.ts` через `createMemoryAutomationHook()`, чтобы
  модули не были связаны циклически.
- **Выход**: `RecommendationContextService` читает воспоминания через
  `findActiveMemories` (без `deleted`) — отклонённые пользователем
  предпочтения не попадают в prompt рекомендаций.

## Idempotentность

`processSignals` безопасно вызывать на каждом feedback-действии: повторный
прогон с теми же данными даёт то же конечное состояние (дедупликация по ключу,
freshness пересчитывается из фактического возраста evidence).

## Тестирование

`src/modules/recommendations/automationService.test.ts` — 18 тестов:

- создание воспоминаний из повторяющихся сигналов;
- обязательное evidence со ссылками на источник;
- математика агрегации (пусто, свежие, aged, противоречия);
- дедупликация и накопление на существующем воспоминании;
- противоречие: негативный сигнал против позитивного воспоминания;
- уважение пользовательских коррекций и порог переопределения;
- decay: aged evidence, закрепление подтверждённых, демоция;
- безопасность при ошибках репозитория (никаких throw наружу);
- интеграция контекста (только активные воспоминания).

## Границы Phase 7

Не входит: очереди/воркеры/крон (триггер синхронный), LLM-генерация
воспоминаний, UI управления воспоминаниями, shopping/affiliates.
