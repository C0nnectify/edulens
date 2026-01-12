import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // In production, relying on NEXT_PUBLIC_* env vars can accidentally bake
  // localhost into the client bundle (especially in Docker builds).
  // Prefer the current origin at runtime.
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;