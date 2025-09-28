-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "suspendSubmissions" BOOLEAN NOT NULL DEFAULT false,
    "autoApproveSpecialists" BOOLEAN NOT NULL DEFAULT false,
    "notificationEmail" TEXT,
    "notifyOnRequest" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnPost" BOOLEAN NOT NULL DEFAULT true,
    "notifyChannel" TEXT NOT NULL DEFAULT 'EMAIL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanySettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDesc" TEXT,
    "longDesc" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    CONSTRAINT "CompanyTranslation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_companyId_key" ON "CompanySettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyTranslation_companyId_locale_key" ON "CompanyTranslation"("companyId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyTranslation_locale_slug_key" ON "CompanyTranslation"("locale", "slug");
