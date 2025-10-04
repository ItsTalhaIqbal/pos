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
import Image from "next/image"
import Logo from "@/assets/images/crunchy-logo-new.png"

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
        <div className="relative flex justify-center gap-2 items-center">
          <div className="absolute inset-8 bg-gradient-to-r from-[var(--primary)]/15 via-[var(--primary)]/20 to-[var(--primary)]/15 blur-lg z-1"></div>
          <Image src={Logo} alt="Logo" className="max-md:w-10 md:w-8 lg:w-8 z-2" />
          <span className="text-2xl font-bold text-orange-600 z-2">Crunchy Bites</span>
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
