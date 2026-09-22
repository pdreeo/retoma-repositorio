import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: {
    default: 'retoma — pare de esquecer dinheiro no whatsapp',
    template: '%s · retoma',
  },
  description:
    'saiba quais orçamentos precisam de follow-up hoje e quanto dinheiro você recuperou. feito para estéticas automotivas.',
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
