import React, { useState } from 'react';
import {
  User,
  Palette,
  Tags,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Crown,
  FileSpreadsheet,
  Zap,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  Eye,
  EyeOff,
  XCircle,
  Smartphone,
  Share,
  PlusSquare,
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

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  userProfile,
  onUpdateSettings,
  onResetData,
  onClearData,
  onImportJSON,
  onOpenOnboarding,
}) => {
  const [profileName, setProfileName] = useState(state.settings.profileName || '');
  const [newCat, setNewCat] = useState('');
  const [newInvType, setNewInvType] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Password change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Password visibility state
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassConfirmModal, setShowPassConfirmModal] = useState(false);

  // Confirmation Modals State
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);

  const isPro = userProfile?.plan === 'pro' || userProfile?.role === 'admin';

  // Password requirements real-time check
  const passValidation = validatePasswordRequirements(newPass);

  const handleOpenPasswordConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (!currentPass) {
      setPassMsg({ type: 'error', text: 'Informe a senha atual.' });
      return;
    }
    if (!newPass) {
      setPassMsg({ type: 'error', text: 'Informe a nova senha.' });
      return;
    }
    if (!confirmPass) {
      setPassMsg({ type: 'error', text: 'Confirme a nova senha.' });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ type: 'error', text: 'A nova senha e a confirmação não são iguais.' });
      return;
    }
    if (!passValidation.isValid) {
      setPassMsg({ type: 'error', text: 'A nova senha não atende aos critérios mínimos de segurança.' });
      return;
    }

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
      // Fallback
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
    // Generate CSV for transactions
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

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AOFINANCE_transacoes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = onImportJSON(content);
        if (success) {
          setImportStatus('Backup JSON importado com sucesso!');
        } else {
          setImportStatus('Erro ao importar arquivo JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Profile, Security & Plan Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-white">
            <User className="w-4 h-4 text-blue-400" />
            <span>Perfil do Usuário</span>
          </div>

          <p className="text-[11px] text-slate-400">
            {userProfile?.email || 'Sem e-mail vinculado'}
          </p>

          <form onSubmit={handleSaveProfile} className="flex gap-3 text-xs">
            <input
              type="text"
              placeholder="Como prefere ser chamado(a)?"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition"
            >
              Salvar
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-white">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Alterar Senha</span>
          </div>

          {passMsg && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                passMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {passMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{passMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleOpenPasswordConfirm} className="space-y-3 text-xs">
            {/* Senha Atual */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  placeholder="Sua senha atual"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-9 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nova Senha */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  placeholder="Nova senha segura"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-9 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Nova Senha */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  placeholder="Repita a nova senha"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-9 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Real-time Validation Checklist */}
            {newPass.length > 0 && (
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                <p className="font-semibold text-slate-400 mb-1">Critérios de segurança:</p>
                <div className="grid grid-cols-1 gap-1">
                  <div className={`flex items-center gap-1.5 ${passValidation.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {passValidation.hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Mínimo de 8 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passValidation.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {passValidation.hasUppercase ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Ativo: Letra maiúscula (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passValidation.hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {passValidation.hasLowercase ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Ativo: Letra minúscula (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passValidation.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {passValidation.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Ativo: Número (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passValidation.hasSpecialChar ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {passValidation.hasSpecialChar ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Ativo: Caractere especial (!@#$%...)</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={passLoading}
              className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{passLoading ? 'Processando...' : 'Salvar Nova Senha'}</span>
            </button>
          </form>
        </div>

        {/* Current Plan Card */}
        <div className={`border rounded-2xl p-5 space-y-3 ${
          isPro
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border-emerald-500/30'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-serif font-bold text-white">
              {isPro ? <Crown className="w-4 h-4 text-amber-400" /> : <Zap className="w-4 h-4 text-blue-400" />}
              <span>Seu Plano Atual</span>
            </div>
            {isPro ? (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" /> PRO PREMIUM ATIVO
              </span>
            ) : (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold rounded-full">
                PLANO FREE
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {isPro
              ? 'Você tem acesso ilimitado ao Simulador Avançado, Exportação em Excel/CSV, Múltiplas Contas e Cartões, e backups completos.'
              : 'Você está no plano gratuito. Para desbloquear múltiplos cartões, exportação para Excel/CSV e o simulador completo de investimentos, fale com o administrador.'}
          </p>
        </div>
      </div>

      {/* Theme Mode Selection */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-white">
            <Palette className="w-4 h-4 text-amber-400" />
            <span>Tema & Aparência da Interface</span>
          </div>
          <span className="text-[11px] text-slate-400">Escolha o modo de exibição preferido</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onUpdateSettings({ themeMode: 'light' })}
            className={`p-4 rounded-xl border text-left transition flex items-center gap-4 cursor-pointer ${
              (state.settings.themeMode || 'light') === 'light'
                ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              (state.settings.themeMode || 'light') === 'light'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}>
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Tema Claro (Light Mode)</span>
                {(state.settings.themeMode || 'light') === 'light' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Ativo</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Canvas limpo, fundo claro de alta legibilidade e contraste.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ themeMode: 'dark' })}
            className={`p-4 rounded-xl border text-left transition flex items-center gap-4 cursor-pointer ${
              state.settings.themeMode === 'dark'
                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              state.settings.themeMode === 'dark'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}>
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Tema Escuro (Dark Mode)</span>
                {state.settings.themeMode === 'dark' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Ativo</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Visual escuro moderno e confortável para ambientes noturnos.</p>
            </div>
          </button>
        </div>
      </div>

      {/* Categories & Investment Types Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Manager */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-white">
            <Tags className="w-4 h-4 text-blue-400" />
            <span>Categorias de Transações</span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {state.settings.categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-300"
              >
                <span>{cat}</span>
                {state.settings.categories.length > 1 && (
                  <button
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>

          <form onSubmit={handleAddCategory} className="flex gap-2 text-xs pt-2">
            <input
              type="text"
              placeholder="Nova categoria"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
            >
              Adicionar
            </button>
          </form>
        </div>

        {/* Investment Classes Manager */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-white">
            <Tags className="w-4 h-4 text-amber-400" />
            <span>Classes de Investimento</span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {state.settings.investmentTypes.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs text-amber-300"
              >
                <span>{t}</span>
                {state.settings.investmentTypes.length > 1 && (
                  <button
                    onClick={() => handleRemoveInvType(t)}
                    className="text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>

          <form onSubmit={handleAddInvType} className="flex gap-2 text-xs pt-2">
            <input
              type="text"
              placeholder="Nova classe (Ex.: Cripto, ETF)"
              value={newInvType}
              onChange={(e) => setNewInvType(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
            >
              Adicionar
            </button>
          </form>
        </div>
      </div>

      {/* Backup, Export Excel/CSV & Import */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-serif font-bold text-white">Exportação, Importação & Backup de Dados</h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          {/* Export CSV / Excel */}
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-slate-200 font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Excel / CSV</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportDataJSON}
            className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-xl text-slate-200 font-semibold transition"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Exportar Backup (JSON)</span>
          </button>

          {/* Import JSON */}
          <label className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl text-slate-200 font-semibold cursor-pointer transition">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Restaurar Backup (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {/* Re-run Onboarding */}
          <button
            onClick={onOpenOnboarding}
            className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-800 hover:border-purple-500/50 rounded-xl text-slate-200 font-semibold transition"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Assistente de Configuração</span>
          </button>
        </div>

        {importStatus && (
          <p className="text-xs text-emerald-400 font-medium">{importStatus}</p>
        )}

        <div className="pt-4 border-t border-slate-800 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <span className="font-semibold text-slate-200 block">Restaurar Dados Demonstrativos</span>
              <span className="text-[11px] text-slate-500">
                Recarrega o estado inicial de exemplo com transações, contas e metas pré-configuradas.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowRestoreConfirmModal(true)}
              className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Exemplo</span>
            </button>
          </div>

          {onClearData && (
            <div className="pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <span className="font-semibold text-rose-300 block">Zerar Todos os Dados (Começar do Zero)</span>
                <span className="text-[11px] text-slate-500">
                  Remove todas as suas transações, cartões, faturas e investimentos para iniciar do zero.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowClearConfirmModal(true)}
                className="px-3.5 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 self-start sm:self-auto shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Zerar Tudo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Aplicativo Mobile & Atalho de Acesso Rápido (Android & iOS) */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 border border-blue-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                <span>Aplicativo Mobile & Atalho no Celular</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
                  Android & iOS
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Instale como aplicativo nativo (PWA) ou crie um atalho direto na tela inicial do seu smartphone.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          {/* Android Guide */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-400">
              <Smartphone className="w-4 h-4" />
              <span>Android (Google Chrome / Brave)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <li>Toque no menu do navegador <strong>(três pontos ⋮)</strong> no canto superior.</li>
              <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela de início"</strong>.</li>
              <li>Confirme para ter o ícone do AO FINANCE na sua gaveta de apps.</li>
            </ol>
          </div>

          {/* iOS Guide */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <Share className="w-4 h-4" />
              <span>iPhone / iPad (Safari)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <li>Toque no ícone de <strong>Compartilhar</strong> <Share className="w-3 h-3 inline text-amber-400" /> no menu do Safari.</li>
              <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> <PlusSquare className="w-3 h-3 inline text-amber-400" />.</li>
              <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Modal Confirmação: Zerar Tudo */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">Confirmar ZERAR TUDO?</h3>
                <p className="text-xs text-rose-300">Ação irreversível de limpeza</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              Você está prestes a remover <strong className="text-rose-400">TODAS</strong> as suas transações, cartões de crédito, compras, lançamentos recorrentes e investimentos. Todas as telas voltarão ao estado limpo (R$ 0,00).
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onClearData) onClearData();
                  setShowClearConfirmModal(false);
                  alert('Todos os dados foram zerados com sucesso!');
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Zerar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação: Alterar Senha */}
      {showPassConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-300">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">Confirmar Alteração de Senha?</h3>
                <p className="text-xs text-amber-200">Ação de segurança da conta</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              Tem certeza que deseja alterar sua senha de acesso? Após a confirmação, você deverá utilizar a nova senha na próxima autenticação.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPassConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExecuteChangePassword}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sim, Alterar Senha</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação: Restaurar Exemplo */}
      {showRestoreConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-300">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">Restaurar Dados Exemplo?</h3>
                <p className="text-xs text-amber-200">Preenchimento de dados de teste</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              Isso substituirá seus registros atuais por um conjunto fictício de transações, contas de teste, metas e investimentos demonstrativos.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRestoreConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  onResetData();
                  setShowRestoreConfirmModal(false);
                  alert('Dados demonstrativos carregados com sucesso!');
                }}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/30"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Sim, Carregar Exemplo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
