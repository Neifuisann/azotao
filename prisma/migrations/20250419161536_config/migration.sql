/*
  Warnings:

  - You are about to drop the column `content` on the `Test` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Test" DROP COLUMN "content",
ADD COLUMN     "accessTimeFrom" TIMESTAMP(3),
ADD COLUMN     "accessTimeTo" TIMESTAMP(3),
ADD COLUMN     "addHeaderInfo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowedStudents" TEXT,
ADD COLUMN     "allowedTakers" TEXT,
ADD COLUMN     "configType" TEXT,
ADD COLUMN     "examPassword" TEXT,
ADD COLUMN     "headerInfo" TEXT,
ADD COLUMN     "pointToShowAnswer" INTEGER,
ADD COLUMN     "questionAnswerMixed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showCorrectAnswerOption" TEXT,
ADD COLUMN     "showPoint" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shuffleQuestionAnswers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "submittedTimes" INTEGER,
ADD COLUMN     "testDuration" INTEGER;
