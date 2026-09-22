import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="empty error-page">
      <h1>essa página não está por aqui.</h1>
      <Link href="/">voltar ao início</Link>
    </main>
  );
}
