import { Request } from 'express';
import { User, UserRole } from '../generated/prisma/client';
import { Prisma } from '../generated/prisma/client';

export type JWTPayload = {
  id: string;         
  role: UserRole;
  email: string;
};


// export interface AuthenticatedRequest extends Request {
//   user: User;
//   files?: {
//     [fieldname: string]: Express.Multer.File[];
//   };
//   params: {
//     [key: string]: string | undefined;
//   };
// }



export type UserWithProfile = Prisma.UserGetPayload<{
  include: {
    profile: true;
  };
}>;


export interface AuthenticatedRequest<
  P = Record<string, string>
> extends Request<P> {
  user: UserWithProfile;
}


export interface CloudinaryFile extends Express.Multer.File {
  buffer: Buffer;
}

export enum MailType {
  RESET = "RESET",
  CREATE = "CREATE"
}
export enum TokenType {
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  PASSWORD = "PASSWORD",
  PASSWORD_RESET_EMAIL = "PASSWORD_RESET_EMAIL",
  PASSWORD_RESET_PHONE = "PASSWORD_RESET_PHONE",
  ACCOUNT_RECOVERY = "ACCOUNT_RECOVERY",
  TRANSACTION_PIN = "TRANSACTION_PIN"
}