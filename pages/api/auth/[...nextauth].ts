import db from "prisma/db"; // Database
import NextAuth from "next-auth"; // Auth
import GitHubProvider from "next-auth/providers/github"; // GitHub Auth
import { PrismaAdapter } from "@next-auth/prisma-adapter"; // Auth => DB

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
    session: async ({ session, user }) => {
      // Attach user id to session
      session.user.id = user.id;
      return session;
    },
  },
});
