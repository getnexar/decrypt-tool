import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Hellix - Heading font (only weights used in the app)
const hellix = localFont({
  src: [
    {
      path: "../styles/fonts/Hellix-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../styles/fonts/Hellix-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-heading",
  display: "swap",
  preload: true,
});

// Roobert - Body font (only weights used in the app)
const roobert = localFont({
  src: [
    {
      path: "../styles/fonts/Roobert-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../styles/fonts/Roobert-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../styles/fonts/Roobert-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Decrypt Tool",
  description: "Decrypt encrypted Nexar dashcam videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${hellix.variable} ${roobert.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
