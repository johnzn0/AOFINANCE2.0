import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Search,
  UserCheck,
  UserX,
  ShieldAlert,
  RefreshCw,
  Mail,
  Zap,
  Crown,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { UserProfile, UserStatus, UserRole, UserPlan } from '../../types';
import { fetchAdminUsers, updateAdminUser, deleteAdminUser } from '../../lib/api';

const ADMIN_EMAIL = 'johnozzi21@gmail.com';

interface AdminViewProps {
  currentUserEmail?: string;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUserEmail }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | UserStatus>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await fetchAdminUsers();
      setUsers(list);
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateStatus = async (uid: string, newStatus: UserStatus, targetEmail: string) => {
    try {
      await updateAdminUser(uid, { status: newStatus });
      setActionSuccess(`Status de ${targetEmail} atualizado para ${newStatus.toUpperCase()}`);
      setTimeout(() => setActionSuccess(null), 3000);
      loadUsers();
    } catch (err) {
      alert('Erro ao atualizar status do usuário.');
    }
  };

  const handleTogglePlan = async (uid: string, currentPlan: UserPlan = 'free', targetEmail: string) => {
    const nextPlan: UserPlan = currentPlan === 'pro' ? 'free' : 'pro';
    try {
      await updateAdminUser(uid, { status: 'approved', plan: nextPlan });
      setActionSuccess(`Plano de ${targetEmail} alterado para ${nextPlan.toUpperCase()}`);
      setTimeout(() => setActionSuccess(null), 3000);
      loadUsers();
    } catch (err) {
      alert('Erro ao alterar plano do usuário.');
    }
  };

  const handleToggleAdmin = async (uid: string, currentRole: UserRole, targetEmail: string) => {
    const nextRole: UserRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateAdminUser(uid, { status: 'approved', role: nextRole });
      setActionSuccess(`Permissão de ${targetEmail} alterada para ${nextRole.toUpperCase()}`);
      setTimeout(() => setActionSuccess(null), 3000);
      loadUsers();
    } catch (err) {
      alert('Erro ao alterar função.');
    }
  };

  const handleDeleteUser = async (uid: string, targetEmail: string) => {
    if (confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR DEFINITIVAMENTE o usuário ${targetEmail}? Esta ação removerá a conta e todos os dados dele.`)) {
      try {
        await deleteAdminUser(uid);
        setActionSuccess(`Usuário ${targetEmail} foi excluído do sistema.`);
        setTimeout(() => setActionSuccess(null), 3000);
        loadUsers();
      } catch (err: any) {
        alert(err?.message || 'Erro ao excluir usuário.');
      }
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.displayName || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const approvedCount = users.filter((u) => u.status === 'approved').length;
  const proCount = users.filter((u) => u.plan === 'pro').length;
  const freeCount = users.filter((u) => (u.plan || 'free') === 'free').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 bg-gradient-to-r from-blue-900/30 via-transparent to-transparent border border-blue-500/30 rounded-2xl p-6 space-y-2">
        <div className="flex items-center gap-2 text-blue-400">
          <Shield className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Painel do Administrador & Vendas
          </span>
        </div>
        <h2 className="text-xl font-serif font-bold text-white">
          Gestão de Assinantes, Planos & Aprovações
        </h2>
        <p className="text-xs text-slate-300 max-w-2xl">
          Como administrador (<strong className="text-blue-400">{currentUserEmail || ADMIN_EMAIL}</strong>), você pode aprovar novos clientes e alternar o plano deles entre <span className="text-amber-400 font-semibold">FREE</span> e <span className="text-emerald-400 font-semibold">PRO PREMIUM</span> conforme pagamentos ou negociações.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Total Usuários
          </span>
          <span className="text-2xl font-mono font-bold text-slate-200">
            {users.length}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4">
          <span className="text-xs text-amber-400 font-medium uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pendentes
          </span>
          <span className="text-2xl font-mono font-bold text-amber-400">
            {pendingCount}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4">
          <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-amber-400" /> Clientes PRO
          </span>
          <span className="text-2xl font-mono font-bold text-emerald-400">
            {proCount}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-4">
          <span className="text-xs text-blue-400 font-medium uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Clientes FREE
          </span>
          <span className="text-2xl font-mono font-bold text-blue-400">
            {freeCount}
          </span>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filter */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-center text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por e-mail ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition ${
                filterStatus === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'all'
                ? 'Todos'
                : st === 'pending'
                ? 'Pendentes'
                : st === 'approved'
                ? 'Aprovados'
                : 'Rejeitados'}
            </button>
          ))}
        </div>
      </div>

      {/* User Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Carregando lista de usuários...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhum usuário encontrado para estes filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Usuário</th>
                  <th className="p-4">Plano</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Data Cadastro</th>
                  <th className="p-4 text-right">Ações de Aprovação & Plano</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((u) => {
                  const isPrimaryAdmin = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                  const currentPlan = u.plan || 'free';

                  return (
                    <tr key={u.uid} className="hover:bg-slate-800/30 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold uppercase text-xs">
                            {(u.displayName || u.email)[0]}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">
                              {u.displayName || 'Sem nome'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        {currentPlan === 'pro' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm">
                            <Crown className="w-3 h-3 text-amber-400" /> PRO PREMIUM
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-slate-800 text-slate-400">
                            <Zap className="w-3 h-3 text-blue-400" /> FREE
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {u.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Aprovado
                          </span>
                        )}
                        {u.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-[10px]">
                            <Clock className="w-3 h-3 animate-pulse" /> Pendente
                          </span>
                        )}
                        {u.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-[10px]">
                            <XCircle className="w-3 h-3" /> Rejeitado
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="p-4 text-right">
                        {isPrimaryAdmin ? (
                          <span className="text-[11px] text-slate-500 italic">
                            Admin Principal (PRO)
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {/* Toggle Plan Button */}
                            <button
                              onClick={() => handleTogglePlan(u.uid, currentPlan, u.email)}
                              className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition flex items-center gap-1 border ${
                                currentPlan === 'pro'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30'
                              }`}
                              title="Alternar Plano Free / Pro"
                            >
                              <Crown className="w-3.5 h-3.5" />
                              <span>{currentPlan === 'pro' ? 'Mudar p/ FREE' : 'Promover PRO'}</span>
                            </button>

                            {u.status !== 'approved' && (
                              <button
                                onClick={() => handleUpdateStatus(u.uid, 'approved', u.email)}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-[11px] transition flex items-center gap-1 shadow-md"
                                title="Aprovar Acesso"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Aprovar</span>
                              </button>
                            )}

                            {u.status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateStatus(u.uid, 'rejected', u.email)}
                                className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg font-semibold text-[11px] transition flex items-center gap-1"
                                title="Bloquear / Rejeitar Acesso"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Bloquear</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteUser(u.uid, u.email)}
                              className="px-2 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 rounded-lg font-semibold text-[11px] transition flex items-center gap-1"
                              title="Excluir Usuário Definitivamente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="sr-only sm:not-sr-only">Excluir</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
