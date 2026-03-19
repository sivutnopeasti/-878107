import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pohjanmaan Viherrakennus - Työhallinta",
  description: "Työntekijöiden työhallintajärjestelmä",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <body className="bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
