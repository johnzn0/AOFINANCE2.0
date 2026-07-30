import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinance } from './hooks/useFinance';
import { TabPage } from './types';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Header } from './components/Header';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { GoalContribModal } from './components/GoalContribModal';
import { WithdrawModal } from './components/WithdrawModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AIAssistantModal } from './components/AIAssistantModal';

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

export default function App() {
  const finance = useFinance();
  const [currentPage, setCurrentPage] = useState<TabPage>('overview');

  // Modal active IDs
  const [contribGoalId, setContribGoalId] = useState<string | null>(null);
  const [withdrawInvId, setWithdrawInvId] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Auto-open Setup Onboarding Wizard on first time login
  React.useEffect(() => {
    if (finance.currentUser?.uid && finance.userProfile?.status === 'approved' && finance.isCloudSynced) {
      if (!finance.state.settings.hasCompletedSetup) {
        setIsOnboardingOpen(true);
      }
    }
  }, [finance.currentUser?.uid, finance.userProfile?.status, finance.isCloudSynced, finance.state.settings.hasCompletedSetup]);

  // Loading state
  if (finance.isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-serif font-bold text-xl flex items-center justify-center animate-pulse mb-3">
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <PWAInstallBanner />
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
                onUpdateInvestment={finance.updateInvestment}
                onDeleteInvestment={finance.deleteInvestment}
                onOpenWithdrawModal={(id) => setWithdrawInvId(id)}
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
      />

      {/* Modals */}
      <GoalContribModal
        goal={selectedGoalForContrib}
        accounts={finance.state.accounts}
        onClose={() => setContribGoalId(null)}
        onConfirm={finance.contributeToGoal}
      />

      <WithdrawModal
        investment={selectedInvForWithdraw}
        onClose={() => setWithdrawInvId(null)}
        onConfirm={finance.withdrawInvestment}
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
