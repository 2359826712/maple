# Phase 2E Backend Preparation

Phase 2E prepares the backend independently from the local model server. It does not add
or change database tables and does not introduce a cloud translation provider.

## Provider boundary

`LocalizationProvider` accepts structured fields and returns structured fields plus
runtime metadata. The local adapter is configured only through server-side environment
variables:

```text
LOCAL_MODEL_PROVIDER
LOCAL_MODEL_TRANSPORT=mock|openai
LOCAL_MODEL_API_URL
LOCAL_MODEL_API_KEY
MODEL_NAME
MODEL_VERSION
LOCAL_MODEL_TIMEOUT_MS
LOCAL_MODEL_PUBLISHABLE=false
```

Mock is the default transport. It is deterministic and makes no network request.

Production queue ownership remains with `LocalizationWorker-repair.exe`. The website
Node CLI rejects every `--apply` invocation before connecting to PostgreSQL, regardless
of environment variables. This prevents duplicate claims, lock contention, duplicate
translation, and model-version drift.

## llama.cpp OpenAI-compatible adapter

The adapter calls `/v1/chat/completions`. It does not use the former custom top-level
`translated_fields` HTTP protocol. The HTTP request follows the OpenAI-compatible shape:

```json
{
  "model": "configured-at-runtime",
  "temperature": 0,
  "stream": false,
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "maplestory_localization",
      "strict": true,
      "schema": {}
    }
  },
  "messages": [
    { "role": "system", "content": "Translation and preservation rules" },
    {
      "role": "user",
      "content": "{\"fields\":{...},\"glossary\":[...]}"
    }
  ]
}
```

The localized fields are strict JSON inside `choices[0].message.content`:

```json
{
  "model": "configured-at-runtime",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "{\"translated_fields\":{\"title\":\"Localized title\",\"summary\":\"Localized summary\"}}"
      }
    }
  ],
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

The adapter records provider, transport, model, model version, latency, usage, glossary
version, and quality checks in existing Worker metadata columns. No model-specific
database schema is required.

Current verified model-server identity:

```text
protocol: OpenAI-compatible llama.cpp server
local URL: http://127.0.0.1:8990/v1/chat/completions
LAN URL: http://192.168.3.43:8990/v1/chat/completions
model: maplestory-qwen2.5-7b-q4_k_m
version: Qwen2.5-7B-Instruct-GGUF-Q4_K_M
```

The API key remains outside this repository. Its operator-managed source is
`D:\LocalizationAI\secrets\api-key.txt`; inject the value through a secret environment
variable for a future isolated adapter test. Never commit the key.

Do not run `npm run localization:worker` against the production queue while the EXE
Worker is active. Adapter development is limited to mocked HTTP unit tests until a
separate isolated preview is scheduled.

The production model process remains:

```powershell
cd C:\Users\Administrator\Desktop\maple_localization
.\LocalizationWorker-repair.exe run
```

## Website boundary

The website reads current `automatic` or `approved` rows from
`series_content_translations`. If no current row exists, the content API returns the
original `series_content` fields with `localization_kind=source`. The legacy realtime
`POST /api/translations` endpoint returns HTTP 410 and never calls a provider.
