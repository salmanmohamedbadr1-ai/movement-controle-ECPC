import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
      <Link to="/">
        <Button>Back home</Button>
      </Link>
    </div>
  );
}
