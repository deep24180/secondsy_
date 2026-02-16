// src/app/layout.tsx
import { UserProvider } from "../context/user-context";
import { SearchProvider } from "../context/search-context";
import "./globals.css";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

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
          <SearchProvider>
            <Header />
            {children}
            <Footer />
          </SearchProvider>
        </UserProvider>
      </body>
    </html>
  );
}
