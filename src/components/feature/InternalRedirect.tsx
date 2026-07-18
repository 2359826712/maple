import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function InternalRedirect({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);

  return (
    <main id="main-content" className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-5 py-16 text-center">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground-950">{label}</h1>
        <p className="mt-3 text-foreground-600">This page has moved to its current MPStorys destination.</p>
        <Link className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary-600 px-5 font-semibold text-white" to={to}>
          Continue
        </Link>
      </div>
    </main>
  );
}
