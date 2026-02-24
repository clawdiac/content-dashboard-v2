import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      role: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    id?: string
  }
}

export const authOptions: NextAuthOptions = {
  // NOTE: No adapter — CredentialsProvider is incompatible with PrismaAdapter.
  // JWT strategy stores sessions in signed cookies, no DB session needed.
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        console.log("[AUTH] Password valid for", credentials.email, ":", isPasswordValid);

        if (!isPasswordValid) {
          return null
        }

        console.log("[AUTH] authorize() returning user:", user.email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("[AUTH JWT] jwt callback - user:", user ? user.email : "null", "token:", token.sub);
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role || "va"
        session.user.id = token.id || ""
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  }
}
