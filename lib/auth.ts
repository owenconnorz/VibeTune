import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const isAuthConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.NEXTAUTH_SECRET

export const authOptions: NextAuthOptions = {
  providers: isAuthConfigured
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ]
    : [],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  debug: false, // Disable debug to reduce console noise
}

export const AUTH_ENABLED = isAuthConfigured
