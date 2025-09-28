-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'SUBSCRIBER',
    "companySlug" TEXT,
    "lawyerSlug" TEXT,
    "password" TEXT,
    "companyId" TEXT,
    "bioApproved" BOOLEAN NOT NULL DEFAULT false,
    "bioApprovedBy" TEXT,
    "bioApprovedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("companySlug", "createdAt", "email", "emailVerified", "id", "image", "lawyerSlug", "name", "password", "role", "updatedAt") SELECT "companySlug", "createdAt", "email", "emailVerified", "id", "image", "lawyerSlug", "name", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
