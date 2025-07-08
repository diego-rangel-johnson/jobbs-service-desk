import { Button } from "@/components/ui/button";
import { User, Bell, LogOut, Settings, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  userName: string;
  onLogout: () => void;
}

const DashboardHeader = ({ userName, onLogout }: DashboardHeaderProps) => {
  const { isAdmin, isSupervisor, isAttendant, userRoles } = useAuth();

  // Determinar a função do usuário para exibir
  const getUserRole = () => {
    if (isAdmin) return "Administrador";
    if (isSupervisor) return "Supervisor";
    if (isAttendant) return "Atendente";
    return "Usuário";
  };

  // Função para truncar nome em mobile
  const getTruncatedName = (name: string, maxLength: number = 12) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  return (
    <header className="border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between p-3 sm:p-4">
        {/* Logo e nome da plataforma */}
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          <div className="w-8 h-8 flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Jobbs Desk Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback se a imagem não carregar
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-8 h-8 bg-primary rounded flex items-center justify-center"><span class="text-white font-bold text-sm">J</span></div>';
                }
              }}
            />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold truncate">
            Jobbs Desk
          </h1>
        </div>
        
        {/* Informações do usuário e ações */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
          {/* Menu de ações para mobile */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium">{getTruncatedName(userName, 20)}</div>
                  <div className="text-xs text-muted-foreground">{getUserRole()}</div>
                </div>
                <DropdownMenuSeparator />
                
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Painel Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem>
                  <Bell className="h-4 w-4 mr-2" />
                  Notificações
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Layout desktop */}
          <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="hidden lg:flex">
                  <Settings className="h-4 w-4 mr-1" />
                  Admin
                </Button>
                <Button variant="ghost" size="sm" className="lg:hidden h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            )}
            
            <Button variant="ghost" size="sm" className="hidden lg:flex">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="lg:hidden h-8 w-8 p-0">
              <Bell className="h-4 w-4" />
            </Button>
            
            {/* Informações do usuário */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="text-right hidden lg:block">
                <div className="text-xs text-muted-foreground">{getUserRole()}</div>
                <div className="text-sm font-medium">
                  {getTruncatedName(userName, 15)}
                </div>
              </div>
              
              <div className="text-right lg:hidden">
                <div className="text-xs font-medium">
                  {getTruncatedName(userName, 10)}
                </div>
              </div>
              
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="hidden lg:flex"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="lg:hidden h-8 w-8 p-0 text-red-600"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;