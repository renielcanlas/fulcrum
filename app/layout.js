import "./globals.css";

export const metadata = {
  title: "FULCRUM · Ciel",
  description: "Governed financial-crime risk assessment workbench",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
