-- AlterTable
ALTER TABLE "Company" ADD COLUMN "logoAlt" TEXT;
ALTER TABLE "CompanyTranslation" ADD COLUMN "logoAlt" TEXT;
ALTER TABLE "Service" ADD COLUMN "heroImageAlt" TEXT;
ALTER TABLE "ServiceTranslation" ADD COLUMN "heroImageAlt" TEXT;
ALTER TABLE "Post" ADD COLUMN "coverImageAlt" TEXT;
ALTER TABLE "PostTranslation" ADD COLUMN "coverImageAlt" TEXT;
ALTER TABLE "SliderSlide" ADD COLUMN "lightAlt" TEXT;
ALTER TABLE "SliderSlide" ADD COLUMN "darkAlt" TEXT;

-- CreateTable
CREATE TABLE "ImageTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    CONSTRAINT "ImageTranslation_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ImageTranslation_imageId_locale_key" ON "ImageTranslation"("imageId", "locale");
