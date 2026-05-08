import { Home, MessageCircle, Users, Briefcase, Calendar, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRef, useEffect } from "react";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);

  const tabs = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Chats", icon: MessageCircle, path: "/messages" },
    { name: "Network", icon: Users, path: "/network" },
    { name: "Cases", icon: Briefcase, path: "/cases" },
    { name: "Events", icon: Calendar, path: "/events" },
    { name: "Profile", icon: User, path: "/profile" },
  ];

  // Scroll active tab into center view whenever route changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeEl = container.querySelector("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [location.pathname]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md z-50">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide py-2 px-1"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <button
              key={tab.name}
              data-active={isActive}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center text-xs flex-shrink-0 px-4 py-1 rounded-lg transition-colors ${
                isActive
                  ? "text-teal-600 bg-teal-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Right fade — hints that more tabs exist off-screen */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-8"
        style={{ background: "linear-gradient(to left, white, transparent)" }}
      />
    </div>
  );
}