import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as apiClient from '@/api/client';
import {
  Home, MessageCircle, Users, Briefcase, Calendar, User, Menu, X,
  Stethoscope, BookOpen, Pill, MessageSquare, Rss, ClipboardList, BriefcaseBusiness, ShoppingBag,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', icon: Home, page: 'Home' },
  { name: 'Chats', icon: MessageCircle, page: 'Chats' },
  { name: 'Network', icon: Users, page: 'Network' },
  { name: 'Forum', icon: MessageSquare, page: 'Forum' },
  { name: 'Cases', icon: Briefcase, page: 'Cases' },
  { name: 'Prescriptions', icon: ClipboardList, page: 'Prescriptions' },
  { name: 'Drugs', icon: Pill, page: 'Drugs' },
  { name: 'References', icon: BookOpen, page: 'References' },
  { name: 'Updates', icon: Rss, page: 'Updates' },
  { name: 'Recruitment', icon: BriefcaseBusiness, page: 'Recruitment' },
  { name: 'MedMarket', icon: ShoppingBag, page: 'MedMarket' },
  { name: 'Events', icon: Calendar, page: 'Events' },
  { name: 'Profile', icon: User, page: 'Profile' },
];

// Bottom nav shared by the Chats page and the mobile layout.
// overflow-x-auto lets the 13 items scroll sideways instead of being squashed.
function BottomNav({ currentPageName, unreadCount, className }) {
  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50", className)}>
      <div className="flex items-center overflow-x-auto overscroll-x-contain py-2 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map(item => (
          <Link
            key={item.name}
            to={`/${item.page}`}
            className={cn(
              "flex shrink-0 min-w-[4.5rem] flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all relative",
              currentPageName === item.page ? "text-teal-600" : "text-slate-400"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
            {item.name === 'Chats' && unreadCount > 0 && (
              <span className="absolute -top-1 right-2 w-4 h-4 bg-teal-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);

  // Desktop sidebar collapsed state, remembered between visits
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebarCollapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const u = await apiClient.auth.me();
        setUser(u);

        const conversations = await apiClient.entities.Conversation.filter({
          participants: u.email
        });

        let total = 0;
        conversations.forEach(c => {
          total += (c.unread_count?.[u.email] || 0);
        });
        setUnreadCount(total);
      } catch (e) {
        console.log('Not logged in');
      }
    };
    loadData();

    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Full-screen pages without layout
  if (currentPageName === 'Chats') {
    return (
      <>
        {children}
        {/* Bottom Nav ONLY for Chats */}
        <BottomNav currentPageName={currentPageName} unreadCount={unreadCount} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar (collapsible) */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex-col z-50 transition-[width] duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Header: pinned */}
        <div
          className={cn(
            "shrink-0 border-b border-slate-100 flex items-center",
            collapsed ? "flex-col gap-3 p-4" : "justify-between p-6"
          )}
        >
          <Link to="/Home" className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-slate-800 truncate">DocConnect</h1>
                <p className="text-xs text-slate-500 truncate">Connecting Doctors</p>
              </div>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className="shrink-0"
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </Button>
        </div>

        {/* Links: scrolls on its own. min-h-0 is needed so flex-1 can shrink and scroll */}
        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.name}>
                <Link
                  to={`/${item.page}`}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 py-3 rounded-xl transition-all relative",
                    collapsed ? "justify-center px-0" : "px-4",
                    currentPageName === item.page
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="font-medium truncate">{item.name}</span>}
                  {item.name === 'Chats' && unreadCount > 0 && (
                    collapsed ? (
                      <span className="absolute top-1.5 right-3 w-2.5 h-2.5 bg-teal-500 rounded-full" />
                    ) : (
                      <Badge className="ml-auto bg-teal-500">{unreadCount}</Badge>
                    )
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User card: pinned */}
        {user && (
          <div className="shrink-0 p-4 border-t border-slate-100">
            <div className={cn("flex items-center gap-3 py-2", collapsed ? "justify-center" : "px-4")}>
              <div
                title={collapsed ? (user.full_name || user.email) : undefined}
                className="w-10 h-10 shrink-0 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold"
              >
                {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{user.full_name || 'Doctor'}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/Home" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800">DocConnect</span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu: scrolls if taller than the screen */}
        {mobileMenuOpen && (
          <nav className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain">
            <ul className="p-2">
              {navItems.map(item => (
                <li key={item.name}>
                  <Link
                    to={`/${item.page}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                      currentPageName === item.page
                        ? "bg-teal-50 text-teal-700"
                        : "text-slate-600"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                    {item.name === 'Chats' && unreadCount > 0 && (
                      <Badge className="ml-auto bg-teal-500">{unreadCount}</Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {/* Mobile Bottom Nav */}
      <BottomNav
        currentPageName={currentPageName}
        unreadCount={unreadCount}
        className="lg:hidden safe-area-bottom"
      />

      {/* Main Content: margin follows the sidebar width */}
      <main
        className={cn(
          "pt-14 lg:pt-0 transition-[margin] duration-300",
          collapsed ? "lg:ml-20" : "lg:ml-64",
          currentPageName === 'Chats' ? "pb-28" : "pb-20",
          "lg:pb-0"
        )}
      >
        {children}
      </main>
    </div>
  );
}