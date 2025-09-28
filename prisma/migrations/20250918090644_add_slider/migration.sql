-- CreateTable
CREATE TABLE "SliderSlide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "lightUrl" TEXT NOT NULL,
    "darkUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
