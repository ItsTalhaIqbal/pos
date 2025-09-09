"use client"

import {
  ChefHat,
  Home,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  BarChart3,
  Settings,
  Receipt,
  Coffee,
  Layout,
  Grid3X3
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import Link from "next/link"
import { ModeToggle } from "./theme-toggle-button"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "POS",
    url: "/dashboard/pos",
    icon: ShoppingCart,
  },
  {
    title: "Orders",
    url: "/dashboard/orders",
    icon: Receipt,
  },
  {
    title: "Menu",
    url: "/dashboard/menu",
    icon: UtensilsCrossed,
  },
  {
    title: "Categories",
    url: "/dashboard/categories",
    icon: Grid3X3,
  },
  {
    title: "Tables",
    url: "/dashboard/tables",
    icon: Layout,
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: BarChart3,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-orange-600" />
          <span className="text-lg font-bold text-orange-600">Crunchy Bites</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Restaurant Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ModeToggle />
      </SidebarFooter>
    </Sidebar>
  )
}
