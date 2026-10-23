import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://sideby.omprakashbharti.in"),
  title: "Sideby — A little closer, even online.",
  description:
    "A calmer space for family life online. Meet Sideby Parent and the upcoming Sideby Connect Android companion.",
  alternates: { canonical: "/" },
  icons: { icon: "/brand/favicon.svg" },
  openGraph: {
    title: "Sideby — A little closer, even online.",
    description:
      "Connected families. Healthy habits. Explore what Sideby can do today and what we’re building next.",
    type: "website",
    url: "/",
  },
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
