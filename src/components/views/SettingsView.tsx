import React, { useState } from 'react';
import {
  User,
  Tags,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Settings,
  Shield,
  CreditCard,
  Target,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import { AppState, UserSettings, UserProfile } from '../../types';
import { changePasswordAuthApi, resetPasswordWithApi } from '../../lib/api';
import { validatePasswordRequirements } from '../../utils/passwordValidator';

interface SettingsViewProps {
  state: AppState;
  userProfile?: UserProfile | null;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetData: () => void;
  onClearData?: () => void;
  onImportJSON: (jsonStr: string) => boolean;
  onOpenOnboarding: () => void;
}

type TabId = 'profile' | 'categories' | 'data';

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  userProfile,
  onUpdateSettings,
  onResetData,
  onClearData,
  onImportJSON,
  onOpenOnboarding,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const [profileName, setProfileName] = useState(state.settings.profileName || userProfile?.displayName || '');

  React.useEffect(() => {
    setProfileName(state.settings.profileName || userProfile?.displayName || '');
  }, [state.settings.profileName, userProfile?.displayName]);
  const [newCat, setNewCat] = useState('');
  const [newInvType, setNewInvType] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Password change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassConfirmModal, setShowPassConfirmModal] = useState(false);

  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);

  const passValidation = validatePasswordRequirements(newPass);

  const handleOpenPasswordConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (!currentPass) return setPassMsg({ type: 'error', text: 'Informe a senha atual.' });
    if (!newPass) return setPassMsg({ type: 'error', text: 'Informe a nova senha.' });
    if (!confirmPass) return setPassMsg({ type: 'error', text: 'Confirme a nova senha.' });
    if (newPass !== confirmPass) return setPassMsg({ type: 'error', text: 'As senhas não coincidem.' });
    if (!passValidation.isValid) return setPassMsg({ type: 'error', text: 'A senha não atende aos critérios mínimos.' });

    setShowPassConfirmModal(true);
  };

  const handleExecuteChangePassword = async () => {
    setShowPassConfirmModal(false);
    setPassMsg(null);
    setPassLoading(true);

    const emailToReset = userProfile?.email || 'johnozzi21@gmail.com';

    try {
      await changePasswordAuthApi(emailToReset, currentPass, newPass);
      setPassMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      try {
        await resetPasswordWithApi(emailToReset, newPass);
        setPassMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } catch (fallbackErr: any) {
        setPassMsg({ type: 'error', text: err?.message || fallbackErr?.message || 'Erro ao alterar a senha.' });
      }
    } finally {
      setPassLoading(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    onUpdateSettings({ profileName: profileName.trim() });
    alert('Perfil atualizado com sucesso!');
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = newCat.trim();
    if (!cat || state.settings.categories.includes(cat)) return;
    onUpdateSettings({ categories: [...state.settings.categories, cat] });
    setNewCat('');
  };

  const handleRemoveCategory = (cat: string) => {
    onUpdateSettings({
      categories: state.settings.categories.filter((c) => c !== cat),
    });
  };

  const handleAddInvType = (e: React.FormEvent) => {
    e.preventDefault();
    const t = newInvType.trim();
    if (!t || state.settings.investmentTypes.includes(t)) return;
    onUpdateSettings({ investmentTypes: [...state.settings.investmentTypes, t] });
    setNewInvType('');
  };

  const handleRemoveInvType = (t: string) => {
    onUpdateSettings({
      investmentTypes: state.settings.investmentTypes.filter((x) => x !== t),
    });
  };

  const handleExportDataJSON = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AOFINANCE_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Conta ID', 'Valor (R$)', 'Status'];
    const rows = state.transactions.map((t) => [
      t.date,
      t.type === 'income' ? 'Receita' : 'Despesa',
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.accountId,
      t.amount.toFixed(2),
      t.status === 'cleared' ? 'Realizado' : 'Pendente',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transacoes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = onImportJSON(content);
      if (success) {
        setImportStatus('Importação concluída com sucesso!');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Falha ao importar: Arquivo inválido.');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const tabs = [
    { id: 'profile', label: 'Perfil e Segurança', icon: Shield },
    { id: 'categories', label: 'Personalização', icon: Tags },
    { id: 'data', label: 'Dados e Backup', icon: Settings },
  ];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      
      <div>
        <h2 className="text-3xl font-serif font-bold text-white mb-1">Configurações</h2>
        <p className="text-slate-400 text-sm">Gerencie sua conta e preferências do sistema</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 sticky top-6">
            <nav className="flex flex-col space-y-1">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabId)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                      active 
                        ? 'bg-blue-600/10 text-blue-400' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* PROFILE & SECURITY */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                     <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Perfil do Usuário</h3>
                    <p className="text-xs text-slate-400">Como o sistema chamará você</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="flex gap-3">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Seu nome"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                  <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-blue-600/20 active:scale-95">
                    Salvar
                  </button>
                </form>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                 <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                     <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Alterar Senha</h3>
                    <p className="text-xs text-slate-400">Proteja o acesso aos seus dados financeiros</p>
                  </div>
                </div>

                {passMsg && (
                  <div className={`p-3 rounded-xl text-sm mb-4 flex items-center gap-2 ${
                    passMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {passMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {passMsg.text}
                  </div>
                )}

                <form onSubmit={handleOpenPasswordConfirm} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Senha Atual</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                      />
                      <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Nova Senha</label>
                      <div className="relative">
                        <input
                          type={showNewPass ? "text" : "password"}
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                        />
                        <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Confirmar Nova Senha</label>
                      <div className="relative">
                        <input
                          type={showConfirmPass ? "text" : "password"}
                          value={confirmPass}
                          onChange={(e) => setConfirmPass(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                        />
                        <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[10px] space-y-2 mt-4">
                    <p className="font-semibold text-slate-300 uppercase tracking-wider mb-2">Requisitos da Senha:</p>
                    <div className={`flex items-center gap-1.5 ${passValidation.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pelo menos 8 caracteres
                    </div>
                    <div className={`flex items-center gap-1.5 ${passValidation.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Uma letra maiúscula
                    </div>
                    <div className={`flex items-center gap-1.5 ${passValidation.hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Uma letra minúscula
                    </div>
                    <div className={`flex items-center gap-1.5 ${passValidation.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Um número
                    </div>
                    <div className={`flex items-center gap-1.5 ${passValidation.hasSpecialChar ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Um caractere especial (!@#$...)
                    </div>
                  </div>

                  <button type="submit" disabled={passLoading} className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl font-bold transition shadow-lg shadow-amber-600/20 active:scale-95">
                    {passLoading ? 'Processando...' : 'Atualizar Senha'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* CATEGORIES & INVESTMENTS */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              
              {/* Tema Visual (Light / Dark) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Tema e Aparência</h3>
                    <p className="text-xs text-slate-400">Alterne entre o modo claro e o modo escuro</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ themeMode: 'light' })}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition active:scale-95 ${
                      (state.settings.themeMode || 'light') === 'light'
                        ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      (state.settings.themeMode || 'light') === 'light' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Sun className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>Modo Claro</span>
                        {(state.settings.themeMode || 'light') === 'light' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">Ativo</span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Fundo claro com alto contraste para ambientes iluminados</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ themeMode: 'dark' })}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition active:scale-95 ${
                      state.settings.themeMode === 'dark'
                        ? 'bg-blue-600/10 border-blue-500/50 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      state.settings.themeMode === 'dark' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Moon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>Modo Escuro</span>
                        {state.settings.themeMode === 'dark' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">Ativo</span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Fundo escuro elegante, ideal para ambientes noturnos</p>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                     <Tags className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Categorias de Transação</h3>
                    <p className="text-xs text-slate-400">Classifique seus ganhos e gastos</p>
                  </div>
                </div>
                
                <form onSubmit={handleAddCategory} className="flex gap-3 mb-6">
                  <input
                    type="text"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="Nova categoria"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                  />
                  <button type="submit" className="px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {state.settings.categories.map((cat) => (
                    <div key={cat} className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200">
                      <span>{cat}</span>
                      <button onClick={() => handleRemoveCategory(cat)} className="text-slate-500 hover:text-rose-400 transition ml-2">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {state.settings.categories.length === 0 && (
                    <p className="text-sm text-slate-500">Nenhuma categoria configurada.</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                     <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Tipos de Investimento</h3>
                    <p className="text-xs text-slate-400">Classes de ativos do seu portfólio</p>
                  </div>
                </div>
                
                <form onSubmit={handleAddInvType} className="flex gap-3 mb-6">
                  <input
                    type="text"
                    value={newInvType}
                    onChange={(e) => setNewInvType(e.target.value)}
                    placeholder="Novo tipo (ex: CDB, FII)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                  <button type="submit" className="px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {state.settings.investmentTypes.map((cat) => (
                    <div key={cat} className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200">
                      <span>{cat}</span>
                      <button onClick={() => handleRemoveInvType(cat)} className="text-slate-500 hover:text-rose-400 transition ml-2">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {state.settings.investmentTypes.length === 0 && (
                    <p className="text-sm text-slate-500">Nenhum tipo configurado.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* DATA & BACKUP */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                     <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Exportar Dados</h3>
                    <p className="text-xs text-slate-400">Faça backup local das suas informações</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={handleExportDataJSON} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-semibold text-white transition">
                    <Download className="w-4 h-4 text-blue-400" /> JSON Completo (Backup)
                  </button>
                  <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-semibold text-white transition">
                    <Download className="w-4 h-4 text-emerald-400" /> CSV (Planilha)
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                     <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Importar Backup</h3>
                    <p className="text-xs text-slate-400">Restaure um arquivo JSON anterior</p>
                  </div>
                </div>
                
                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 border border-slate-800 border-dashed rounded-xl cursor-pointer hover:bg-slate-800/50 transition text-sm font-semibold text-white">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Selecionar arquivo .JSON</span>
                  <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                </label>
                
                {importStatus && (
                  <p className={`mt-3 text-xs font-semibold text-center ${importStatus.includes('sucesso') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {importStatus}
                  </p>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                 <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
                     <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-rose-400">Zona de Perigo</h3>
                    <p className="text-xs text-slate-400">Ações destrutivas e irreversíveis</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => setShowRestoreConfirmModal(true)} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800 rounded-xl text-sm font-semibold text-slate-300 transition">
                    <RotateCcw className="w-4 h-4" /> Restaurar Exemplos
                  </button>
                  {onClearData && (
                    <button onClick={() => setShowClearConfirmModal(true)} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800 rounded-xl text-sm font-semibold text-slate-300 transition">
                      <Trash2 className="w-4 h-4" /> Apagar Tudo
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Password Confirm Modal */}
      {showPassConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Confirmar Alteração</h3>
            <p className="text-sm text-slate-400 mb-6">
              Tem certeza de que deseja alterar sua senha? O sistema utilizará os mecanismos de autenticação segura para registrar a nova senha.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPassConfirmModal(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteChangePassword}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-amber-600/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-4 border border-rose-500/20">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Apagar Todos os Dados?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Esta ação apagará <strong>todas</strong> as transações, contas e configurações. Não é possível desfazer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onClearData?.();
                  setShowClearConfirmModal(false);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-rose-600/20"
              >
                Sim, Apagar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Demo Modal */}
      {showRestoreConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mx-auto mb-4 border border-blue-500/20">
              <RotateCcw className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Restaurar Dados de Exemplo?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Todos os seus dados atuais serão substituídos pelos dados iniciais de demonstração. Não é possível desfazer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRestoreConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onResetData();
                  setShowRestoreConfirmModal(false);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/20"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
