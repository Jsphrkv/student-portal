import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  User,
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  Users,
  // GraduationCap,
  DollarSign,
  // Settings,
  Activity,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const studentLinks = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/profile", icon: User, label: "Profile" },
    { to: "/academics", icon: BookOpen, label: "Academic Records" },
    { to: "/enrollment", icon: Calendar, label: "Enrollment" },
    { to: "/financial", icon: CreditCard, label: "Financial" },
    { to: "/announcement", icon: FileText, label: "Announcement" },
    { to: "/support", icon: HelpCircle, label: "Support" },
  ];

  const adminLinks = [
    { to: "/admin/dashboard", icon: Home, label: "Dashboard" },
    { to: "/admin/students", icon: Users, label: "Students" },
    { to: "admin/announcementAdmin", icon: FileText, label: "Announcements" },
    { to: "/admin/AnalyticsAdmin", icon: BarChart3, label: "Analytics" },
    {
      to: "/admin/financialAdmin",
      icon: DollarSign,
      label: "Payment Management",
    },
    // { to: "/admin/settings", icon: Settings, label: "Settings" },
    { to: "/admin/AuditLogs", icon: Activity, label: "Audit Trail" },
    { to: "admin/supportAdmin", icon: HelpCircle, label: "Support" },
  ];

  const links = user?.role === "admin" ? adminLinks : studentLinks;

  return (
    <aside className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-64 min-h-screen">
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`
                }
              >
                <link.icon className="mr-3 h-5 w-5" />
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
