import "./globals.css";

export const metadata = {
  title: "Prosecution Studio",
  description: "FER Reply & Written Submission Generator – LextriaTech",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}  
