# Practice Areas & Service Translation Rules

## Overview
- Practice areas group related services (e.g., Corporate, Disputes, Technology).
- Each practice area and service supports localized content via translation models.
- Services appear on `/[locale]/services/[slug]` with locale-aware slugs.

## Data Model
- `PracticeArea`: base fields (title, slug, description, icon, order).
- `PracticeAreaTranslation`: localized title/slug/description (`@@unique([practiceAreaId, locale])`).
- `Service`: base fields (title, slug, description, meta, hero image, practiceArea relation).
- `ServiceTranslation`: localized title/slug/description/meta, hero image alt.
- `Service` ↔ `PracticeArea`: many-to-one (each service belongs to one practice area).

## Translation Rules
- Base locale: Georgian (`ka`).
- Localized slugs stored in `ServiceTranslation.slug`; ensure uniqueness per locale.
- Locale switch uses `/api/slugs/services?slug=<current>&from=<currentLocale>&to=<targetLocale>` to resolve translated slug.
- When creating/editing services, provide localized title, description, SEO fields (meta title/description), hero image alt.
- Fallback: if translation missing, use base (KA) values.

## Editing Workflow
- Admin dashboard: service editor with locale tabs (KA/EN/RU) using RichEditor for description.
- Ensure slug autogeneration and manual override per locale.
- Save translations via nested Prisma writes (`service.translations.upsert`).

## Frontend Rendering
- Service detail fetches base service + translation for current locale.
- Practice area page lists services with translated titles/excerpts.
- Locale switch updates slug via `/api/slugs/services` before navigation.

## Guardrails
- Prevent duplicate slugs in the same locale.
- When renaming service, update translations or autogenerate new slugs.
- If practice area slug changes, update practice area translations and revalidate caches.


## Snapshot: Practice Areas and Services (pre-migration)

The following is an extracted snapshot from `data/normalized.practice-areas.json` to preserve current practice areas and their service slugs before database reset/migrations.

