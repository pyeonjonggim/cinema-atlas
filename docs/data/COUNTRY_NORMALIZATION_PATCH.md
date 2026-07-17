# Canonical Country Normalization Patch

## Purpose

Country records imported from external metadata can carry ISO-style display labels such as `BR`, `DE`, `FR`, `JP`, `KR`, and `US`. Those values are valid internal identifiers, but they are not acceptable user-facing country names.

This patch keeps ISO codes as internal identifiers and moves user-facing country labels into the Canonical Query projection.

## Rules

- ISO code stays internal.
- UI reads `name` / `displayName`, never the raw ISO label.
- Country projection owns display normalization.
- Page components only render the projected display fields.
- English is the only product UI language for this phase.

## Normalized Countries

| ISO | Display Name | Slug |
| --- | --- | --- |
| BR | Brazil | brazil |
| CN | China | china |
| DE | Germany | germany |
| FR | France | france |
| GB | United Kingdom | united-kingdom |
| HK | Hong Kong | hong-kong |
| IT | Italy | italy |
| JP | Japan | japan |
| KR | South Korea | korea |
| TW | Taiwan | taiwan |
| US | United States | united-states |

## Projection Fields

The Country Query projection now returns:

- `slug`
- `name`
- `displayName`
- `isoCode`
- `flag`
- `region`
- `representativeEra`
- `knownFor`
- `description`
- `whyMatters`
- `characteristics`
- `themes`

`name` remains for existing UI compatibility. `displayName` is the canonical display name.

## English UI Patch

Visible Korean or corrupted legacy strings were removed from active UI paths in `app`, `components`, and `lib`. Legacy localized data fields remain only as compatibility fields where they are not used as canonical display copy.

## Verification

Run:

```bash
npm run verify:country-normalization
npm run lint
npx tsc --noEmit
npm run validate:data
npm run build
```
