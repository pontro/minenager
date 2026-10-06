import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Minenager — Build it. Own it. | The Modern Minecraft Server Desktop App",
  description:
    "The 100% free Minecraft server desktop app. Create custom modded servers in seconds and play with friends with zero port forwarding required.",
  keywords: [
    "minecraft server",
    "minecraft server desktop app",
    "modrinth",
    "curseforge",
    "minecraft server maker",
    "zero port forwarding",
    "free minecraft server app",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} scroll-smooth`}>
      <body className="min-h-screen flex flex-col selection:bg-cyan-500 selection:text-black antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
