import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionBootstrap } from "@/components/auth/SessionBootstrap";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { GlobalModals } from "@/components/ui/GlobalModals";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CollabCode — AI-Powered Developer Collaboration",
  description:
    "Real-time collaborative coding with AI assistance, CRDT-based sync, and secure execution sandboxes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <SessionBootstrap />
          {children}
          <GlobalModals />
        </ThemeProvider>
      </body>
    </html>
  );
}
