import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, User, Clock, AlertTriangle, ArrowRight, LogOut, CheckCircle2, Building2 } from 'lucide-react';
import { UserProfile } from '../../types';

interface LoginViewProps {
  onLoginWithGoogle?: () => Promise<void>;
  onLoginWithEmail: (email: string, pass: string) => Promise<void>;
  onRegisterWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  onResetPassword?: (email: string, newPass?: string) => Promise<void>;
  onLogout: () => Promise<void>;
  userProfile: UserProfile | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginWithEmail,
  onRegisterWithEmail,
  onResetPassword,
  onLogout,
  userProfile,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email.trim()) {
      setErrorMsg('Por favor, informe seu e-mail.');
      return;
    }
    setLoading(true);
    try {
      if (onResetPassword) {
        await onResetPassword(email.trim(), newResetPassword.trim() || undefined);
      }
      if (newResetPassword.trim()) {
        setSuccessMsg(`Senha alterada com sucesso para ${email.trim()}! Você já pode entrar com a nova senha.`);
        setNewResetPassword('');
      } else {
        setSuccessMsg(`Instruções ou redefinição registradas para ${email.trim()}! Verifique sua caixa de entrada/spam.`);
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMsg(err.message || 'Erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Por favor, informe seu nome completo.');
        if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
        await onRegisterWithEmail(email.trim(), password, name.trim());
      } else {
        await onLoginWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Ocorreu um erro no acesso.';
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'O login por E-mail/Senha não está ativado no Firebase Console. Entre com o Google ou clique em "Entrar como Convidado" abaixo.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Este e-mail já está cadastrado no sistema.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // If logged in but status is Pending Approval
  if (userProfile && userProfile.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-serif font-bold text-white">
              Acesso em Análise
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Olá, <strong className="text-amber-400">{userProfile.displayName || userProfile.email}</strong>! Seu cadastro foi recebido com sucesso e está na fila de <span className="text-white font-medium">aprovação do Administrador</span>.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>E-mail cadastrado:</span>
              <span className="font-mono text-slate-200">{userProfile.email}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Status atual:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-[10px]">
                <Clock className="w-3 h-3" /> Aguardando Aprovação
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Assim que o administrador aprovar seu perfil, o acesso aos seus dashboards e finanças será liberado automaticamente.
          </p>

          <button
            onClick={() => onLogout()}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    );
  }

  // If logged in but status is Rejected
  if (userProfile && userProfile.status === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-serif font-bold text-white">
              Acesso Não Aprovado
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              O acesso para a conta <strong className="text-rose-400">{userProfile.email}</strong> não foi aprovado pelo administrador do sistema.
            </p>
          </div>

          <button
            onClick={() => onLogout()}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Voltar à Tela Inicial</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-md relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-amber-500 text-white font-serif font-black text-xl shadow-lg mb-2">
            AO
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
            AO FINANCE
          </h1>
          <p className="text-xs text-slate-400">
            Gestão Financeira Inteligente & Alta Performance
          </p>
        </div>

        {isForgotPassword ? (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <h2 className="text-sm font-bold text-white">Recuperar Senha</h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Digite seu e-mail cadastrado para receber as instruções de redefinição.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  E-mail Cadastrado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Nova Senha <span className="text-slate-500 font-normal">(Opcional)</span></span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="Digite para redefinir a senha na hora"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Se preenchido, sua senha será atualizada imediatamente no sistema sem depender de e-mail.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {loading ? 'Processando...' : newResetPassword.trim() ? 'Atualizar Senha Agora' : 'Enviar Instruções de Recuperação'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="w-full py-2 text-center text-slate-400 hover:text-white font-medium text-xs transition block"
            >
              ← Voltar para o Login
            </button>
          </div>
        ) : (
          <>
            {/* Toggle Login / Register */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl transition ${
                  !isRegister
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl transition ${
                  isRegister
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Criar Conta
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {isRegister && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-300">
                    Senha
                  </label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium hover:underline transition"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {loading ? (
                  <span>Aguarde...</span>
                ) : (
                  <>
                    <span>{isRegister ? 'Cadastrar e Solicitar Acesso' : 'Acessar Sistema'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <p className="text-[10px] text-slate-500 text-center leading-relaxed">
          O sistema utiliza autenticação própria e banco de dados Cloud SQL PostgreSQL de alta performance.
        </p>
      </div>
    </div>
  );
};