```json
[
  {
    "id": "practice_migration-to-georgia",
    "slug": "migration-to-georgia",
    "title": "Migration to Georgia",
    "services": [
      "visa-residency-applications",
      "citizenship-acquisition",
      "work-permits",
      "business-investment-migration",
      "family-reunification",
      "property-for-foreigners",
      "tax-financial-planning",
      "document-legalization",
      "migration-disputes-appeals",
      "translation-interpretation",
      "immigration-compliance",
      "digital-nomad-visas"
    ]
  },
  {
    "id": "practice_labor-law",
    "slug": "labor-law",
    "title": "Labor Law",
    "services": [
      "employment-contracts",
      "workplace-policies",
      "dispute-resolution",
      "union-relations",
      "workplace-investigations",
      "health-safety-compliance",
      "employee-compensation",
      "hr-legal-training",
      "diversity-inclusion",
      "termination-redundancy",
      "foreign-worker-law",
      "labor-risk-strategy",
      "employment-law-in-m-a",
      "trade-secret-litigation"
    ]
  },
  {
    "id": "practice_legallaunch-for-startups",
    "slug": "legallaunch-for-startups",
    "title": "Legallaunch for Startups",
    "services": [
      "business-formation",
      "ip-protection",
      "contract-drafting",
      "hr-legal-advisory",
      "startup-financing",
      "regulatory-compliance",
      "corporate-governance",
      "risk-management",
      "startup-tax-planning",
      "startup-m-a",
      "exit-planning",
      "startup-disputes",
      "reorganization-support",
      "shareholder-disputes"
    ]
  },
  {
    "id": "practice_crypto-law",
    "slug": "crypto-law",
    "title": "Crypto Law",
    "services": [
      "crypto-compliance",
      "token-offerings",
      "dao-governance",
      "crypto-tax",
      "aml-kyc-for-crypto",
      "smart-contracts-legal-review",
      "crypto-dispute-resolution",
      "crypto-ip",
      "crypto-cybersecurity",
      "crypto-licensing",
      "asset-recovery",
      "cross-border-crypto",
      "crypto-m-a",
      "regulatory-advocacy",
      "crypto-estate-planning",
      "defi-risk-advisory",
      "tokenization",
      "ssi-legal-frameworks",
      "ai-blockchain-law"
    ]
  },
  {
    "id": "practice_corporate-governance-and-business-compliance",
    "slug": "corporate-governance-and-business-compliance",
    "title": "Corporate Governance and Business Compliance",
    "services": [
      "governance-frameworks",
      "board-advisory",
      "shareholder-rights",
      "compliance-risk",
      "ethics-anti-corruption",
      "csr-compliance",
      "compliance-audits",
      "privacy-compliance",
      "whistleblower-law",
      "executive-compensation",
      "corporate-restructuring",
      "corporate-reporting",
      "governance-training",
      "governance-disputes"
    ]
  },
  {
    "id": "practice_licenses",
    "slug": "licenses",
    "title": "Licenses",
    "services": [
      "business-licensing",
      "professional-licensing",
      "ip-licensing",
      "alcohol-tobacco",
      "environmental-health",
      "telecom-licensing",
      "import-export-licensing",
      "food-beverage",
      "real-estate-construction",
      "energy-licensing",
      "gaming-licensing",
      "financial-services",
      "logistics-licensing",
      "license-monitoring"
    ]
  },
  {
    "id": "practice_permits",
    "slug": "permits",
    "title": "Permits",
    "services": [
      "building-permits",
      "environmental-permits",
      "occupational-permits",
      "event-permits",
      "health-safety-permits",
      "signage-permits",
      "liquor-tobacco-permits",
      "transport-permits",
      "fire-occupancy-permits",
      "zoning-permits",
      "filming-permits",
      "utility-permits",
      "telecom-infrastructure-permits",
      "emergency-permits"
    ]
  },
  {
    "id": "practice_tax-and-accounting",
    "slug": "tax-and-accounting",
    "title": "Tax and Accounting",
    "services": [
      "tax-planning",
      "tax-filing",
      "tax-audits",
      "corporate-tax",
      "international-tax",
      "indirect-tax",
      "sme-tax-structuring",
      "estate-planning",
      "payroll-tax",
      "accounting-services",
      "financial-reporting",
      "m-a-tax",
      "wealth-tax",
      "vat-health-checks"
    ]
  },
  {
    "id": "practice_banks-and-finances",
    "slug": "banks-and-finances",
    "title": "Banks and Finances",
    "services": [
      "loan-agreements",
      "asset-management",
      "aml-compliance",
      "securities-law",
      "fintech-law",
      "derivatives",
      "cross-border-finance",
      "private-banking",
      "payments-e-money",
      "banking-disputes",
      "bank-compliance-audits"
    ]
  },
  {
    "id": "practice_ip-trademark-inventions",
    "slug": "ip-trademark-inventions",
    "title": "IP, Trademark, Inventions",
    "services": [
      "ip-strategy",
      "trademark-registration",
      "patent-filing",
      "copyright-protection",
      "trade-secrets",
      "ip-licensing",
      "invention-assessments",
      "ip-due-diligence",
      "brand-protection",
      "ip-litigation",
      "counterfeit-defense",
      "software-licensing",
      "ip-monetization",
      "customs-ip-enforcement",
      "ip-training"
    ]
  },
  {
    "id": "practice_personal-data-protection",
    "slug": "personal-data-protection",
    "title": "Personal Data Protection",
    "services": [
      "data-compliance",
      "data-subject-rights",
      "data-breach-response",
      "dpo-support",
      "employee-data",
      "cross-border-transfers",
      "sectoral-compliance",
      "regulatory-defense"
    ]
  },
  {
    "id": "practice_property-law",
    "slug": "property-law",
    "title": "Property Law",
    "services": [
      "real-estate-sales",
      "lease-agreements",
      "title-registration",
      "construction-law",
      "mortgages",
      "agricultural-land",
      "property-tax-planning"
    ]
  },
  {
    "id": "practice_honor-reputation-protection",
    "slug": "honor-reputation-protection",
    "title": "Honor & Reputation Protection",
    "services": [
      "defamation-cases",
      "online-reputation",
      "media-compliance",
      "business-reputation",
      "right-of-reply",
      "false-accusation-defense",
      "public-figure-protection"
    ]
  },
  {
    "id": "practice_international-law",
    "slug": "international-law",
    "title": "International Law",
    "services": [
      "cross-border-contracts",
      "international-investment",
      "treaty-law",
      "international-arbitration",
      "human-rights-law",
      "jurisdiction-conflicts",
      "extradition-mlats"
    ]
  },
  {
    "id": "practice_litigation-and-dispute-resolution",
    "slug": "litigation-and-dispute-resolution",
    "title": "Litigation and Dispute Resolution",
    "services": [
      "civil-litigation",
      "arbitration",
      "administrative-litigation",
      "corporate-disputes",
      "judgment-enforcement",
      "appeals",
      "injunctions"
    ]
  },
  {
    "id": "practice_family-law",
    "slug": "family-law",
    "title": "Family Law",
    "services": [
      "divorce-separation",
      "child-custody",
      "alimony",
      "prenuptial-agreements",
      "adoption",
      "surrogacy",
      "domestic-violence",
      "cross-border-family-disputes",
      "asset-division",
      "family-mediation"
    ]
  },
  {
    "id": "practice_criminal-defense-and-white-collar-crime",
    "slug": "criminal-defense-and-white-collar-crime",
    "title": "Criminal Defense and White-Collar Crime",
    "services": [
      "fraud-financial-crimes",
      "cybercrime-defense",
      "tax-crimes",
      "pre-trial-defense",
      "white-collar-compliance",
      "bribery-corruption",
      "plea-bargaining",
      "criminal-appeals",
      "executive-defense",
      "risk-prevention"
    ]
  },
  {
    "id": "practice_environmental-and-energy-law",
    "slug": "environmental-and-energy-law",
    "title": "Environmental and Energy Law",
    "services": [
      "environmental-permits",
      "energy-project-advisory",
      "mining-resources",
      "water-law",
      "environmental-litigation",
      "carbon-trading",
      "esg-compliance",
      "environmental-hearings",
      "eu-green-deal"
    ]
  },
  {
    "id": "practice_healthcare-and-pharmaceutical-law",
    "slug": "healthcare-and-pharmaceutical-law",
    "title": "Healthcare and Pharmaceutical Law",
    "services": [
      "medical-licensing",
      "patient-rights",
      "malpractice-defense",
      "clinical-trials",
      "pharma-labeling",
      "health-data-privacy",
      "telemedicine",
      "pharmacy-licensing",
      "health-startup-structuring",
      "insurance-regulation"
    ]
  },
  {
    "id": "practice_sports-media-entertainment-law",
    "slug": "sports-media-entertainment-law",
    "title": "Sports, Media & Entertainment Law",
    "services": [
      "athlete-contracts",
      "sponsorships",
      "media-licensing",
      "event-law",
      "copyrights-for-creatives",
      "content-distribution",
      "talent-agreements",
      "online-content-takedowns",
      "influencer-law",
      "reputation-litigation"
    ]
  },
  {
    "id": "practice_aviation-and-maritime-law",
    "slug": "aviation-and-maritime-law",
    "title": "Aviation and Maritime Law",
    "services": [
      "aircraft-vessel-registration",
      "aviation-licensing",
      "shipping-law",
      "port-regulation",
      "passenger-rights",
      "maritime-crew-law",
      "charter-agreements",
      "international-maritime-law",
      "aviation-safety",
      "aviation-compliance"
    ]
  },
  {
    "id": "practice_technology-and-ai-law",
    "slug": "technology-and-ai-law",
    "title": "Technology and AI Law",
    "services": [
      "ai-ethics",
      "ai-liability",
      "software-agreements",
      "ai-generated-ip",
      "biometric-compliance",
      "robot-drone-law",
      "ai-labor-law",
      "privacy-in-ai",
      "ai-litigation",
      "eu-ai-act-compliance"
    ]
  },
  {
    "id": "practice_education-law",
    "slug": "education-law",
    "title": "Education Law",
    "services": [
      "school-licensing",
      "teacher-law",
      "student-rights",
      "academic-discipline",
      "curriculum-law",
      "special-education-compliance",
      "edtech-compliance",
      "foreign-school-advisory",
      "education-ppps",
      "cross-border-accreditation"
    ]
  },
  {
    "id": "practice_non-profit-and-ngo-law",
    "slug": "non-profit-and-ngo-law",
    "title": "Non-Profit and NGO Law",
    "services": [
      "ngo-formation",
      "bylaws-governance",
      "tax-exemption",
      "grant-compliance",
      "ngo-defense",
      "humanitarian-law",
      "international-ngo-support",
      "ngo-employment",
      "strategic-litigation",
      "transparency-advisory"
    ]
  },
  {
    "id": "practice_military-and-national-security-law",
    "slug": "military-and-national-security-law",
    "title": "Military and National Security Law",
    "services": [
      "military-service-law",
      "defense-contracts",
      "emergency-law",
      "national-security-clearance",
      "cybersecurity-defense",
      "sanctions-law",
      "ihl-geneva-convention",
      "personnel-rights",
      "export-control",
      "military-tribunals"
    ]
  }
]
```


