import React from "react";
import { LogOut, Moon, Sun, User, Menu, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

interface HeaderProps {
  isSidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm fixed top-0 left-0 w-full z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {/* Toggle Button for Sidebar (Mobile Only) */}
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-gray-700 dark:text-white"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              ICAS Sucat Campus
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {user && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
