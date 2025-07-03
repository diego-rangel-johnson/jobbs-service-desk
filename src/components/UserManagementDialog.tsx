import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit, 
  Trash2, 
  UserPlus, 
  Search, 
  Eye, 
  EyeOff,
  Loader2,
  User,
  Building,
  Shield,
  UserCheck,
  UserCog
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  profile_id: string;
  user_id: string;
  name: string;
  email: string;
  company_id: string | null;
  company_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  name: string;
  is_active: boolean;
}

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserManagementDialog: React.FC<UserManagementDialogProps> = ({ open, onOpenChange }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    company_id: "none",
  });

  // Carregar usuários do Supabase
  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando usuários...');
      
      const { data, error } = await supabase.rpc('get_users_with_details');

      if (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        throw error;
      }

      console.log('✅ Usuários carregados:', data?.length || 0);
      setUsers(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      console.error('❌ Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de empresas",
        variant: "destructive",
      });
    }
  };

  // Criar usuário
  const createUser = async () => {
    console.log("🚀 createUser chamada com dados:", formData);
    
    if (!formData.name || !formData.email || !formData.password) {
      console.log("❌ Validação falhou:", { name: formData.name, email: formData.email, password: formData.password });
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

    console.log("✅ Validação passou, iniciando criação...");
    setLoading(true);
    
    try {
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

      if (authError) throw authError;
      if (!authData.user) throw new Error('Usuário não foi criado corretamente');

      // 2. Criar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          user_id: authData.user.id,
          name: formData.name,
          company_id: formData.company_id === "none" ? null : formData.company_id || null
        }]);

      if (profileError) throw profileError;

      // 3. Criar role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: authData.user.id,
          role: formData.role as "admin" | "support" | "supervisor" | "user"
        }]);

      if (roleError) throw roleError;

      toast({
        title: "Sucesso",
        description: `Usuário ${formData.name} criado com sucesso!`,
      });
      
      setFormData({ name: "", email: "", password: "", role: "user", company_id: "none" });
      setActiveTab("list");
      await loadUsers(); // Recarregar lista
      
    } catch (error: any) {
      console.error('❌ Erro ao criar usuário:', error);
      let errorMessage = "Erro ao criar usuário";
      
      if (error.message?.includes('already registered')) {
        errorMessage = "Este email já está cadastrado";
      } else if (error.message?.includes('invalid email')) {
        errorMessage = "Email inválido";
      } else if (error.message?.includes('duplicate key')) {
        errorMessage = "Usuário já existe no sistema";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar usuário
  const updateUser = async () => {
    if (!selectedUser || !formData.name) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Usar a função do banco para atualizar perfil
      const { error } = await supabase.rpc('update_user_profile', {
        target_user_id: selectedUser.user_id,
        new_name: formData.name,
        new_company_id: formData.company_id === "none" ? null : formData.company_id || null,
        new_role: formData.role
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${formData.name} atualizado com sucesso!`,
      });
      
      setSelectedUser(null);
      setFormData({ name: "", email: "", password: "", role: "user", company_id: "none" });
      setActiveTab("list");
      await loadUsers(); // Recarregar lista
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Deletar usuário (só perfil, não a conta auth)
  const deleteUser = async (user: UserData) => {
    const confirmDelete = window.confirm(
      `Tem certeza de que deseja deletar o usuário ${user.name}?\n\nEsta ação não pode ser desfeita.`
    );

    if (!confirmDelete) return;

    setLoading(true);
    
    try {
      // Deletar role primeiro
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.user_id);

      // Deletar perfil
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${user.name} removido com sucesso!`,
      });
      
      await loadUsers(); // Recarregar lista
      
    } catch (error: any) {
      console.error('❌ Erro ao deletar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuários
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.company_name && user.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Inicializar form para edição
  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      company_id: user.company_id || "none",
    });
    setActiveTab("form");
  };

  // Inicializar form para criação
  const handleCreateUser = () => {
    console.log("📝 handleCreateUser chamada");
    setSelectedUser(null);
    setFormData({ name: "", email: "", password: "", role: "user", company_id: "none" });
    setActiveTab("form");
    console.log("✅ Navegado para aba form");
  };

  // Carregar dados ao abrir dialog
  useEffect(() => {
    if (open) {
      loadUsers();
      loadCompanies();
      setActiveTab("list");
    }
  }, [open]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-800 border-purple-200";
      case "support": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "supervisor": return "bg-green-100 text-green-800 border-green-200";
      case "user": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrador";
      case "support": return "Suporte";
      case "supervisor": return "Supervisor";
      case "user": return "Usuário";
      default: return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden border-0 shadow-xl">
        <DialogHeader className="space-y-4 pb-6">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-light text-slate-900">Gestão de Usuários</span>
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Gerencie usuários do sistema, criando novos perfis e editando informações existentes.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-50 p-1 rounded-lg">
            <TabsTrigger value="list" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 rounded-md">
              <User className="h-4 w-4 mr-2" />
              Lista de Usuários
            </TabsTrigger>
            <TabsTrigger value="form" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 rounded-md">
              <UserPlus className="h-4 w-4 mr-2" />
              {selectedUser ? "Editar Usuário" : "Novo Usuário"}
            </TabsTrigger>
          </TabsList>

          {/* Lista de Usuários */}
          <TabsContent value="list" className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg h-10"
                />
              </div>
              
              <Button onClick={handleCreateUser} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border-0 h-10 px-6 rounded-lg font-medium">
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>

            <Card className="border-slate-200 rounded-xl overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-slate-900 font-medium">Usuários ({filteredUsers.length})</span>
                  <Badge variant="outline" className="border-slate-300 text-slate-600 bg-white px-3 py-1">
                    Total: {users.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="text-slate-600 font-medium py-4">Nome</TableHead>
                        <TableHead className="text-slate-600 font-medium py-4">Email</TableHead>
                        <TableHead className="text-slate-600 font-medium py-4">Função</TableHead>
                        <TableHead className="text-slate-600 font-medium py-4">Empresa</TableHead>
                        <TableHead className="text-slate-600 font-medium py-4">Criado em</TableHead>
                        <TableHead className="w-32 text-slate-600 font-medium py-4">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-3" />
                            <p className="text-slate-600">Carregando usuários...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-16">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <User className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-slate-600">
                              {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.user_id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                            <TableCell className="font-medium text-slate-900 py-4">{user.name}</TableCell>
                            <TableCell className="text-slate-600 py-4">{user.email}</TableCell>
                            <TableCell className="py-4">
                              <Badge variant="secondary" className={getRoleColor(user.role)}>
                                {getRoleLabel(user.role)}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              {user.company_name ? (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Building className="h-3 w-3" />
                                  <span className="text-sm">{user.company_name}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm">Sem empresa</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-600 py-4 text-sm">
                              {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Editar usuário"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteUser(user)}
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Deletar usuário"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Formulário */}
          <TabsContent value="form" className="space-y-6 mt-6">
            <Card className="border-slate-200 rounded-xl overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                <CardTitle className="flex items-center gap-3">
                  {selectedUser ? (
                    <>
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Edit className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-slate-900 font-medium">Editar {selectedUser.name}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-slate-900 font-medium">Novo Usuário</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-slate-700 font-medium text-sm">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Digite o nome completo"
                      className="border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg h-11"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-slate-700 font-medium text-sm">E-mail {!selectedUser && "*"}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Digite o e-mail"
                      disabled={!!selectedUser}
                      className="border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg h-11 disabled:bg-slate-50"
                    />
                  </div>

                  {!selectedUser && (
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-slate-700 font-medium text-sm">Senha *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Digite a senha"
                          className="border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-11 px-3 text-slate-400 hover:text-slate-600 rounded-r-lg"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="role" className="text-slate-700 font-medium text-sm">Função</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg h-11">
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-blue-500" />
                            Usuário
                          </div>
                        </SelectItem>
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

                  <div className="space-y-3">
                    <Label htmlFor="company" className="text-slate-700 font-medium text-sm">Empresa</Label>
                    <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
                      <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg h-11">
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="none">Nenhuma empresa</SelectItem>
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

                <div className="flex justify-end space-x-3 pt-8 mt-8 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(null);
                      setFormData({ name: "", email: "", password: "", role: "user", company_id: "none" });
                      setActiveTab("list");
                    }}
                    className="border-slate-200 text-slate-600 hover:bg-slate-50 h-10 px-6 rounded-lg"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      console.log("🔄 Botão submit clicado. selectedUser:", selectedUser);
                      console.log("📋 Dados do formulário atual:", formData);
                      if (selectedUser) {
                        console.log("✏️ Chamando updateUser...");
                        updateUser();
                      } else {
                        console.log("➕ Chamando createUser...");
                        createUser();
                      }
                    }}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-10 px-8 rounded-lg font-medium"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : selectedUser ? (
                      <Edit className="h-4 w-4 mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {selectedUser ? "Atualizar" : "Criar"} Usuário
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementDialog; 