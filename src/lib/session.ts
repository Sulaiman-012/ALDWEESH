import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  accountId?: string;
  name?: string;
  isAdmin?: boolean;
  isTrustee?: boolean;
  isExecutive?: boolean;
  isExecutiveHead?: boolean;
}

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "change-this-secret-change-this-secret-32chars!!",
  cookieName: "dweesh_fund_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 يومًا
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
