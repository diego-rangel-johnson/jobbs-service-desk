import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Building, 
  Edit, 
  Trash2, 
  Loader2, 
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Company {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  user_count: number;
  created_at: string;
  updated_at: string;
}

interface CompanyFormData {
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

interface CompanyManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CompanyManagementDialog: React.FC<CompanyManagementDialogProps> = ({ open, onOpenChange }) => {
  // Estados
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  
  // Estados do formulário
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    document: "",
    email: "",
    phone: "",
    address: "",
    is_active: true
  });

  const { toast } = useToast();

  // Carregar empresas do Supabase
  const loadCompanies = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando empresas...');
      
      const { data, error } = await supabase.rpc('get_companies_with_user_count');

      if (error) {
        console.error('❌ Erro ao carregar empresas:', error);
        throw error;
      }

      console.log('✅ Empresas carregadas:', data?.length || 0);
      setCompanies(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de empresas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar empresa
  const createCompany = async () => {
    if (!formData.name) {
      toast({
        title: "Erro",
        description: "Nome da empresa é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('companies')
        .insert([{
          name: formData.name,
          document: formData.document || null,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          is_active: formData.is_active
        }]);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Empresa ${formData.name} criada com sucesso!`,
      });
      
      setFormData({
        name: "",
        document: "",
        email: "",
        phone: "",
        address: "",
        is_active: true
      });
      
      setActiveTab("list");
      await loadCompanies(); // Recarregar lista
      
    } catch (error: any) {
      console.error('❌ Erro ao criar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar empresa
  const updateCompany = async () => {
    if (!selectedCompany || !formData.name) {
      toast({
        title: "Erro",
        description: "Nome da empresa é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          document: formData.document || null,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedCompany.id);

      if (error) throw error;

      setSelectedCompany(null);
      setFormData({
        name: "",
        document: "",
        email: "",
        phone: "",
        address: "",
        is_active: true
      });
      
      toast({
        title: "Sucesso",
        description: `Empresa ${formData.name} atualizada com sucesso!`,
      });
      
      setActiveTab("list");
      await loadCompanies(); // Recarregar lista
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Deletar empresa
  const deleteCompany = async (company: Company) => {
    if (company.user_count && company.user_count > 0) {
      toast({
        title: "Erro",
        description: `Não é possível deletar a empresa ${company.name} pois ela possui ${company.user_count} usuário(s) vinculado(s).`,
        variant: "destructive",
      });
      return;
    }

    const confirmDelete = window.confirm(
      `Tem certeza de que deseja deletar a empresa ${company.name}?\n\nEsta ação não pode ser desfeita.`
    );

    if (!confirmDelete) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Empresa ${company.name} removida com sucesso!`,
      });
      
      await loadCompanies(); // Recarregar lista
      
    } catch (error: any) {
      console.error('❌ Erro ao deletar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Ativar/desativar empresa
  const toggleCompanyStatus = async (company: Company) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          is_active: !company.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Empresa ${company.name} ${!company.is_active ? 'ativada' : 'desativada'} com sucesso!`,
      });

      await loadCompanies(); // Recarregar lista
      
    } catch (error: any) {
      console.error('❌ Erro ao alterar status da empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar empresas
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.document && company.document.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (company.email && company.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Inicializar form para edição
  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      document: company.document || "",
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      is_active: company.is_active
    });
    setActiveTab("form");
  };

  // Inicializar form para criação
  const handleCreateCompany = () => {
    setSelectedCompany(null);
    setFormData({
      name: "",
      document: "",
      email: "",
      phone: "",
      address: "",
      is_active: true
    });
    setActiveTab("form");
  };

  // Carregar dados ao abrir dialog
  useEffect(() => {
    if (open) {
      loadCompanies();
      setActiveTab("list");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden border-0 shadow-xl">
        <DialogHeader className="space-y-4 pb-6">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Building className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-light text-slate-900">Gestão de Empresas</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-50 p-1 rounded-lg">
            <TabsTrigger value="list" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 rounded-md">
              <Building className="h-4 w-4 mr-2" />
              Lista de Empresas
            </TabsTrigger>
            <TabsTrigger value="form" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 rounded-md">
              <Plus className="h-4 w-4 mr-2" />
              {selectedCompany ? "Editar Empresa" : "Nova Empresa"}
            </TabsTrigger>
          </TabsList>

          {/* Lista de Empresas */}
          <TabsContent value="list" className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg h-10"
                />
              </div>
              
              <Button onClick={handleCreateCompany} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white border-0 h-10 px-6 rounded-lg font-medium">
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </Button>
            </div>

            <Card className="border-slate-200 rounded-xl overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-slate-900 font-medium">Empresas ({filteredCompanies.length})</span>
                  <Badge variant="outline" className="border-slate-300 text-slate-600 bg-white px-3 py-1">
                    Total: {companies.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="text-slate-600 font-medium py-4">Nome</TableHead>
                        <TableHead className="text-slate-600 font-medium py-4">Documento</TableHead>
                        <TableHead className="text-slate-600 font-medium py-4">Email</TableHead>
                        <TableHead className="text-slate-600 font-medium py-4">Telefone</TableHead>
                        <TableHead className="text-slate-600 font-medium py-4">Usuários</TableHead>
                        <TableHead className="text-slate-600 font-medium py-4">Status</TableHead>
                        <TableHead className="text-slate-600 font-medium py-4">Criada em</TableHead>
                        <TableHead className="w-32 text-slate-600 font-medium py-4">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600 mb-3" />
                            <p className="text-slate-600">Carregando empresas...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredCompanies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-16">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <Building className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-slate-600">
                              {searchTerm ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCompanies.map((company) => (
                          <TableRow key={company.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                            <TableCell className="font-medium text-slate-900 py-4">{company.name}</TableCell>
                            <TableCell className="py-4">
                              {company.document ? (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <FileText className="h-3 w-3" />
                                  <span className="text-sm">{company.document}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="py-4">
                              {company.email ? (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Mail className="h-3 w-3" />
                                  <span className="text-sm">{company.email}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="py-4">
                              {company.phone ? (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Phone className="h-3 w-3" />
                                  <span className="text-sm">{company.phone}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2 text-slate-600">
                                <User className="h-3 w-3" />
                                <span className="text-sm">{company.user_count || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={company.is_active}
                                  onCheckedChange={() => toggleCompanyStatus(company)}
                                  disabled={loading}
                                />
                                <Badge 
                                  variant={company.is_active ? "default" : "secondary"}
                                  className={company.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}
                                >
                                  {company.is_active ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Ativa
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Inativa
                                    </>
                                  )}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 py-4 text-sm">
                              {new Date(company.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCompany(company)}
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                  title="Editar empresa"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCompany(company)}
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Deletar empresa"
                                  disabled={(company.user_count || 0) > 0}
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
                  {selectedCompany ? (
                    <>
                      <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <Edit className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-slate-900 font-medium">Editar {selectedCompany.name}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <Plus className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-slate-900 font-medium">Nova Empresa</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="company-name" className="text-slate-700 font-medium text-sm">Nome da Empresa *</Label>
                    <Input
                      id="company-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Digite o nome da empresa"
                      className="border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg h-11"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="document" className="text-slate-700 font-medium text-sm">CNPJ/CPF</Label>
                    <Input
                      id="document"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      placeholder="Digite o documento"
                      className="border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg h-11"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="company-email" className="text-slate-700 font-medium text-sm">E-mail</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Digite o e-mail"
                      className="border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg h-11"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-slate-700 font-medium text-sm">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Digite o telefone"
                      className="border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg h-11"
                    />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="address" className="text-slate-700 font-medium text-sm">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Digite o endereço completo"
                      className="border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg h-11"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active" className="text-slate-700 font-medium text-sm">Empresa ativa</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-8 mt-8 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedCompany(null);
                      setFormData({
                        name: "",
                        document: "",
                        email: "",
                        phone: "",
                        address: "",
                        is_active: true
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
                      if (selectedCompany) {
                        updateCompany();
                      } else {
                        createCompany();
                      }
                    }}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 text-white border-0 h-10 px-8 rounded-lg font-medium"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : selectedCompany ? (
                      <Edit className="h-4 w-4 mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {selectedCompany ? "Atualizar" : "Criar"} Empresa
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

export default CompanyManagementDialog; 