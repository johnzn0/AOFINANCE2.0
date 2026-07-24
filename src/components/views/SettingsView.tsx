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
} from 'lucide-react';
import { AppState, UserSettings } from '../../types';

interface SettingsViewProps {
  state: AppState;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetData: () => void;
  onImportJSON: (jsonStr: string) => boolean;
  onOpenOnboarding: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  onUpdateSettings,
  onResetData,
  onImportJSON,
  onOpenOnboarding,
}) => {
  const [profileName, setProfileName] = useState(state.settings.profileName || '');
  const [newCat, setNewCat] = useState('');
  const [newInvType, setNewInvType] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

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

  const handleExportData = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AOFINANCE_backup_${new Date().toISOString().slice(0, 10)}.json`;
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
          setImportStatus('Backup importado com sucesso!');
        } else {
          setImportStatus('Erro ao importar arquivo JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-serif font-bold text-white">
          <User className="w-4 h-4 text-blue-400" />
          <span>Perfil do Usuário</span>
        </div>

        <form onSubmit={handleSaveProfile} className="flex gap-3 max-w-md text-xs">
          <input
            type="text"
            placeholder="Como prefere ser chamado(a)?"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition"
          >
            Salvar
          </button>
        </form>
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

      {/* Backup, Import & Reset Data */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-serif font-bold text-white">Gestão e Backup de Dados</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Export JSON */}
          <button
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-xl text-slate-200 font-semibold transition"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Exportar Backup (JSON)</span>
          </button>

          {/* Import JSON */}
          <label className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-slate-200 font-semibold cursor-pointer transition">
            <Upload className="w-4 h-4 text-emerald-400" />
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

        <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
          <div>
            <span className="font-semibold text-slate-300 block">Restaurar Dados Demonstrativos</span>
            <span className="text-[11px] text-slate-500">
              Recarrega o estado de exemplo com transações, contas e metas pré-configuradas.
            </span>
          </div>

          <button
            onClick={() => {
              if (confirm('Deseja mesmo restaurar os dados de demonstração?')) {
                onResetData();
                alert('Dados restaurados com sucesso!');
              }
            }}
            className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-lg font-semibold transition flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetar Dados</span>
          </button>
        </div>
      </div>
    </div>
  );
};
