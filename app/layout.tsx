import "./globals.css";

export const metadata = {
  title: "HelpDesk Live",
  description: "Realtime IT Helpdesk for office teams",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
