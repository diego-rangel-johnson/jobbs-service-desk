import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Zap, Shield, Settings } from "lucide-react";
import { SLACriticality, SLA_CONFIGS } from '@/types/sla';

interface SLASelectorProps {
  value: SLACriticality;
  onChange: (value: SLACriticality) => void;
  canEdit: boolean;
  className?: string;
}

// Mapear ícones para cada criticidade
const getSLAIcon = (criticality: SLACriticality) => {
  switch (criticality) {
    case 'muito_alta': return <Zap className="h-4 w-4" />;
    case 'alta': return <AlertTriangle className="h-4 w-4" />;
    case 'moderada': return <Clock className="h-4 w-4" />;
    case 'padrao': return <Shield className="h-4 w-4" />;
    case 'geral': return <Settings className="h-4 w-4" />;
    default: return <Shield className="h-4 w-4" />;
  }
};

// Classes de cores simples
const getSLAColorClasses = (color: string) => {
  switch (color) {
    case 'red': return 'text-red-600 bg-red-50 border-red-200';
    case 'orange': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'yellow': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'blue': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'gray': return 'text-gray-600 bg-gray-50 border-gray-200';
    default: return 'text-blue-600 bg-blue-50 border-blue-200';
  }
};

export const SLASelector: React.FC<SLASelectorProps> = ({ 
  value, 
  onChange, 
  canEdit,
  className = ""
}) => {
  const currentConfig = SLA_CONFIGS[value];

  if (!canEdit) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Badge variant="outline" className={`flex items-center gap-2 px-3 py-1 ${getSLAColorClasses(currentConfig.color)}`}>
          {getSLAIcon(value)}
          {currentConfig.label}
        </Badge>
        <span className="text-sm text-gray-600">
          {currentConfig.responseTime} • {currentConfig.solutionTime}
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full h-11 px-3 border focus:ring-2 focus:ring-primary/20">
          <SelectValue placeholder="Selecione a criticidade">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${getSLAColorClasses(currentConfig.color)}`}>
                {getSLAIcon(value)}
              </div>
              <span className="font-medium">{currentConfig.label}</span>
              <span className="text-sm text-gray-500">• {currentConfig.responseTime}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent className="w-full min-w-[400px]">
          {Object.entries(SLA_CONFIGS).map(([key, config]) => (
            <SelectItem 
              key={key} 
              value={key} 
              className="cursor-pointer py-3 px-4 focus:bg-gray-50"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded ${getSLAColorClasses(config.color)}`}>
                    {getSLAIcon(key as SLACriticality)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{config.label}</div>
                    <div className="text-xs text-gray-500">{config.timeType}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">
                    {config.responseTime} • {config.solutionTime}
                  </div>
                  <div className="text-xs text-gray-500">resposta • solução</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Card de informações resumido */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded ${getSLAColorClasses(currentConfig.color)}`}>
            {getSLAIcon(value)}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">{currentConfig.label}</h4>
            <p className="text-sm text-gray-600 mb-2">{currentConfig.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-500">Resposta:</span>
                <span className="font-medium text-gray-700 ml-1">{currentConfig.responseTime}</span>
              </div>
              <div>
                <span className="text-gray-500">Solução:</span>
                <span className="font-medium text-gray-700 ml-1">{currentConfig.solutionTime}</span>
              </div>
              <div>
                <span className="text-gray-500">Tipo:</span>
                <span className="font-medium text-gray-700 ml-1">{currentConfig.timeType}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 