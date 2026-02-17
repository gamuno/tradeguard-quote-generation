# Quote extraction output format

The Vellum quote-analysis prompt returns a **single JSON object** (no markdown, no code fences). Use this when wiring your Make.com workflow to the extraction output.

## Example

See **[example-quote-extraction-output.json](./example-quote-extraction-output.json)** for a full sample that validates against the response schema.

## Top-level keys (always present)

| Key | Type | Description |
|-----|------|-------------|
| `client` | object | Insured name, address, industry |
| `agent` | object | Static (Garrett / TradeGuard) |
| `carrier` | object | Carrier name, AM rating, financial strength |
| `quote` | object | Quote number, dates, validity, **and taxesAndFees** |
| `branding` | object | Static (primaryColor, logoUrl) |
| `webhook` | object | Static (url, apiKey) |
| `summaries` | object | coverageStrengths, considerations arrays |
| `policies` | array | One object per policy/coverage type |
| `comparisonMatrix` | array | Rows with coverageArea + policies (array of strings) |

## New field: `quote.taxesAndFees`

- **Type:** integer (or number in repo schema)
- **Meaning:** One number for the whole quote for taxes, fees, and miscellaneous charges. Not per-policy.
- **When missing:** Your workflow should treat as `0` (app does `Number(data?.quote?.taxesAndFees) || 0`).
- **Example:** `"taxesAndFees": 75` → $75 taxes/fees for the quote.

**Workflow adjustments:**

1. When writing the extracted JSON to GitHub (or wherever the presentation loads it), keep `quote.taxesAndFees` in the payload. Do not strip it.
2. If you validate against a schema, ensure `quote` allows an optional `taxesAndFees` (integer ≥ 0).
3. The presentation app computes **Total Annual Premium** as:  
   `sum(policy.premium) + quote.taxesAndFees`  
   and uses that for the header, Investment Summary total, and ePay amount.

## Quote object shape (minimal)

```json
"quote": {
  "number": "string",
  "date": "YYYY-MM-DD or string",
  "validity": "string",
  "effectiveDate": "string",
  "expirationDate": "string",
  "taxesAndFees": 0
}
```

`taxesAndFees` is optional in the schema; if the model omits it, the app defaults to 0.

## Policies array

Each element has: `id`, `name`, `shortName`, `description`, `fullDescription`, `icon`, `color`, `premium` (integer), `paymentOptions`, `limits`, `deductibles`, `keyFeatures`, `coverageExamples`. Structure is unchanged from before; only the root `quote` object gained `taxesAndFees`.
