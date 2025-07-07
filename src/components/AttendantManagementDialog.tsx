import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Users, 
  Building, 
  Edit, 
  Trash2, 
  Loader2, 
  Plus,
  UserCheck,
  Settings,
  CheckCircle,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AttendantManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  plan_type: string;
}

interface AttendantData {
  attendant_id: string;
  attendant_email: string;
  main_organization_id: string;
  main_organization_name: string;
  assigned_organizations_count: number;
  assigned_organizations_list: string;
}

interface UserData {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}

const AttendantManagementDialog: React.FC<AttendantManagementDialogProps> = ({ open, onOpenChange }) => {
  // Estados
  const [attendants, setAttendants] = useState<AttendantData[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAttendant, setSelectedAttendant] = useState<AttendantData | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    userId: "",
    organizationId: "",
    selectedOrganizations: [] as string[]
  });

  const { toast } = useToast();

  // Carregar atendentes
  const loadAttendants = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando atendentes...');
      
      const { data, error } = await supabase.rpc('get_attendants_with_organizations');

      if (error) {
        console.error('❌ Erro ao carregar atendentes:', error);
        throw error;
      }

      console.log('✅ Atendentes carregados:', data?.length || 0);
      setAttendants(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar atendentes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de atendentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar organizações
  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, description, plan_type')
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar organizações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de organizações",
        variant: "destructive",
      });
    }
  };

  // Carregar usuários disponíveis
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();

      if (error) throw error;
      setUsers(data.users || []);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      // Fallback - tentar buscar do auth.users se admin não funcionar
      try {
        const { data, error: fallbackError } = await supabase
          .from('auth.users')
          .select('id, email, raw_user_meta_data');
        
        if (!fallbackError && data) {
          const formattedUsers = data.map(user => ({
            id: user.id,
            email: user.email,
            user_metadata: user.raw_user_meta_data
          }));
          setUsers(formattedUsers);
        }
      } catch (fallbackError) {
        console.error('❌ Erro no fallback:', fallbackError);
      }
    }
  };

  // Promover usuário a atendente
  const promoteToAttendant = async () => {
    if (!formData.userId || !formData.organizationId) {
      toast({
        title: "Erro",
        description: "Selecione um usuário e uma organização principal",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Promover a atendente
      const { error: promoteError } = await supabase.rpc('promote_user_to_attendant', {
        _user_id: formData.userId,
        _organization_id: formData.organizationId
      });

      if (promoteError) throw promoteError;

      // Definir organizações que pode atender
      if (formData.selectedOrganizations.length > 0) {
        const { error: setOrgsError } = await supabase.rpc('set_attendant_organizations', {
          _attendant_id: formData.userId,
          _organization_ids: formData.selectedOrganizations
        });

        if (setOrgsError) throw setOrgsError;
      }

      toast({
        title: "Sucesso",
        description: "Usuário promovido a atendente com sucesso!",
      });
      
      setFormData({
        userId: "",
        organizationId: "",
        selectedOrganizations: []
      });
      
      setActiveTab("list");
      await loadAttendants();
      
    } catch (error: any) {
      console.error('❌ Erro ao promover usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao promover usuário a atendente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Editar organizações do atendente
  const editAttendantOrganizations = async () => {
    if (!selectedAttendant || formData.selectedOrganizations.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma organização",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.rpc('set_attendant_organizations', {
        _attendant_id: selectedAttendant.attendant_id,
        _organization_ids: formData.selectedOrganizations
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Organizações do atendente atualizadas com sucesso!",
      });
      
      setSelectedAttendant(null);
      setFormData({
        userId: "",
        organizationId: "",
        selectedOrganizations: []
      });
      
      setActiveTab("list");
      await loadAttendants();
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar organizações:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar organizações do atendente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Remover atendente
  const removeAttendant = async (attendant: AttendantData) => {
    const confirmRemove = window.confirm(
      `Tem certeza de que deseja remover ${attendant.attendant_email} do cargo de atendente?\n\nEsta ação irá remover todas as associações com organizações.`
    );

    if (!confirmRemove) return;

    setLoading(true);
    
    try {
      // Remover associações com organizações
      const { error: removeOrgsError } = await supabase.rpc('set_attendant_organizations', {
        _attendant_id: attendant.attendant_id,
        _organization_ids: []
      });

      if (removeOrgsError) throw removeOrgsError;

      // Atualizar role para 'member' na organização principal
      const { error: updateRoleError } = await supabase
        .from('organization_users')
        .update({ role: 'member' })
        .eq('user_id', attendant.attendant_id)
        .eq('organization_id', attendant.main_organization_id);

      if (updateRoleError) throw updateRoleError;

      toast({
        title: "Sucesso",
        description: `${attendant.attendant_email} removido do cargo de atendente!`,
      });
      
      await loadAttendants();
      
    } catch (error: any) {
      console.error('❌ Erro ao remover atendente:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover atendente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar atendentes
  const filteredAttendants = attendants.filter(attendant =>
    attendant.attendant_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendant.main_organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (attendant.assigned_organizations_list && attendant.assigned_organizations_list.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Manipular seleção de organizações
  const handleOrganizationToggle = (organizationId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        selectedOrganizations: [...prev.selectedOrganizations, organizationId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedOrganizations: prev.selectedOrganizations.filter(id => id !== organizationId)
      }));
    }
  };

  // Inicializar form para edição
  const handleEditAttendant = async (attendant: AttendantData) => {
    setSelectedAttendant(attendant);
    
    // Carregar organizações atuais do atendente
    try {
      const { data, error } = await supabase.rpc('get_attendant_organizations', {
        _attendant_id: attendant.attendant_id
      });

      if (error) throw error;

      const currentOrgs = data?.map((org: any) => org.organization_id) || [];
      setFormData({
        userId: attendant.attendant_id,
        organizationId: attendant.main_organization_id,
        selectedOrganizations: currentOrgs
      });
    } catch (error) {
      console.error('Erro ao carregar organizações do atendente:', error);
    }
    
    setActiveTab("form");
  };

  // Inicializar form para criação
  const handleCreateAttendant = () => {
    setSelectedAttendant(null);
    setFormData({
      userId: "",
      organizationId: "",
      selectedOrganizations: []
    });
    setActiveTab("form");
  };

  // Carregar dados ao abrir dialog
  useEffect(() => {
    if (open) {
      loadAttendants();
      loadOrganizations();
      loadUsers();
      setActiveTab("list");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden border-0 shadow-xl">
        <DialogHeader className="space-y-4 pb-6">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-light text-slate-900">Gestão de Atendentes</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-50 p-1 rounded-lg">
            <TabsTrigger value="list" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 rounded-md">
              <Users className="h-4 w-4 mr-2" />
              Lista de Atendentes
            </TabsTrigger>
            <TabsTrigger value="form" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 rounded-md">
              <Plus className="h-4 w-4 mr-2" />
              {selectedAttendant ? "Editar Atendente" : "Novo Atendente"}
            </TabsTrigger>
          </TabsList>

          {/* Lista de Atendentes */}
          <TabsContent value="list" className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar atendentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg h-10"
                />
              </div>
              
              <Button onClick={handleCreateAttendant} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border-0 h-10 px-6 rounded-lg font-medium">
                <Plus className="h-4 w-4 mr-2" />
                Novo Atendente
              </Button>
            </div>

            <Card className="border-slate-200 rounded-xl overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-slate-900 font-medium">Atendentes ({filteredAttendants.length})</span>
                  <Badge variant="outline" className="border-slate-300 text-slate-600 bg-white px-3 py-1">
                    Total: {attendants.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="text-slate-600 font-medium py-4">Email</TableHead>
                        <TableHead className="text-slate-600 font-medium py-4">Organização Principal</TableHead>
                        <TableHead className="text-slate-600 font-medium py-4">Organizações Atendidas</TableHead>
                        <TableHead className="text-slate-600 font-medium py-4">Total</TableHead>
                        <TableHead className="w-32 text-slate-600 font-medium py-4">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-3" />
                            <p className="text-slate-600">Carregando atendentes...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredAttendants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-16">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <UserCheck className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-slate-600">
                              {searchTerm ? "Nenhum atendente encontrado" : "Nenhum atendente cadastrado"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAttendants.map((attendant) => (
                          <TableRow key={attendant.attendant_id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                            <TableCell className="font-medium text-slate-900 py-4">{attendant.attendant_email}</TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Building className="h-3 w-3" />
                                <span className="text-sm">{attendant.main_organization_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 max-w-xs">
                              <span className="text-sm text-slate-600 truncate block">
                                {attendant.assigned_organizations_list || "Nenhuma"}
                              </span>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                {attendant.assigned_organizations_count}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditAttendant(attendant)}
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Editar atendente"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAttendant(attendant)}
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Remover atendente"
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
                  <Settings className="h-5 w-5 text-blue-600" />
                  <span className="text-slate-900 font-medium">
                    {selectedAttendant ? "Editar Atendente" : "Criar Novo Atendente"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {!selectedAttendant && (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="user" className="text-slate-700 font-medium text-sm">Usuário</Label>
                      <Select value={formData.userId} onValueChange={(value) => setFormData({ ...formData, userId: value })}>
                        <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg h-11">
                          <SelectValue placeholder="Selecione um usuário" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-slate-500" />
                                {user.email}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="organization" className="text-slate-700 font-medium text-sm">Organização Principal</Label>
                      <Select value={formData.organizationId} onValueChange={(value) => setFormData({ ...formData, organizationId: value })}>
                        <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg h-11">
                          <SelectValue placeholder="Selecione a organização principal" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-slate-500" />
                                {org.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-3">
                  <Label className="text-slate-700 font-medium text-sm">Organizações que pode atender</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-4 border border-slate-200 rounded-lg bg-slate-50">
                    {organizations.map((org) => (
                      <div key={org.id} className="flex items-center space-x-3 p-2 bg-white rounded border">
                        <Checkbox
                          id={`org-${org.id}`}
                          checked={formData.selectedOrganizations.includes(org.id)}
                          onCheckedChange={(checked) => handleOrganizationToggle(org.id, checked as boolean)}
                        />
                        <label htmlFor={`org-${org.id}`} className="text-sm text-slate-700 cursor-pointer flex-1">
                          <div className="flex items-center gap-2">
                            <Building className="h-3 w-3 text-slate-500" />
                            <span>{org.name}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{org.plan_type}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Selecione as organizações que este atendente poderá ver e atender
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-8 mt-8 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedAttendant(null);
                      setFormData({
                        userId: "",
                        organizationId: "",
                        selectedOrganizations: []
                      });
                      setActiveTab("list");
                    }}
                    className="border-slate-200 text-slate-600 hover:bg-slate-50 h-10 px-6 rounded-lg"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (selectedAttendant) {
                        editAttendantOrganizations();
                      } else {
                        promoteToAttendant();
                      }
                    }}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-10 px-8 rounded-lg font-medium"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : selectedAttendant ? (
                      <Edit className="h-4 w-4 mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {selectedAttendant ? "Atualizar" : "Criar"} Atendente
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

export default AttendantManagementDialog; 