## Localized Names Snapshot (EN/KA/RU)

This table-style JSON mirrors `data/compiled.services.i18n.json` for quick offline reference to names and slugs in all three locales.

```json
{ "practices": [
  {
    "slug": "aviation-and-maritime-law",
    "en": "Aviation and Maritime Law",
    "ka": "ავიაციის და საზღვაო სამართალი",
    "ru": "Авиационное и морское право",
    "services": [
      { "slug": "aircraft-vessel-registration", "en": "Aircraft/Vessel Registration", "ka": "საჰაერო/საზღვაო ხომალდის რეგისტრაცია", "ru": "Регистрация воздушных/морских судов" },
      { "slug": "aviation-compliance", "en": "Aviation Compliance", "ka": "საავიაციო შესაბამისობა", "ru": "Соответствие авиационным нормам" },
      { "slug": "aviation-licensing", "en": "Aviation Licensing", "ka": "საავიაციო ლიცენზირება", "ru": "Лицензирование в авиации" },
      { "slug": "aviation-safety", "en": "Aviation Safety", "ka": "საავიაციო უსაფრთხოება", "ru": "Безопасность полетов" },
      { "slug": "charter-agreements", "en": "Charter Agreements", "ka": "ჩარტერული ხელშეკრულებები", "ru": "Договоры фрахтования" },
      { "slug": "international-maritime-law", "en": "International Maritime Law", "ka": "საერთაშორისო საზღვაო სამართალი", "ru": "Международное морское право" },
      { "slug": "maritime-crew-law", "en": "Maritime Crew Law", "ka": "საზღვაო ეკიპაჟის სამართალი", "ru": "Право, регулирующее труд моряков" },
      { "slug": "passenger-rights", "en": "Passenger Rights", "ka": "მგზავრთა უფლებები", "ru": "Права пассажиров" },
      { "slug": "port-regulation", "en": "Port Regulation", "ka": "საპორტო რეგულაციები", "ru": "Портовое регулирование" },
      { "slug": "shipping-law", "en": "Shipping Law", "ka": "საზღვაო გადაზიდვების სამართალი", "ru": "Морское право" }
    ]
  },
  { "slug": "banks-and-finances", "en": "Banks and Finances", "ka": "ბანკები და ფინანსები", "ru": "Банки и финансы", "services": [
      { "slug": "aml-compliance", "en": "AML Compliance", "ka": "AML-თან შესაბამისობა", "ru": "Соблюдение законодательства по борьбе с отмыванием денег (ПОД)" },
      { "slug": "asset-management", "en": "Asset Management", "ka": "აქტივების მართვა", "ru": "Управление активами" },
      { "slug": "bank-compliance-audits", "en": "Bank Compliance Audits", "ka": "საბანკო შესაბამისობის აუდიტი", "ru": "Комплаенс-аудиты банков" },
      { "slug": "banking-disputes", "en": "Banking Disputes", "ka": "საბანკო დავები", "ru": "Банковские споры" },
      { "slug": "cross-border-finance", "en": "Cross-Border Finance", "ka": "ტრანსსასაზღვრო დაფინანსება", "ru": "Трансграничное финансирование" },
      { "slug": "derivatives", "en": "Derivatives", "ka": "დერივატივები", "ru": "Деривативы" },
      { "slug": "fintech-law", "en": "Fintech Law", "ka": "ფინტექის სამართალი", "ru": "Право в сфере финансовых технологий (Fintech)" },
      { "slug": "loan-agreements", "en": "Loan Agreements", "ka": "სასესხო ხელშეკრულებები", "ru": "Кредитные договоры" },
      { "slug": "payments-e-money", "en": "Payments & E-Money", "ka": "გადახდები და ელექტრონული ფული", "ru": "Платежи и электронные деньги" },
      { "slug": "private-banking", "en": "Private Banking", "ka": "კერძო საბანკო მომსახურება", "ru": "Частное банковское обслуживание" },
      { "slug": "securities-law", "en": "Securities Law", "ka": "ფასიანი ქაღალდების სამართალი", "ru": "Право ценных бумаг" }
  ]}
  /* truncated: full localized list matches data/compiled.services.i18n.json */
] }
```

For the complete list, refer to `data/compiled.services.i18n.json`. This section confirms KA and RU names exist for each practice and service and preserves the mapping for quick manual lookup.


