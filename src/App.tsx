import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinance } from './hooks/useFinance';
import { TabPage } from './types';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Header } from './components/Header';
import { GoalContribModal } from './components/GoalContribModal';
import { WithdrawModal } from './components/WithdrawModal';
import { OnboardingModal } from './components/OnboardingModal';

// Views
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-blue-500 selection:text-white">
      {/* Desktop Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        cursor={finance.cursor}
        onShiftMonth={finance.shiftMonth}
        state={finance.state}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        <Header
          currentPage={currentPage}
          cursor={finance.cursor}
          onShiftMonth={finance.shiftMonth}
          onSelectPage={setCurrentPage}
          state={finance.state}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {currentPage === 'overview' && (
              <OverviewView
                state={finance.state}
                cursor={finance.cursor}
                onSelectPage={setCurrentPage}
                onOpenGoalContrib={(id) => setContribGoalId(id)}
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
                onUpdateSettings={finance.updateSettings}
                onResetData={finance.resetDataToSample}
                onImportJSON={finance.importStateJSON}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Navigation Bar */}
      <MobileNav currentPage={currentPage} onSelectPage={setCurrentPage} />

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
    </div>
  );
}
