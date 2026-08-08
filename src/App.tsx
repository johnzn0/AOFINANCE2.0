import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinance } from './hooks/useFinance';
import { setHideValues } from './utils/formatters';
import { TabPage } from './types';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Header } from './components/Header';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { GoalContribModal } from './components/GoalContribModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { saveStateToOfflineCache, saveProfileToOfflineCache } from './mobile/offlineStore';

// Views
import { LoginView } from './components/views/LoginView';
import { AdminView } from './components/views/AdminView';
import { OverviewView } from './components/views/OverviewView';
import { TransactionsView } from './components/views/TransactionsView';
import { AccountsCardsView } from './components/views/AccountsCardsView';
import { InvestmentsView } from './components/views/InvestmentsView';
import { GoalsView } from './components/views/GoalsView';
import { AnnualView } from './components/views/AnnualView';
import { ReportsView } from './components/views/ReportsView';
import { CalendarView } from './components/views/CalendarView';
import { SimulatorView } from './components/views/SimulatorView';
import { SettingsView } from './components/views/SettingsView';
import { ResetPasswordView } from './components/views/ResetPasswordView';

export default function App() {
  const finance = useFinance();
  const [currentPage, setCurrentPage] = useState<TabPage>('overview');

  // Detect reset token in URL
  const [urlResetToken, setUrlResetToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token');
    }
    return null;
  });

  // Modal active IDs
  const [contribGoalId, setContribGoalId] = useState<string | null>(null);
  const [withdrawInvId, setWithdrawInvId] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Clear reset token URL param
  const handleClearResetToken = () => {
    if (typeof window !== 'undefined') {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    setUrlResetToken(null);
  };

  // If URL has a reset token, render ResetPasswordView
  if (urlResetToken) {
    return (
      <ResetPasswordView
        token={urlResetToken}
        onGoToLogin={handleClearResetToken}
      />
    );
  }

  // Auto offline cache for mobile performance
  useEffect(() => {
    if (finance.state) {
      saveStateToOfflineCache(finance.state);
    }
  }, [finance.state]);

  useEffect(() => {
    if (finance.userProfile) {
      saveProfileToOfflineCache(finance.userProfile);
    }
  }, [finance.userProfile]);

  // Loading state
  if (finance.isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-full border-2 border-blue-500 bg-slate-950 text-blue-400 font-serif font-bold text-2xl flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/20 mb-3">
          AO
        </div>
        <p className="text-xs text-slate-400 font-medium">Iniciando AO FINANCE...</p>
      </div>
    );
  }

  // Auth Guard: Show Login / Status Screen if not logged in or not approved
  if (!finance.currentUser || !finance.userProfile || finance.userProfile.status !== 'approved') {
    return (
      <LoginView
        onLoginWithGoogle={finance.loginWithGoogle}
        onLoginWithEmail={finance.loginWithEmail}
        onRegisterWithEmail={finance.registerWithEmail}
        onResetPassword={finance.resetPassword}
        onLogout={finance.logout}
        userProfile={finance.userProfile}
      />
    );
  }

  const selectedGoalForContrib =
    finance.state.goals.find((g) => g.id === contribGoalId) || null;
  const selectedInvForWithdraw =
    finance.state.investments.find((i) => i.id === withdrawInvId) || null;

  const handleOnboardingComplete = (data: {
    name: string;
    salary: number;
    banks: string[];
    cards: string[];
    goalName: string;
    goalTarget: number;
    categories: string[];
  }) => {
    finance.updateSettings({
      profileName: data.name,
      categories: data.categories.length ? data.categories : finance.state.settings.categories,
      hasCompletedSetup: true,
    });

    if (data.banks.length > 0) {
      data.banks.forEach((bName, idx) => {
        if (idx === 0) {
          finance.state.accounts[0].name = bName;
        } else {
          finance.addAccount(bName);
        }
      });
    }

    if (data.cards.length > 0) {
      data.cards.forEach((cName) => {
        finance.addCard({
          name: cName,
          limit: 5000,
          closingDay: 10,
          dueDay: 17,
        });
      });
    }

    if (data.goalName && data.goalTarget > 0) {
      finance.addGoal({
        name: data.goalName,
        kind: 'meta',
        target: data.goalTarget,
      });
    }

    
  };

  const themeMode = finance.state.settings.themeMode || 'light';
  const hideValues = finance.state.settings.hideValues || false;
  setHideValues(hideValues);

  return (
    <div className={`${themeMode === 'light' ? 'light-theme bg-slate-50 text-slate-900' : 'dark-theme bg-slate-950 text-slate-100'} ${hideValues ? 'hide-values' : ''} min-h-screen flex flex-col font-sans selection:bg-blue-500 selection:text-white transition-colors duration-200`}>
      <PWAInstallBanner
        forceShowModal={isInstallModalOpen}
        onCloseModal={() => setIsInstallModalOpen(false)}
      />
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        cursor={finance.cursor}
        onShiftMonth={finance.shiftMonth}
        state={finance.state}
        userProfile={finance.userProfile}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        <Header
          currentPage={currentPage}
          cursor={finance.cursor}
          onShiftMonth={finance.shiftMonth}
          onSelectPage={setCurrentPage}
          state={finance.state}
          userProfile={finance.userProfile}
          onLogout={finance.logout}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          isCloudSynced={finance.isCloudSynced}
          onToggleTheme={() => finance.updateSettings({ themeMode: themeMode === 'light' ? 'dark' : 'light' })}
          onToggleHideValues={() => finance.updateSettings({ hideValues: !hideValues })}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {currentPage === 'admin' && finance.userProfile.role === 'admin' && (
              <AdminView currentUserEmail={finance.currentUser.email || undefined} />
            )}

            {currentPage === 'overview' && (
              <OverviewView
                state={finance.state}
                cursor={finance.cursor}
                onSelectPage={setCurrentPage}
                onOpenGoalContrib={(id) => setContribGoalId(id)}
                onOpenAssistant={() => setIsAssistantOpen(true)}
              />
            )}

            {currentPage === 'transactions' && (
              <TransactionsView
                state={finance.state}
                onAddTransaction={finance.addTransaction}
                onDeleteTransaction={finance.deleteTransaction}
                onContributeToGoal={finance.contributeToGoal}
                onContributeToInvestment={finance.addInvestmentContribution}
              />
            )}

            {currentPage === 'accounts' && (
              <AccountsCardsView
                state={finance.state}
                onAddAccount={finance.addAccount}
                onRemoveAccount={finance.removeAccount}
                onAddTransfer={finance.addTransfer}
                onDeleteTransfer={finance.deleteTransfer}
                onAddCard={finance.addCard}
                onRemoveCard={finance.removeCard}
                onAddCardPurchase={finance.addCardPurchase}
                onPayCardInvoice={finance.payCardInvoice}
                onDeleteCardPurchase={finance.deleteCardPurchase}
                onAddRecurringBill={finance.addRecurringBill}
                onToggleRecurringBill={finance.toggleRecurringBill}
                onRemoveRecurringBill={finance.removeRecurringBill}
              />
            )}

            {currentPage === 'investments' && (
              <InvestmentsView
                state={finance.state}
                onAddInvestment={finance.addInvestment}
                onAddInvestmentContribution={finance.addInvestmentContribution}
                onUpdateInvestmentMarketValue={finance.updateInvestmentMarketValue}
                onUpdateInvestment={finance.updateInvestment}
                onDeleteInvestment={finance.deleteInvestment}
                onWithdrawInvestment={finance.withdrawInvestment}
              />
            )}

            {currentPage === 'goals' && (
              <GoalsView
                state={finance.state}
                onAddGoal={finance.addGoal}
                onDeleteGoal={finance.deleteGoal}
                onOpenGoalContrib={(id) => setContribGoalId(id)}
              />
            )}

            {currentPage === 'annual' && <AnnualView state={finance.state} />}

            {currentPage === 'reports' && <ReportsView state={finance.state} />}

            {currentPage === 'calendar' && <CalendarView state={finance.state} />}

            {currentPage === 'simulator' && <SimulatorView />}

            {currentPage === 'settings' && (
              <SettingsView
                state={finance.state}
                userProfile={finance.userProfile}
                onUpdateSettings={finance.updateSettings}
                onResetData={finance.resetDataToSample}
                onClearData={finance.clearAllData}
                onImportJSON={finance.importStateJSON}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      </div>

      {/* Mobile Navigation Bar */}
      <MobileNav
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        userProfile={finance.userProfile}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Modals */}
      <GoalContribModal
        goal={selectedGoalForContrib}
        accounts={finance.state.accounts}
        onClose={() => setContribGoalId(null)}
        onConfirm={finance.contributeToGoal}
      />



      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={handleOnboardingComplete}
      />

      <AIAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        state={finance.state}
        userProfile={finance.userProfile}
      />
    </div>
  );
}
