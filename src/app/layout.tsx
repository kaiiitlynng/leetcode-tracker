import "./globals.css";
import Link from "next/link";

export const metadata = { title: "Kaitlyn’s LeetCode Tracker", description: "A local-first spaced repetition tracker." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <Link className="brand" href="/">Kaitlyn’s LeetCode Tracker</Link>
            <div className="nav-links">
              <Link className="nav-link" href="/">Problems</Link>
              <Link className="nav-link" href="/log">Log</Link>
            </div>
          </div>
        </nav>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
