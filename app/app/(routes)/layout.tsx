import React from "react";
import Sidebar from "../../components/layout/sidebar";
import DashboardNav from "../../components/layout/dashboard-nav";

export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#f4f3f2]">
      <DashboardNav />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative bg-[#f4f3f2]">
          {children}
        </main>
      </div>
    </div>
  );
}
