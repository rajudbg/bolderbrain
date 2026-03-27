export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getServerEnv, isProduction } = await import("@/lib/env");
    const env = getServerEnv();
    if (isProduction() && !env.AUTH_SECRET) {
      throw new Error("AUTH_SECRET is required in production.");
    }
  }
}
