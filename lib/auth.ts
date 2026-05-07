import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/lib/db";
import { logPipelineEvent } from "@/lib/logging";
import { ensureSeededUser } from "@/lib/seed";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const seededUser = await ensureSeededUser();
        const username = credentials.username?.toString().trim();
        const password = credentials.password?.toString() ?? "";
        const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

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
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.id = user.id;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }

      return session;
    },
    signIn: async ({ user }) => {
      if (!user.id) {
        return false;
      }

      const existing = await db.user.findUnique({
        where: { id: user.id },
        select: {
          loginCount: true,
        },
      });

      if (!existing) {
        return false;
      }

      const now = new Date();
      await db.user.update({
        where: { id: user.id },
        data: {
          loginCount: {
            increment: 1,
          },
          firstLoginAt: existing.loginCount === 0 ? now : undefined,
          lastLoginAt: now,
        },
      });

      return true;
    },
  },
});
