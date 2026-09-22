import { RotateCcw } from 'lucide-react';
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <RotateCcw size={20} strokeWidth={2.5} />
      </span>
      retoma<span className="brand-period">.</span>
    </span>
  );
}
