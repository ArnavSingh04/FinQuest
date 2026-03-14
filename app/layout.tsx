import type { Metadata, Viewport } from "next";

import { Navbar } from "@/components/ui/Navbar";

import "./globals.css";

export const metadata: Metadata = {
  title: "FinQuest",
  description:
    "A mobile-first financial literacy app that turns spending into a living 3D city.",
  applicationName: "FinQuest",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07111f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="pb-12">{children}</div>
      </body>
    </html>
  );
}
