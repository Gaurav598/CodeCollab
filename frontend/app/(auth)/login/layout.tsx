import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — CodeCollab",
  description: "Sign in to CodeCollab to start collaborating in real time.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
