import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

interface EmergencyLoginButtonProps {
  onClick: () => void;
}

const EmergencyLoginButton = ({ onClick }: EmergencyLoginButtonProps) => {
  return (
    <div className="mt-4 pt-4 border-t border-dashed">
      <Button 
        variant="destructive"
        onClick={onClick}
        className="w-full"
        size="sm"
      >
        <Shield className="mr-2 h-4 w-4" />
        Login de Emergência (Dev)
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-1">
        Bypass para desenvolvimento - use apenas para testes
      </p>
    </div>
  );
};

export default EmergencyLoginButton;