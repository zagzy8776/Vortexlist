import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VortexList — Global numbers, proxies and eSIM access",
  description:
    "A fast digital marketplace for global phone numbers, private proxy access, secure wallet funding and future eSIM plans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#07111F] text-slate-100">
        {children}
      </body>
    </html>
  );
}
