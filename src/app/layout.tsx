import type { Metadata } from "next";
import type { ReactNode } from "react";
import WorkspacePersistenceBoundary from "@/components/WorkspacePersistenceBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Code Editor",
  description: "Local-first AI powered code editor with reviewed workspace boundaries",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WorkspacePersistenceBoundary>
          {children}
        </WorkspacePersistenceBoundary>
      </body>
    </html>
  );
}
