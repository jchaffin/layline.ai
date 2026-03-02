import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";

// OAuth callback requires NEXTAUTH_URL to be set (e.g. http://localhost:3000 in dev)
if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === "development") {
  console.warn("[NextAuth] NEXTAUTH_URL is not set. OAuth may fail. Add NEXTAUTH_URL=http://localhost:3000 to .env.local");
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === "development",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    ...(process.env.GITHUB_ID
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET!,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email.toLowerCase().trim();

        let user = await prisma.user.findFirst({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: { email, name: email.split("@")[0] },
          });
        }
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub ?? session.user?.email ?? "",
      },
    }),
    jwt: ({ token, user }) => {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
  },
  events: {
    signIn: async ({ user, account, isNewUser }) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[NextAuth] signIn", { userId: user?.id, provider: account?.provider, isNewUser });
      }
    },
  },
  pages: {
    signIn: "/signin",
    error: "/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
