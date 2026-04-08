import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import type { AuthProvider } from "@/types/directory";

const developmentSecret = "local-development-secret-change-me";

export function getEnabledAuthProviders(): AuthProvider[] {
  const providers: AuthProvider[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push("google");
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET ?? developmentSecret,
  pages: {
    signIn: "/",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.name = session.user.name ?? token.name ?? "Neighbor";
        session.user.email = session.user.email ?? token.email ?? "";
      }

      return session;
    },
  },
};
