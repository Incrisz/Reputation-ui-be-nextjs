import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AdminShell from './components/AdminShell';

export const metadata: Metadata = {
  title: 'Admin | BizReputation AI',
  description: 'Admin portal for user, plans, and audit oversight.',
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminShell>{children}</AdminShell>;
}
