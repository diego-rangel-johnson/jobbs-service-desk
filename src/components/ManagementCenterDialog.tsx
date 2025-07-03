import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Database,
  User,
  Building,
  UserPlus,
  Plus
} from "lucide-react";
import UserManagementDialog from "./UserManagementDialog";
import CompanyManagementDialog from "./CompanyManagementDialog";

interface ManagementCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManagementCenterDialog: React.FC<ManagementCenterDialogProps> = ({ open, onOpenChange }) => {
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showCompanyManagement, setShowCompanyManagement] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl border-0 shadow-xl">
          <DialogHeader className="space-y-4 pb-6">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Database className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-light text-slate-900">Central de Dados</span>
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Acesse as ferramentas de gestão para usuários e empresas do sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gestão de Usuários */}
            <div className="group cursor-pointer" onClick={() => setShowUserManagement(true)}>
              <div className="p-8 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-slate-900">Gestão de Usuários</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Criar, editar e gerenciar usuários do sistema. Defina permissões e vincule usuários a empresas.
                    </p>
                  </div>

                  <div className="w-full space-y-2 text-xs text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <span>Criar e editar usuários</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <span>Gerenciar permissões</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <span>Vincular a empresas</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 h-11 text-sm font-medium"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Gerenciar Usuários
                  </Button>
                </div>
              </div>
            </div>

            {/* Gestão de Empresas */}
            <div className="group cursor-pointer" onClick={() => setShowCompanyManagement(true)}>
              <div className="p-8 rounded-2xl border border-slate-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <Building className="h-8 w-8 text-purple-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-slate-900">Gestão de Empresas</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Cadastrar e gerenciar empresas clientes. Organize usuários por empresa e controle acessos.
                    </p>
                  </div>

                  <div className="w-full space-y-2 text-xs text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <span>Cadastrar empresas</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <span>Dados completos</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <span>Controlar status</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white border-0 h-11 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Gerenciar Empresas
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-100">
            <div className="text-center">
              <p className="text-sm text-slate-500">
                Central de dados integrada para gestão completa do sistema
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs de Gestão */}
      <UserManagementDialog 
        open={showUserManagement} 
        onOpenChange={setShowUserManagement} 
      />
      
      <CompanyManagementDialog 
        open={showCompanyManagement} 
        onOpenChange={setShowCompanyManagement} 
      />
    </>
  );
};

export default ManagementCenterDialog; 