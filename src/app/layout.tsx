import "./globals.css";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Suspense } from "react";
import { signOut } from "./(auth)/actions";
import PeekHost from "./attempts/peek-host";

export const metadata = { title: "LeetCode Tracker", description: "A spaced repetition tracker for LeetCode practice." };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <Link className="brand" href="/">LeetCode Tracker</Link>
            {user && (
              <>
                <div className="nav-links">
                  <Link className="nav-link" href="/">Today</Link>
                  <Link className="nav-link" href="/problems">Problems</Link>
                  <Link className="nav-link" href="/log">Log</Link>
                </div>
                <form className="nav-account" action={signOut}>
                  <span className="nav-email" title={user.email}>{user.email}</span>
                  <button className="button secondary small" type="submit">Sign out</button>
                </form>
              </>
            )}
          </div>
        </nav>
        <main className="shell">{children}</main>
        {user && <Suspense fallback={null}><PeekHost /></Suspense>}
      </body>
    </html>
  );
}
