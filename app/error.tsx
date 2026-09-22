'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty error-page">
      <h1>algo interrompeu a conversa.</h1>
      <p>seus dados salvos continuam seguros. tente carregar de novo.</p>
      <Button onClick={reset}>tentar novamente</Button>
    </main>
  );
}
