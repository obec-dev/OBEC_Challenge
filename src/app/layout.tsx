import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "./components/Nav";
import { AuthProvider } from "./contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OBEC Challenge",
  description: "Competition submission platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {/* Global Animated Background */}
          <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[var(--background)]">
             <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--primary-blue)] opacity-5 blur-3xl animate-float"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[var(--secondary-blue)] opacity-5 blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
          </div>
          <Nav />
          <main className="min-h-[calc(100vh-56px)]">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
