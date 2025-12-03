import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RCM Operations Analytics",
  description: "Healthcare Revenue Cycle Management Analytics Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <nav className="navbar">
            <div className="nav-brand">
              <h1>RCM Analytics</h1>
            </div>
            <ul className="nav-links">
              <li>
                <Link href="/">Overview</Link>
              </li>
              <li>
                <Link href="/denials">Denials & Revenue</Link>
              </li>
              <li>
                <Link href="/patients">Patients</Link>
              </li>
              <li>
                <Link href="/qa">QA Issues</Link>
              </li>
            </ul>
          </nav>
          <main className="main-content">{children}</main>
          <footer className="footer">
            <p>RCM Operations Analytics Dashboard - Portfolio Project</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
