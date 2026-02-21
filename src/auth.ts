import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';

const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google, GitHub],

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
  },

  callbacks: {
    jwt({ token, user }) {
      // On initial sign-in, determine the role from ADMIN_EMAILS
      if (user?.email) {
        token.role = adminEmails.includes(user.email.toLowerCase())
          ? 'admin'
          : 'user';
      }
      return token;
    },

    session({ session, token }) {
      // Expose role from JWT token to the session object
      if (session.user) {
        session.user.role = token.role as 'admin' | 'user';
      }
      return session;
    },
  },
});
