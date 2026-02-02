import { COOKIE_DOMAIN, COOKIE_SAMESITE, COOKIE_SECURE } from "../secrets";

export const cookieConfig = {
    secure: COOKIE_SECURE === 'true',
    sameSite: COOKIE_SAMESITE as 'lax' | 'strict' | 'none',
    domain: COOKIE_DOMAIN || undefined,
  };
  