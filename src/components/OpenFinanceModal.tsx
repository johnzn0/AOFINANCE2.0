import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Landmark, ShieldCheck, Loader2 } from 'lucide-react';
import { PluggyConnect } from 'react-pluggy-connect';

interface OpenFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (accounts: any[]) => void;
}

export function OpenFinanceModal({ isOpen, onClose, onSuccess }: OpenFinanceModalProps) {
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOpen && !connectToken) {
      fetchConnectToken();
    }
  }, [isOpen]);

  const fetchConnectToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pluggy/token', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Falha ao conectar.');
      setConnectToken(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOnSuccess = async (itemData: any) => {
    const { item } = itemData;
    setSyncing(true);
    
    // Pequeno delay para garantir que o webhook do Pluggy ou a sincronização terminou
    // (Em produção real, você usaria webhooks para ser notificado)
    await new Promise(r => setTimeout(r, 2000));
    
    try {
      const res = await fetch('/api/pluggy/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao sincronizar dados');
      
      onSuccess(data.accounts);
      onClose();
    } catch (err: any) {
      setError(err.message);
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Landmark className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-white">Open Finance</h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {!connectToken && loading && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
                <p className="text-slate-300">Iniciando ambiente seguro...</p>
              </div>
            )}
            
            {!connectToken && !loading && error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <p className="text-rose-400 text-sm font-medium mb-4">{error}</p>
                <button
                  onClick={fetchConnectToken}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
            
            {connectToken && !syncing && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-emerald-300 font-medium mb-1">Acesso Somente Leitura</p>
                    <p className="text-emerald-400/80">
                      Sua segurança é nossa prioridade. Este processo utiliza criptografia de ponta a ponta. 
                      Nós apenas lemos seus saldos e não temos permissão para realizar transações, nem armazenamos suas credenciais do banco.
                    </p>
                  </div>
                </div>
                
                <PluggyConnect
                  connectToken={connectToken}
                  includeSandbox={true}
                  onSuccess={handleOnSuccess}
                  onError={(err) => setError(err.message)}
                  onClose={() => {
                    // Do nothing on widget close, let user click X on our modal
                  }}
                />
                
                {error && (
                  <p className="text-sm text-rose-400 text-center">{error}</p>
                )}
              </div>
            )}
            
            {syncing && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Sincronizando Contas</h3>
                <p className="text-slate-400 text-sm text-center">
                  Estamos criptografando e importando os dados das suas contas em modo somente leitura...
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
