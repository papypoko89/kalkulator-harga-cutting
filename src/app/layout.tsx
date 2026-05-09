import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalkulator Harga Jasa Cutting",
  description: "Kalkulator harga jasa cutting berbasis master data lokal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
