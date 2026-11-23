import { db } from "@/lib/db";

/** Resolve `--email you@example.com` from the command line to an existing account. */
export async function userFromArgs(argv = process.argv.slice(2)) {
  const index = argv.indexOf("--email");
  const email = index >= 0 ? argv[index + 1]?.trim().toLowerCase() : undefined;
  if (!email) throw new Error("Pass the account to import into: --email you@example.com (sign up in the app first).");
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No account for ${email}. Sign up in the app first, then re-run.`);
  return user;
}
