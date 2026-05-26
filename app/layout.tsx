import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WordReady",
  description: "A spelling study planner for classroom word lists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
