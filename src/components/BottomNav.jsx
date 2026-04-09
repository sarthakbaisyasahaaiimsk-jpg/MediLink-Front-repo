import { Home, MessageCircle, Users, Briefcase, Calendar, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Chats", icon: MessageCircle, path: "/messages" },
    { name: "Network", icon: Users, path: "/network" },
    { name: "Cases", icon: Briefcase, path: "/cases" },
    { name: "Events", icon: Calendar, path: "/events" },
    { name: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md z-50 flex justify-around py-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;

        return (
          <button
            key={tab.name}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center text-xs ${
              isActive ? "text-teal-600" : "text-gray-500"
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            {tab.name}
          </button>
        );
      })}
    </div>
  );
}