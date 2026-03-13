import type { Metadata, Viewport } from "next";

import { NavBar } from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinQuest — Your Money, Your City",
  description: "Turn your spending habits into a living 3D city. Financial literacy made visual for teens.",
  applicationName: "FinQuest",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06101e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NavBar />
        <div className="md:pt-14">{children}</div>
      </body>
    </html>
  );
}
