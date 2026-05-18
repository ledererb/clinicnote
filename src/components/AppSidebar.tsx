import { User, Home, Shield, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const mainMenuItems = [
  { title: 'Főoldal', url: '/dashboard', icon: Home },
  { title: 'Páciensek', url: '/patients', icon: User },
  { title: 'Ambuláns lap (Összes)', url: '/ambulatory-charts', icon: Shield },
];

const adminMenuItems = [
  { title: 'Admin Panel', url: '/admin', icon: Shield },
];

const userMenuItems = [
  { title: 'Profil', url: '/profile', icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="z-30">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn(
          "flex flex-col py-3",
          collapsed ? "items-center px-2" : "items-start px-3"
        )}>
          <div className="relative flex items-center justify-start w-full h-7">
            <img 
              src="/MOLaiRE.svg" 
              alt="MOLaiRE" 
              className={cn(
                "absolute left-0 h-7 w-auto object-contain transition-all duration-300 ease-in-out origin-left", 
                collapsed ? "opacity-0 scale-95 invisible" : "opacity-100 scale-100 visible"
              )} 
            />
            <div 
              className={cn(
                "absolute left-0 flex select-none h-7 w-7 items-center justify-center rounded-lg primary-btn-gradient bg-primary text-primary-foreground font-bold text-black shadow-sm transition-all duration-300 ease-in-out origin-left", 
                collapsed ? "opacity-100 scale-100 visible" : "opacity-0 scale-75 invisible"
              )} 
            >
              C
            </div>
          </div>
          <div className={cn(
            "transition-all duration-300 ease-in-out origin-top-left overflow-hidden",
            collapsed ? "max-h-0 opacity-0 invisible mt-0" : "max-h-6 opacity-100 visible mt-1"
          )}>
            <span className="text-[10px] text-sidebar-foreground/80 font-medium whitespace-nowrap">
              Powered by ClinicNote
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="relative flex flex-col justify-between overflow-x-hidden pt-4 pb-2">
        <div className="relative z-10 space-y-4 px-2">
          {/* Main Menu */}
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          cn("flex items-center gap-2 rounded-md px-3 py-2 text-white sidebar-menu-gradient sidebar-menu-hover", isActive && "active")
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0 sidebar-icon-hover" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Admin Menu */}
          <SidebarGroup className="p-0 mt-4">
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          cn("flex items-center gap-2 rounded-md px-3 py-2 text-white sidebar-menu-gradient sidebar-menu-hover", isActive && "active")
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0 sidebar-icon-hover" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-white hover:bg-white/10 hover:text-white"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-white/20 text-white">U</AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="grid flex-1 text-left text-sm leading-tight text-white">
                      <span className="truncate font-semibold text-white">Demo User</span>
                      <span className="truncate text-xs text-white/80">demo@example.com</span>
                    </div>
                  )}
                  <ChevronUpIcon className="ml-auto size-4 text-white" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              >
                {userMenuItems.map((item) => (
                  <DropdownMenuItem key={item.title} asChild>
                    <NavLink to={item.url} className="flex items-center gap-2 cursor-pointer">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem className="text-red-500 hover:text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Kijelentkezés
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
