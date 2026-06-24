import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace | CollabCode",
};

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {children}
    </div>
  );
}
