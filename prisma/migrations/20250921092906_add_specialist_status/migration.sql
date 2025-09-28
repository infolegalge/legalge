-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SpecialistProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "languages" TEXT NOT NULL DEFAULT '[]',
    "specializations" TEXT NOT NULL DEFAULT '[]',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "city" TEXT,
    "philosophy" TEXT,
    "focusAreas" TEXT,
    "representativeMatters" TEXT,
    "teachingWriting" TEXT,
    "credentials" TEXT,
    "values" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpecialistProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SpecialistProfile" ("avatarUrl", "bio", "city", "companyId", "contactEmail", "contactPhone", "createdAt", "credentials", "focusAreas", "id", "languages", "name", "philosophy", "representativeMatters", "role", "slug", "specializations", "teachingWriting", "updatedAt", "values") SELECT "avatarUrl", "bio", "city", "companyId", "contactEmail", "contactPhone", "createdAt", "credentials", "focusAreas", "id", "languages", "name", "philosophy", "representativeMatters", "role", "slug", "specializations", "teachingWriting", "updatedAt", "values" FROM "SpecialistProfile";
DROP TABLE "SpecialistProfile";
ALTER TABLE "new_SpecialistProfile" RENAME TO "SpecialistProfile";
CREATE UNIQUE INDEX "SpecialistProfile_slug_key" ON "SpecialistProfile"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
