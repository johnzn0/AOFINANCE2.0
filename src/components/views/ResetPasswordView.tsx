import React, { useState, useEffect } from 'react';
import { Lock, AlertTriangle, CheckCircle2, ArrowRight, Eye, EyeOff, KeyRound, XCircle } from 'lucide-react';
import { verifyResetTokenApi, resetPasswordWithTokenApi } from '../../lib/api';
import { validatePasswordRequirements } from '../../utils/passwordValidator';

interface ResetPasswordViewProps {
  token: string;
  onGoToLogin: () => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ token, onGoToLogin }) => {
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const passValidation = validatePasswordRequirements(newPassword);

  useEffect(() => {
    let isMounted = true;
    async function checkToken() {
      setVerifying(true);
      setVerifyError(null);
      const res = await verifyResetTokenApi(token);
      if (!isMounted) return;

      if (res.valid) {
        setTokenValid(true);
        if (res.email) setUserEmail(res.email);
      } else {
        setTokenValid(false);
        setVerifyError(res.message || 'Este link de recuperação de senha é inválido ou já expirou.');
      }
      setVerifying(false);
    }

    if (token) {
      checkToken();
    } else {
      setVerifying(false);
      setVerifyError('Nenhum código de recuperação foi encontrado no link.');
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword) {
      setErrorMsg('Por favor, informe a nova senha.');
      return;
    }
    if (!confirmPassword) {
      setErrorMsg('Por favor, confirme a nova senha.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('A nova senha e a confirmação não correspondem.');
      return;
    }
    if (!passValidation.isValid) {
      setErrorMsg('A nova senha não atende a todos os critérios de segurança mínimos.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordWithTokenApi(token, newPassword);
      setSuccessMsg('Sua senha foi redefinida com sucesso! Você já pode entrar na sua conta com a nova senha.');
    } catch (err: any) {
      console.error('Reset token error:', err);
      setErrorMsg(err.message || 'Erro ao redefinir a senha.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

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
            Redefinição Segura de Senha
          </p>
        </div>

        {verifying ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Verificando validade do link de recuperação...</p>
          </div>
        ) : !tokenValid ? (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold text-white">Link Inválido ou Expirado</h2>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                {verifyError}
              </p>
            </div>

            <button
              type="button"
              onClick={onGoToLogin}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2"
            >
              <span>Voltar ao Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : successMsg ? (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold text-white">Senha Redefinida!</h2>
              <p className="text-xs text-emerald-300 bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/20 leading-relaxed">
                {successMsg}
              </p>
            </div>

            <button
              type="button"
              onClick={onGoToLogin}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <span>Acessar o Sistema com a Nova Senha</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-amber-400 font-bold">
                <KeyRound className="w-4 h-4" />
                <span>Nova Senha de Acesso</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {userEmail ? `Cadastre uma nova senha para ${userEmail}:` : 'Crie uma nova senha forte para acessar sua conta:'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Real-time Checklist */}
              {newPassword.length > 0 && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                  <p className="font-semibold text-slate-400 mb-1">Critérios de segurança da senha:</p>
                  <div className="grid grid-cols-1 gap-1">
                    <div className={`flex items-center gap-1.5 ${passValidation.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {passValidation.hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>Mínimo de 8 caracteres</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passValidation.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {passValidation.hasUppercase ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>Pelo menos 1 letra maiúscula (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passValidation.hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {passValidation.hasLowercase ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>Pelo menos 1 letra minúscula (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passValidation.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {passValidation.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>Pelo menos 1 número (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passValidation.hasSpecialChar ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {passValidation.hasSpecialChar ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>Pelo menos 1 caractere especial (!@#$%...)</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50"
              >
                {submitting ? 'Salvando Senha...' : 'Salvar Nova Senha'}
              </button>
            </form>

            <button
              type="button"
              onClick={onGoToLogin}
              className="w-full py-2 text-center text-slate-400 hover:text-white font-medium text-xs transition block"
            >
              ← Cancelar e Voltar para o Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
