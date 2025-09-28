/*
  Warnings:

  - You are about to drop the `LawyerProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_LawyerProfileToService` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "LawyerProfile_slug_key";

-- DropIndex
DROP INDEX "_LawyerProfileToService_B_index";

-- DropIndex
DROP INDEX "_LawyerProfileToService_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "LawyerProfile";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_LawyerProfileToService";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shortDesc" TEXT,
    "longDesc" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "mapLink" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SpecialistProfile" (
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
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpecialistProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpecialistProfileTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "specialistProfileId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "role" TEXT,
    "bio" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    CONSTRAINT "SpecialistProfileTranslation_specialistProfileId_fkey" FOREIGN KEY ("specialistProfileId") REFERENCES "SpecialistProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ServiceToSpecialistProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ServiceToSpecialistProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ServiceToSpecialistProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "SpecialistProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "publishedAt" DATETIME,
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("content", "coverImageUrl", "createdAt", "excerpt", "id", "publishedAt", "slug", "title", "updatedAt") SELECT "content", "coverImageUrl", "createdAt", "excerpt", "id", "publishedAt", "slug", "title", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialistProfile_slug_key" ON "SpecialistProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialistProfileTranslation_specialistProfileId_locale_key" ON "SpecialistProfileTranslation"("specialistProfileId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialistProfileTranslation_locale_slug_key" ON "SpecialistProfileTranslation"("locale", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "_ServiceToSpecialistProfile_AB_unique" ON "_ServiceToSpecialistProfile"("A", "B");

-- CreateIndex
CREATE INDEX "_ServiceToSpecialistProfile_B_index" ON "_ServiceToSpecialistProfile"("B");
