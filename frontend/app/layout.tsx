import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionBootstrap } from "@/components/auth/SessionBootstrap";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { GlobalModals } from "@/components/ui/GlobalModals";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ServerPing } from "@/components/ui/ServerPing";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              const originalAddEventListener = window.addEventListener;
              window.addEventListener = function(type, listener, options) {
                if (type === 'unhandledrejection') {
                  const wrappedListener = function(event) {
                    if (event.reason && typeof event.reason === 'object' && !(event.reason instanceof Error)) {
                      event.preventDefault(); // Tell browser it is handled to suppress red console logs
                      return; // Swallow Monaco worker plain object rejections silently
                    }
                    return typeof listener === 'function' ? listener.call(this, event) : listener.handleEvent(event);
                  };
                  return originalAddEventListener.call(this, type, wrappedListener, options);
                }
                return originalAddEventListener.call(this, type, listener, options);
              };
            `
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <ServerPing />
          <SessionBootstrap />
          {children}
          <GlobalModals />
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
