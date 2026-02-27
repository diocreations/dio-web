import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/App";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import {
  LayoutDashboard,
  Briefcase,
  Package,
  FolderKanban,
  FileText,
  MessageSquare,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  Home,
  UserCog,
  Info,
  Bot,
  FileSearch,
  Navigation,
  DollarSign,
  Layout as LayoutIcon,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Homepage", path: "/admin/homepage", icon: Home },
    { name: "Services", path: "/admin/services", icon: Briefcase },
    { name: "Products", path: "/admin/products", icon: Package },
    { name: "Portfolio", path: "/admin/portfolio", icon: FolderKanban },
    { name: "Blog", path: "/admin/blog", icon: FileText },
    { name: "Testimonials", path: "/admin/testimonials", icon: Star },
    { name: "Contacts", path: "/admin/contacts", icon: MessageSquare },
    { name: "Leads", path: "/admin/leads", icon: Users },
    { name: "Chatbot", path: "/admin/chatbot", icon: Bot },
    { name: "Resume Tool", path: "/admin/resume", icon: FileSearch },
    { name: "Templates", path: "/admin/templates", icon: LayoutIcon },
    { name: "Menus", path: "/admin/menus", icon: Navigation },
    { name: "Currency", path: "/admin/currency", icon: DollarSign },
    { name: "About Page", path: "/admin/about", icon: Info },
    { name: "Users", path: "/admin/users", icon: UserCog },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 flex items-center justify-between px-4 z-50">
        <AnimatedLogo className="scale-[0.6] origin-left" textColor="text-white" />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white p-2"
          data-testid="admin-menu-toggle"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-40 flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header with animated logo */}
        <div className="p-5 border-b border-slate-700 flex-shrink-0">
          <Link to="/admin" className="flex items-center gap-2">
            <AnimatedLogo className="scale-[0.65] origin-left" textColor="text-white" />
          </Link>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                data-testid={`admin-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive(item.path)
                    ? "bg-white/20 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile - always visible at bottom */}
        <div className="flex-shrink-0 p-3 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3 px-3">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-medium text-sm">{user?.name?.charAt(0) || "A"}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10"
            onClick={handleLogout}
            data-testid="admin-logout"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
