import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted text-muted-foreground">
      <aside className="w-64 bg-white p-6 shadow-md">
        <div className="font-bold text-xl mb-6 text-black">Creatomator</div>
        <nav className="space-y-4">
          <a className="block text-sm hover:text-black" href="/dashboard">Dashboard</a>
          <a className="block text-sm hover:text-black" href="#">Campaigns</a>
          <a className="block text-sm hover:text-black" href="#">Exports</a>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
