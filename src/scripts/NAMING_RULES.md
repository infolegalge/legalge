# Naming Rules for Practice Areas and Services

## Overview
This document outlines the naming conventions used when fetching and processing practice areas and services from Excel files.

## Excel File Structure

### Files Used:
1. **`Legal_Service_Catalog_Full.xlsx`** - Main English catalog
2. **`GEO.xlsx`** - Georgian translations
3. **`RUS.xlsx`** - Russian translations

### Excel Column Structure:
```
| Practice Area | Service |
|---------------|---------|
| Migration to Georgia | Visa & Residency Applications |
| Migration to Georgia | Citizenship Acquisition |
| Labor Law | Employment Contracts |
| ... | ... |
```

## Naming Rules

### 1. Practice Area Naming

#### **Slug Generation:**
```javascript
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
```

#### **Examples:**
- **Title**: "Migration to Georgia" → **Slug**: `migration-to-georgia`
- **Title**: "Corporate Governance & Business Compliance" → **Slug**: `corporate-governance-business-compliance`
- **Title**: "IP, Trademark, Inventions" → **Slug**: `ip-trademark-inventions`

#### **ID Generation:**
- **Format**: `practice_{slug}`
- **Example**: `practice_migration-to-georgia`

### 2. Service Naming

#### **Slug Generation:**
Same `slugify()` function as practice areas.

#### **Examples:**
- **Title**: "Visa & Residency Applications" → **Slug**: `visa-residency-applications`
- **Title**: "Business & Investment Migration" → **Slug**: `business-investment-migration`
- **Title**: "Employment Contracts" → **Slug**: `employment-contracts`

#### **ID Generation:**
- **Format**: `service_{practice-slug}_{service-slug}`
- **Example**: `service_migration-to-georgia_visa-residency-applications`

### 3. Translation Handling

#### **Multi-language Support:**
- **English**: Base language from `Legal_Service_Catalog_Full.xlsx`
- **Georgian**: From `GEO.xlsx` with same slug generation
- **Russian**: From `RUS.xlsx` with same slug generation

#### **Translation Slug Rules:**
- Initially copies English slug across all languages
- Uses same `slugify()` function for consistency
- Can be manually updated in admin panel

### 4. Special Character Handling

#### **Characters Removed:**
- `&` → removed (e.g., "Visa & Residency" → "visa-residency")
- `,` → removed (e.g., "IP, Trademark" → "ip-trademark")
- `'` → removed (e.g., "Don't" → "dont")
- `"` → removed
- Other special characters → removed

#### **Characters Converted:**
- ` ` (space) → `-` (hyphen)
- Multiple spaces → single hyphen
- Leading/trailing hyphens → removed

### 5. Database Storage

#### **Practice Areas:**
```json
{
  "id": "practice_migration-to-georgia",
  "slug": "migration-to-georgia",
  "title": "Migration to Georgia",
  "services": ["visa-residency-applications", "citizenship-acquisition", ...]
}
```

#### **Services:**
```json
{
  "id": "service_migration-to-georgia_visa-residency-applications",
  "slug": "visa-residency-applications",
  "title": "Visa & Residency Applications",
  "parentId": "practice_migration-to-georgia"
}
```

#### **Translations:**
```json
{
  "practiceAreaId": "practice_migration-to-georgia",
  "locale": "ka",
  "title": "მიგრაცია საქართველოში",
  "slug": "migration-to-georgia"
}
```

## Processing Scripts

### 1. `ingest-excel.ts`
- Reads Excel files
- Generates normalized JSON files
- Creates slug-based IDs

### 2. `seed-from-excel.ts`
- Seeds database from Excel data
- Creates practice areas and services
- Generates translations for all locales

### 3. `compile-i18n.ts`
- Processes multi-language Excel files
- Creates compiled translation files
- Maintains slug consistency across languages

## Best Practices

### 1. Consistency
- Always use the same `slugify()` function
- Maintain slug format across all languages
- Use descriptive but concise titles

### 2. Uniqueness
- Practice area slugs must be unique
- Service slugs must be unique within their practice area
- IDs must be globally unique

### 3. URL-Friendly
- Slugs are used in URLs (e.g., `/practice/migration-to-georgia`)
- Keep slugs readable and SEO-friendly
- Avoid special characters that break URLs

### 4. Admin Panel
- AutoSlug component automatically generates slugs from titles
- Manual override available for custom slugs
- Real-time slug generation with locale support

## Examples

### Complete Flow:
1. **Excel**: "Migration to Georgia" | "Visa & Residency Applications"
2. **Processing**: 
   - Practice: `migration-to-georgia`
   - Service: `visa-residency-applications`
3. **Database**:
   - Practice ID: `practice_migration-to-georgia`
   - Service ID: `service_migration-to-georgia_visa-residency-applications`
4. **URLs**: 
   - Practice: `/practice/migration-to-georgia`
   - Service: `/practice/migration-to-georgia/visa-residency-applications`

This naming system ensures consistency, SEO-friendliness, and proper multi-language support across the entire legal services platform.
