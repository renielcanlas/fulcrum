import "./globals.css";

export const metadata = {title: "FULCRUM Copilot", description: "Governed financial-crime risk assessment workbench"};

export default function RootLayout({children}) {
  return <html lang="en"><body>{children}</body></html>;
}
