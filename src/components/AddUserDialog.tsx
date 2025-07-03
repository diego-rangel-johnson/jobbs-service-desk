import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, EyeOff, Building, Shield, UserCog } from "lucide-react";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Company {
  id: string;
  name: string;
  is_active: boolean;
}

const AddUserDialog = ({ open, onOpenChange }: AddUserDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    company_id: ""
  });
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Carregar empresas ativas
  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de empresas",
        variant: "destructive",
      });
    }
  };

  // Carregar empresas quando abrir o dialog
  useEffect(() => {
    if (open) {
      loadCompanies();
      // Limpar formulário
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
        company_id: ""
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Erro",
        description: "Nome, email e senha são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Iniciando criação de usuário:', formData.name);

      // 1. Criar conta de autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role
          }
        }
      });

      if (authError) {
        console.error('❌ Erro na criação da conta auth:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado corretamente');
      }

      console.log('✅ Conta auth criada:', authData.user.id);

      // 2. Criar perfil do usuário
      const profileData = {
        user_id: authData.user.id,
        name: formData.name,
        company_id: formData.company_id || null
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError);
        throw new Error('Erro ao criar perfil do usuário');
      }

      console.log('✅ Perfil criado com sucesso');

      // 3. Criar role do usuário
      const roleData = {
        user_id: authData.user.id,
        role: formData.role as "admin" | "support" | "user"
      };

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([roleData]);

      if (roleError) {
        console.error('❌ Erro ao criar role:', roleError);
        throw new Error('Erro ao definir permissões do usuário');
      }

      console.log('✅ Role criada com sucesso');

      toast({
        title: "Sucesso",
        description: `Usuário ${formData.name} criado com sucesso!`,
      });

      // Limpar formulário e fechar dialog
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
        company_id: ""
      });
      
      onOpenChange(false);

    } catch (error: any) {
      console.error('❌ Erro completo:', error);
      
      let errorMessage = "Erro ao criar usuário";
      
      if (error.message?.includes('already registered')) {
        errorMessage = "Este email já está cadastrado";
      } else if (error.message?.includes('invalid email')) {
        errorMessage = "Email inválido";
      } else if (error.message?.includes('password')) {
        errorMessage = "Erro na senha - deve ter pelo menos 6 caracteres";
      } else if (error.message?.includes('duplicate key')) {
        errorMessage = "Usuário já existe no sistema";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full mx-auto my-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Adicionar Novo Usuário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome completo"
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Digite o e-mail"
                disabled={isLoading}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Senha *</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Digite a senha (mín. 6 caracteres)"
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Função</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={isLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="support">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-indigo-500" />
                      Suporte
                    </div>
                  </SelectItem>
                  <SelectItem value="supervisor">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-green-500" />
                      Supervisor
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-500" />
                      Administrador
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="company">Empresa</Label>
              <Select 
                value={formData.company_id} 
                onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione uma empresa (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma empresa</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-slate-500" />
                        {company.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Adicionar Usuário'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;