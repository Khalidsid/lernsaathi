import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { db } from "@/lib/db";
import { logPipelineEvent } from "@/lib/logging";
import { ensureSeededUser } from "@/lib/seed";

function getAllowlistedGoogleEmails() {
  return (process.env.GOOGLE_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function isGoogleProviderEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

function shouldEnableCredentialsFallback() {
  return (process.env.AUTH_ENABLE_CREDENTIALS_FALLBACK ?? "true").toLowerCase() !== "false";
}

async function recordSuccessfulLogin(userId: string) {
  const existing = await db.user.findUnique({
    where: { id: userId },
    select: {
      loginCount: true,
    },
  });

  if (!existing) {
    return false;
  }

  const now = new Date();
  await db.user.update({
    where: { id: userId },
    data: {
      loginCount: {
        increment: 1,
      },
      firstLoginAt: existing.loginCount === 0 ? now : undefined,
      lastLoginAt: now,
    },
  });

  return true;
}

const providers = [];

if (shouldEnableCredentialsFallback()) {
  providers.push(
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const seededUser = await ensureSeededUser();
        const username = credentials.username?.toString().trim();
        const password = credentials.password?.toString() ?? "";
        const passwordHash = seededUser.passwordHash?.trim() || process.env.ADMIN_PASSWORD_HASH?.trim();

        if (!username || username !== seededUser.username) {
          logPipelineEvent("auth_authorize_rejected_username", {
            providedUsername: username ?? null,
            expectedUsername: seededUser.username,
          });
          return null;
        }

        if (!passwordHash) {
          logPipelineEvent("auth_authorize_missing_hash", {});
          return null;
        }

        const isValid = await bcrypt.compare(password, passwordHash);
        logPipelineEvent("auth_authorize_password_check", {
          username,
          hashLength: passwordHash.length,
          passwordProvided: password.length > 0,
          isValid,
        });

        if (!isValid) {
          return null;
        }

        return {
          id: seededUser.id,
          name: seededUser.username,
          email: seededUser.email,
        };
      },
    }),
  );
}

if (isGoogleProviderEnabled()) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (providers.length === 0) {
  throw new Error("No auth providers configured. Enable Google OAuth or credentials fallback.");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user?.id) {
        token.id = user.id;
      }

      if (account?.provider === "google") {
        const email = token.email?.toLowerCase();
        if (email) {
          const mapped = await db.user.findUnique({
            where: { email },
            select: { id: true },
          });
          if (mapped?.id) {
            token.id = mapped.id;
          }
        }
      }

      if (account?.provider) {
        token.authProvider = account.provider;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }

      return session;
    },
    signIn: async ({ user, account }) => {
      if (account?.provider === "google") {
        const email = user.email?.trim().toLowerCase() ?? "";
        const allowlist = getAllowlistedGoogleEmails();
        const isAllowed = email.length > 0 && allowlist.includes(email);

        if (!isAllowed) {
          logPipelineEvent("auth_google_denied_not_allowlisted", { email: email || null });
          return false;
        }

        const seededUser = await ensureSeededUser();
        await db.user.update({
          where: { id: seededUser.id },
          data: {
            email,
            authProvider: "google",
            providerAccountId: account.providerAccountId,
            allowlisted: true,
          },
        });

        return recordSuccessfulLogin(seededUser.id);
      }

      if (!user.id) {
        return false;
      }

      return recordSuccessfulLogin(user.id);
    },
  },
});
