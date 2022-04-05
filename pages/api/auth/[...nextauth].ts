import db from "prisma/db"; // Database
import NextAuth from "next-auth"; // Auth
import GitHubProvider from "next-auth/providers/github"; // GitHub Auth
import { PrismaAdapter } from "@next-auth/prisma-adapter"; // Auth => DB

// Types
import type { Account } from "@prisma/client";

/**
 * Refreshes GitHub access token on each login
 * @param {string} providerAccountId to update
 * @param {string} accessToken new token
 */
const updateAccessToken = async (
  providerAccountId: string,
  accessToken: string
): Promise<void> => {
  // Select account by GitHub provider id
  const selectionMetric = {
    provider_providerAccountId: {
      provider: "github",
      providerAccountId,
    },
  };

  // Check if account exists
  const account: Account | null = await db.account.findUnique({
    where: selectionMetric,
  });
  // If no account existing:
  if (!account) {
    // Return to let Prisma adapter initially process new user
    return;
  }

  await db.account.update({
    where: selectionMetric,
    data: {
      // Update access token
      access_token: accessToken,
    },
  });
};

export default NextAuth({
  // Prisma DB
  adapter: PrismaAdapter(db),
  providers: [
    // GitHub Auth
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          // Additional permissions: repo r/w
          scope: "repo,read:user,user:email",
        },
      },
    }),
  ],
  callbacks: {
    signIn: async ({ account }) => {
      // Update access token on fresh sign in
      if (account.access_token) {
        await updateAccessToken(
          account.providerAccountId,
          account.access_token
        );
      }
      return true;
    },
    session: async ({ session, user }) => {
      // Attach user id to session
      session.user.id = user.id;
      return session;
    },
  },
});
