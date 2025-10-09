-- AlterTable
ALTER TABLE "Company" ADD COLUMN "contactPrompt" TEXT;
ALTER TABLE "Company" ADD COLUMN "faq" TEXT;
ALTER TABLE "Company" ADD COLUMN "history" TEXT;
ALTER TABLE "Company" ADD COLUMN "mission" TEXT;
ALTER TABLE "Company" ADD COLUMN "socialLinks" TEXT;
ALTER TABLE "Company" ADD COLUMN "vision" TEXT;

-- AlterTable
ALTER TABLE "CompanyTranslation" ADD COLUMN "contactPrompt" TEXT;
ALTER TABLE "CompanyTranslation" ADD COLUMN "faq" TEXT;
ALTER TABLE "CompanyTranslation" ADD COLUMN "history" TEXT;
ALTER TABLE "CompanyTranslation" ADD COLUMN "mission" TEXT;
ALTER TABLE "CompanyTranslation" ADD COLUMN "vision" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PostTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    CONSTRAINT "PostTranslation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PostTranslation" ("body", "excerpt", "id", "locale", "metaDescription", "metaTitle", "ogDescription", "ogTitle", "postId", "slug", "title") SELECT "body", "excerpt", "id", "locale", "metaDescription", "metaTitle", "ogDescription", "ogTitle", "postId", "slug", "title" FROM "PostTranslation";
DROP TABLE "PostTranslation";
ALTER TABLE "new_PostTranslation" RENAME TO "PostTranslation";
CREATE UNIQUE INDEX "PostTranslation_postId_locale_key" ON "PostTranslation"("postId", "locale");
CREATE UNIQUE INDEX "PostTranslation_locale_slug_key" ON "PostTranslation"("locale", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

