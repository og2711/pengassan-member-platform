import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MemberAssistant from "@/components/MemberAssistant";
import { InstallPromptListener } from "@/components/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PENGASSAN NMDPRA - Enugu Chapter | Member Platform",
  description: "Grievance and issue tracker for PENGASSAN NMDPRA members",
  applicationName: "PENGASSAN",
  appleWebApp: {
    capable: true,
    title: "PENGASSAN",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#166534",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <MemberAssistant />
        <InstallPromptListener />
      </body>
    </html>
  );
}
