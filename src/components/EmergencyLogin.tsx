import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface EmergencyLoginProps {
  onClose: () => void;
}

const EmergencyLogin = ({ onClose }: EmergencyLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEmergencyLogin = async (role: 'admin' | 'user') => {
    setIsLoading(true);
    
    try {
      // Simular login de emergência para desenvolvimento
      const userData = {
        admin: {
          id: 'emergency-admin-id',
          email: 'admin@exemplo.com',
          name: 'Admin Emergência',
          role: 'admin'
        },
        user: {
          id: 'emergency-user-id', 
          email: 'usuario@exemplo.com',
          name: 'Usuário Emergência',
          role: 'user'
        }
      };

      const user = userData[role];
      
      // Salvar dados no localStorage para simular login
      localStorage.setItem('emergency-login', JSON.stringify({
        user,
        timestamp: Date.now()
      }));

      console.log(`🚨 Login de Emergência Ativado - ${user.name} (${user.role})`);

      // Redirecionar baseado no role
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }

      onClose();
      
    } catch (error) {
      console.error('Erro no Login de Emergência:', error);
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="text-lg text-destructive">Login de Emergência</CardTitle>
        <div className="bg-destructive/10 border border-destructive/20 rounded p-3 mt-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">APENAS PARA DESENVOLVIMENTO</span>
          </div>
          <p className="text-xs text-destructive/80">
            Este login bypassa a autenticação do Supabase e deve ser usado apenas para testes locais.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          variant="destructive"
          onClick={() => handleEmergencyLogin('admin')}
          disabled={isLoading}
          className="w-full"
        >
          Login como Admin
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => handleEmergencyLogin('user')}
          disabled={isLoading}
          className="w-full"
        >
          Login como Usuário
        </Button>
        
        <Button 
          variant="ghost"
          onClick={onClose}
          className="w-full"
        >
          Cancelar
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmergencyLogin;