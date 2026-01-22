import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boon Coach Matcher",
  description: "Internal tool for ad-hoc coach recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
