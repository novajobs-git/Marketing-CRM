-- Auth migration Phase 1: users.id becomes the Clerk user id (assigned explicitly
-- by application code / the Clerk webhook, no DB-level default was ever generated
-- for it — @default(cuid()) was Prisma-client-side only, see init migration). Clerk
-- owns credentials now, so passwordHash is dropped.
ALTER TABLE "users" DROP COLUMN "passwordHash";
