import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';
import { AIChatbot } from './ai/AIChatbot';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop/tablet sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      {/* Mobile top nav only */}
      <MobileNav />
      <main className="flex-1 pt-14 p-4 md:pt-6 md:ml-64 md:p-6 lg:pt-8 lg:p-8">
        {children}
      </main>
      <AIChatbot />
    </div>
  );
}
