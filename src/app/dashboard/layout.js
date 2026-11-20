"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { LoadingProvider } from "@/components/LoadingProvider"
import { WorkPeriodProvider, WorkPeriodBar } from "@/components/work-period"

export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <WorkPeriodProvider>
          <WorkPeriodBar />
          <LoadingProvider>
            <div className="container mx-auto p-6">
              {children}
            </div>
          </LoadingProvider>
        </WorkPeriodProvider>
      </main>
    </SidebarProvider>
  )
}
