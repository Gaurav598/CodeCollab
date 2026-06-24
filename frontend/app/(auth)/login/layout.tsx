import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — CollabCode",
  description: "Sign in to CollabCode to start collaborating in real time.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
