import AdminLayout from '@admin/components/layout/AdminLayout';

export default function EmployeesLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
