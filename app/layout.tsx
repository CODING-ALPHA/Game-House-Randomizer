import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Group Randomizer & Event Organizer",
  description:
    "Create events, define custom groups, and randomly assign participants with a balanced algorithm.",
  keywords: [
    "event organizer",
    "group randomizer",
    "team assignment",
    "house assignment",
    "randomizer",
  ],
  authors: [{ name: "Game House Randomizer" }],
  creator: "Game House Randomizer",
  publisher: "Game House Randomizer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
