import type { Metadata } from 'next';
import './globals.css';
import { getSessionUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'QPMS - Secure Question Paper Management System',
  description: 'Zero-Trust Secure Cloud-Based Competitive Examination Question Paper Management System',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen text-slate-900 font-sans antialiased flex flex-col">
        <Navbar user={user} />
        <div className="flex flex-1 max-w-7xl w-full mx-auto">
          {user && <Sidebar userRole={user.role} />}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
