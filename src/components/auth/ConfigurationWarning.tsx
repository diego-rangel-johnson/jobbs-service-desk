const ConfigurationWarning = () => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">⚠️ Configuração Necessária</h4>
      <p className="text-xs text-red-700 dark:text-red-400 mb-2">
        O provedor de email está desabilitado no Supabase. Para usar o sistema:
      </p>
      <ol className="text-xs text-red-700 dark:text-red-400 list-decimal list-inside space-y-1">
        <li>Vá em Authentication → Providers</li>
        <li>Habilite o provedor "Email"</li>
        <li>Em Settings, desabilite "Confirm email"</li>
        <li>Salve e tente novamente</li>
      </ol>
    </div>
  );
};

export default ConfigurationWarning;