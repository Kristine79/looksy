# LOOKSY — Recommendation Engine

## Обзор

Recommendation Engine — первый полноценный AI-пайплайн LOOKSY.
Пользовательский запрос превращается в **объяснимую рекомендацию образа**,
собранную исключительно из вещей пользователя и подкреплённую проверяемыми
фактами из его истории.

Фокус Phase 5 — **Trust Layer**: LOOKSY не просто говорит "надень это",
а объясняет "почему этот образ подходит именно тебе".

## Архитектура

```
User request (userId, query, occasion?, weather?)
        │
        ▼
RecommendationService.recommend()
        │ 1. RetrievalService.retrieve()  ── RAG: query embedding → HNSW similar items
        │    + RecommendationContextService.buildUserStyleContext() (wardrobe, profile,
        │      memories, wear history, feedback)
        ▼
   candidates = similar items (fallback: wardrobe)
        │ 2. PromptBuilder
        │    ├─ buildEvidence()   ── проверяемые факты из данных пользователя
        │    ├─ buildSystemPrompt ── роль, правила, JSON-контракт
        │    └─ buildUserPrompt   ── запрос, occasion, weather, кандидаты, профиль
        ▼
   AIProvider.generateRecommendation({ systemPrompt, userPrompt })
        │ 3. сырой JSON от LLM
        ▼
   parseRecommendationResponse()  ── zod-валидация (с 1 retry при невалидном JSON)
        │ 4. normalizeOutfit()    ── фильтр: только свои itemId, дедупликация, лимит 8
        ▼
   RecommendationResult { recommendation, items, evidence, model }
```

## Компоненты

| Компонент | Файл | Ответственность |
|---|---|---|
| `RecommendationService` | `src/modules/recommendations/services/recommendationService.ts` | Оркестрация пайплайна, product logic, retry, normalize |
| `PromptBuilder` | `src/modules/recommendations/services/promptBuilder.ts` | Сборка prompt'ов, evidence builder |
| `parseRecommendationResponse` | `src/modules/recommendations/services/validation.ts` | zod-схемы + парсинг ответа LLM |
| `RetrievalService` | `src/modules/ai/services/retrievalService.ts` | RAG-ретрив: embedding запроса + похожие вещи + контекст |
| `AIProvider` | `src/modules/ai/types.ts` | Абстракция провайдера (генерация текста) |
| `OpenAIProvider` | `src/modules/ai/providers/openai/` | OpenAI-compatible реализация |

## Trust Layer

Каждая рекомендация содержит:

- **`outfit[]`** — выбранные вещи с `reason` для каждой (почему именно эта вещь);
- **`explanation`** — `whyChosen` (почему такая комбинация), `styleMatch` (соответствие
  предпочтениям пользователя), `contextMatch` (соответствие occasion/weather/запросу);
- **`confidence`** — уверенность модели 0..1;
- **`evidence[]`** — проверяемые факты из данных пользователя, на которых LLM обязан
  основывать объяснения.

### Evidence Builder

`PromptBuilder.buildEvidence()` выводит из данных пользователя только доказуемые факты:

- предпочтительная палитра (`styleProfile.dna.colors`);
- style keywords, formality per occasion;
- самые носимые вещи (`wearCount`);
- количество сохранённых образов ("Based on your saved outfits");
- средняя оценка фидбека и распределение действий (wear/save/swap/skip);
- подтверждённые fashion memories ("Learned from your history: ...").

System prompt запрещает LLM выдумывать предпочтения и давать generic-советы:
*"Never suggest buying, or generic fashion advice"*, *"Ground every reason in the
verified evidence below"*.

### Гарантии сервисного слоя

Даже если LLM ответит некорректно, сервис не вернёт чужие вещи:

- валидация JSON zod-схемой (структура, непустые поля, confidence 0..1);
- фильтр itemId — разрешены только id из кандидатов пользователя;
- дедупликация и лимит 8 предметов;
- если модель сослалась на чужие/несуществующие вещи — `InvalidAIResponseError`.

