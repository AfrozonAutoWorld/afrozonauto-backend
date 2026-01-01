import type { Prisma } from '../generated/prisma/client';

type PrismaUser = Prisma.UserGetPayload<{
  include: {
    profile: true;
  };
}>;

declare global {
  namespace Express {
    interface User extends PrismaUser {}

    interface Request {
      user?: PrismaUser;
    }
  }
}

export {};
