-- AlterTable
ALTER TABLE "Company" ADD COLUMN "metaDescription" TEXT;
ALTER TABLE "Company" ADD COLUMN "metaTitle" TEXT;
ALTER TABLE "Company" ADD COLUMN "ogDescription" TEXT;
ALTER TABLE "Company" ADD COLUMN "ogTitle" TEXT;

-- AlterTable
ALTER TABLE "CompanyTranslation" ADD COLUMN "ogDescription" TEXT;
ALTER TABLE "CompanyTranslation" ADD COLUMN "ogTitle" TEXT;

-- AlterTable
ALTER TABLE "PracticeAreaTranslation" ADD COLUMN "ogDescription" TEXT;
ALTER TABLE "PracticeAreaTranslation" ADD COLUMN "ogTitle" TEXT;

-- AlterTable
ALTER TABLE "ServiceTranslation" ADD COLUMN "ogDescription" TEXT;
ALTER TABLE "ServiceTranslation" ADD COLUMN "ogTitle" TEXT;

-- AlterTable
ALTER TABLE "SpecialistProfileTranslation" ADD COLUMN "ogDescription" TEXT;
ALTER TABLE "SpecialistProfileTranslation" ADD COLUMN "ogTitle" TEXT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "ogDescription" TEXT;
ALTER TABLE "Post" ADD COLUMN "ogTitle" TEXT;

-- AlterTable
ALTER TABLE "PostTranslation" ADD COLUMN "ogDescription" TEXT;
ALTER TABLE "PostTranslation" ADD COLUMN "ogTitle" TEXT;

-- AlterTable
ALTER TABLE "LegalPageTranslation" ADD COLUMN "ogDescription" TEXT;
ALTER TABLE "LegalPageTranslation" ADD COLUMN "ogTitle" TEXT;
