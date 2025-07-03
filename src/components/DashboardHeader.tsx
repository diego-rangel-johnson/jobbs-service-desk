import { Button } from "@/components/ui/button";
import { User, Bell, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface DashboardHeaderProps {
  userName: string;
  onLogout: () => void;
}

const DashboardHeader = ({ userName, onLogout }: DashboardHeaderProps) => {
  const { isAdmin } = useAuth();

  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto flex items-center justify-between p-3 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="w-8 h-8">
            <img src="/logo.png" alt="Jobbs Desk Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold">Jobbs Desk</h1>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </div>
            <span className="text-xs sm:text-sm font-medium hidden xs:block">{userName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;