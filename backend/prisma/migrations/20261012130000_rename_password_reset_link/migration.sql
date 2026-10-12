-- Rename to match the glossary term "Password Reset Link".
ALTER TABLE "PasswordResetToken" RENAME TO "PasswordResetLink";
ALTER TABLE "PasswordResetLink" RENAME CONSTRAINT "PasswordResetToken_pkey" TO "PasswordResetLink_pkey";
ALTER TABLE "PasswordResetLink" RENAME CONSTRAINT "PasswordResetToken_userId_fkey" TO "PasswordResetLink_userId_fkey";
ALTER INDEX "PasswordResetToken_tokenHash_key" RENAME TO "PasswordResetLink_tokenHash_key";
ALTER INDEX "PasswordResetToken_userId_idx" RENAME TO "PasswordResetLink_userId_idx";
