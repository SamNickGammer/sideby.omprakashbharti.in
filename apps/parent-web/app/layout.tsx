import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Sideby Parent · Family overview",
  description:
    "A demo of your family's Sideby dashboard. No real devices connected.",
  icons: { icon: "/brand/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
