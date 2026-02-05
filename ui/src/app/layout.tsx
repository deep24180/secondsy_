// src/app/layout.tsx
import { UserProvider } from "@/context/user-context";
import "./globals.css";
import Header from "@/components/dashboard/Header";
import Footer from "@/components/dashboard/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background-light font-display text-slate-900">
        <UserProvider>
          <Header />
          {children}
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
}
