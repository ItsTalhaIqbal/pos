"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Computer } from "lucide-react"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2 justify-center">
            {theme === "light" ? (
              <>
                <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all" />
                <span className="">{theme ? <span className="">{theme.toUpperCase()}</span> : "LIGHT"}</span>
              </>
            ) :
                theme === "dark" ? (
              <>
                <Moon className="h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <span className="">{theme ? <span className="">{theme.toUpperCase()}</span> : "DARK"}</span>
              </>
            ) :(
                <>
                    <Computer className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all" />
                    <span className="">{theme ? <span className="">{theme.toUpperCase()}</span> : "SYSTEM"}</span>
                </>
            )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
