import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, User, Clock, AlertTriangle, ArrowRight, LogOut, CheckCircle2, Building2 } from 'lucide-react';
import { UserProfile } from '../../types';

interface LoginViewProps {
  onLoginWithGoogle: () => Promise<void>;
  onLoginWithEmail: (email: string, pass: string) => Promise<void>;
  onRegisterWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  onResetPassword?: (email: string) => Promise<void>;
  onLogout: () => Promise<void>;
  userProfile: UserProfile | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginWithGoogle,
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
        await onResetPassword(email.trim());
      }
      setSuccessMsg(`Instruções enviadas com sucesso para ${email.trim()}! Verifique sua caixa de entrada e spam.`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMsg(err.message || 'Erro ao solicitar redefinição de senha.');
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

  const handleGoogle = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await onLoginWithGoogle();
    } catch (err: any) {
      console.error('Google Auth error:', err);
      let msg = err?.message || 'Erro ao conectar com o Google.';
      if (err?.code === 'auth/popup-blocked') {
        msg = 'O pop-up de login foi bloqueado pelo seu navegador. Por favor, permita pop-ups para este site.';
      } else if (err?.code === 'auth/popup-closed-by-user') {
        msg = 'Janela de login fechada antes da conclusão.';
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Instruções de Recuperação'}
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

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Ou acesse com
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar com Google</span>
            </button>
          </>
        )}

        <p className="text-[10px] text-slate-500 text-center leading-relaxed">
          O sistema utiliza autenticação própria e banco de dados Cloud SQL PostgreSQL de alta performance.
        </p>
      </div>
    </div>
  );
};
