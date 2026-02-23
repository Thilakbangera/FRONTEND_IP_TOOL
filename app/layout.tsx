import "./globals.css";

export const metadata = {
  title: "IP Drafting Studio",
  description: "Unified FER Reply + WS Generator frontend (Netlify)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
