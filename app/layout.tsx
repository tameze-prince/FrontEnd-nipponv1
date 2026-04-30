import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { cn } from "@/lib/utils";
import Header from '@/components/shared/Header';
import InitialLocationModal from '@/components/shared/InitialLocationModal';

export const metadata: Metadata = {
  title: 'NipponHub - Produits Japonais',
  description: 'Plateforme e-commerce dédiée aux produits nippons - Manga, Anime, Collectibles & plus',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={cn("font-sans")}>
      <body className="antialiased bg-background text-foreground">
        <Header />
        <InitialLocationModal />
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
