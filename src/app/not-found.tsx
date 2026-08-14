import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found - HealthEasy-G HMS',
  description: 'The requested page could not be found.',
};

const Error = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-6xl font-extrabold text-primary">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Page Not Found</h2>
        <p className="text-sm text-slate-500">
          The hospital module page you are looking for does not exist or has been moved.
        </p>
        <Button asChild className="mt-4 font-bold">
          <Link href="/dashboard">Return to HMS Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default Error;
