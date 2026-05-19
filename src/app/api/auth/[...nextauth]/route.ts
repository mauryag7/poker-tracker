import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }
        
        const player = await prisma.player.findUnique({
          where: { email: credentials.email }
        });
        
        if (!player) {
          throw new Error("Player not found");
        }
        
        const isPasswordValid = await bcrypt.compare(credentials.password, player.password);
        
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }
        
        return {
          id: player.id,
          email: player.email,
          name: player.name,
          role: player.role,
        };
      }
    })
  ],
  session: {
    strategy: "jwt" as any,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.player = {
          id: token.sub,
          role: token.role,
          name: session.user.name,
          email: session.user.email
        };
        delete session.user;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  }
};

const handler = NextAuth(authOptions as any);

export { handler as GET, handler as POST };