## AI Provider Configuration

Провайдер настраивается через environment variables (никаких ключей в коде):

| Переменная | Назначение | Default |
|---|---|---|
| `AI_API_KEY` | API key (приоритет) | — |
| `OPENAI_API_KEY` | fallback-ключ | — |
| `AI_BASE_URL` | кастомный OpenAI-compatible endpoint | официальный OpenAI |
| `AI_MODEL` | модель генерации рекомендаций | `gpt-4o` |
| `AI_VISION_MODEL` | модель vision-анализа вещей | `gpt-4o-mini` |
| `AI_EMBEDDING_MODEL` | модель эмбеддингов | `text-embedding-3-small` |

Конфигурация читается в `src/modules/ai/config.ts` (`getAIProviderConfig()`)
и инжектируется в `OpenAIProvider` при конструировании. Бизнес-логика
зависит только от контракта `AIProvider` — смена провайдера не требует
изменений в `RecommendationService`.

### OpenAI-compatible endpoint

`getOpenAIClient()` создаёт клиент SDK `openai` с `baseURL` из `AI_BASE_URL`.
Любой сервис, говорящий на OpenAI API (OpenCode Go, LiteLLM, vLLM, Together,
Grok и т.д.), работает без изменений кода.

Важно: `completeChat` **не использует** `response_format: json_object`,
потому что не все OpenAI-compatible endpoint'ы его поддерживают.
Корректность JSON обеспечивается строгой инструкцией в prompt,
парсингом с допуском code-fence и одним retry.

## Контракт AIProvider (Phase 5)

```ts
interface AIProvider {
  readonly model: string;
  readonly embeddingModel: string;
  readonly visionModel: string;

  embed(request: EmbedRequest): Promise<EmbeddingResult>;
  analyzeClothingImage(request: ClothingAnalysisRequest): Promise<ClothingAnalysisWithConfidence>;
  generateRecommendation(request: GenerateRecommendationRequest): Promise<GeneratedText>;
  generateExplanation(request: GenerateExplanationRequest): Promise<GeneratedText>;
  generateOutfits(request: GenerateOutfitsRequest): Promise<GeneratedOutfit[]>; // stub (Phase 6)
}
```

- `generateRecommendation` — возвращает **сырой текст** (JSON). Валидация — в сервисе.
- `generateExplanation` — объяснение уже выбранного набора вещей (PromptBuilder.buildExplanationPrompt).
- `generateOutfits` — старый контракт, не реализован (Phase 6).

## Response Schema

```ts
{
  outfit: [{ itemId: string, reason: string }],   // 1..15, только свои вещи
  explanation: {
    whyChosen: string,     // почему эта комбинация
    styleMatch: string,    // почему это подходит стилю пользователя
    contextMatch: string,  // почему это подходит occasion/weather/запросу
  },
  confidence: number        // 0..1
}
```

## Negative Reasoning (contract/stub)

`RecommendationService.whyNotRecommended({ userId, itemId, query, ... })` —
контракт для будущей логики "почему не выбрана другая вещь" (swap reasoning,
rotation, context mismatch). Реализация — Phase 6.

## Роль в MVP

Готово для MVP:

- end-to-end пайплайн запрос → объяснимая рекомендация;
- RAG-ретрив кандидатов по семантической близости;
- Trust Layer: evidence-факты + объяснения по 3 осям;
- провайдер-независимая архитектура (OpenAI / OpenCode Go / любой compatible);
- защита от чужих вещей и невалидных ответов.

Следующие шаги:

- API-слой (routes) поверх `RecommendationService`;
- кэширование/очередь для дорогих вызовов;
- `whyNotRecommended` — item-level объяснения;
- сохранение результата как outfit (Phase 6) через `OutfitsService`.
