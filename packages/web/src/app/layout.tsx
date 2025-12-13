import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LabFlow - AI for Science Starter Kit',
  description: 'Accelerate your research with AI-powered workflows for drug discovery, materials science, climate, and genomics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
