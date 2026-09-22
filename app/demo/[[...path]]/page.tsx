import { WorkspaceApp } from '@/components/workspace';
export const metadata = {
  title: 'demonstração',
  robots: { index: false, follow: false },
};
export default function DemoPage() {
  return <WorkspaceApp demo />;
}
