const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importsToRemove = [
  "import { LoginView } from './components/views/LoginView';",
  "import { AdminView } from './components/views/AdminView';",
  "import { OverviewView } from './components/views/OverviewView';",
  "import { TransactionsView } from './components/views/TransactionsView';",
  "import { AccountsCardsView } from './components/views/AccountsCardsView';",
  "import { InvestmentsView } from './components/views/InvestmentsView';",
  "import { GoalsView } from './components/views/GoalsView';",
  "import { AnnualView } from './components/views/AnnualView';",
  "import { ReportsView } from './components/views/ReportsView';",
  "import { CalendarView } from './components/views/CalendarView';",
  "import { SimulatorView } from './components/views/SimulatorView';",
  "import { SettingsView } from './components/views/SettingsView';",
  "import { ResetPasswordView } from './components/views/ResetPasswordView';"
];

importsToRemove.forEach(imp => {
  code = code.replace(imp + '\n', '');
});

const lazyImports = `
import { Suspense, lazy } from 'react';

const LoginView = lazy(() => import('./components/views/LoginView').then(m => ({ default: m.LoginView })));
const AdminView = lazy(() => import('./components/views/AdminView').then(m => ({ default: m.AdminView })));
const OverviewView = lazy(() => import('./components/views/OverviewView').then(m => ({ default: m.OverviewView })));
const TransactionsView = lazy(() => import('./components/views/TransactionsView').then(m => ({ default: m.TransactionsView })));
const AccountsCardsView = lazy(() => import('./components/views/AccountsCardsView').then(m => ({ default: m.AccountsCardsView })));
const InvestmentsView = lazy(() => import('./components/views/InvestmentsView').then(m => ({ default: m.InvestmentsView })));
const GoalsView = lazy(() => import('./components/views/GoalsView').then(m => ({ default: m.GoalsView })));
const AnnualView = lazy(() => import('./components/views/AnnualView').then(m => ({ default: m.AnnualView })));
const ReportsView = lazy(() => import('./components/views/ReportsView').then(m => ({ default: m.ReportsView })));
const CalendarView = lazy(() => import('./components/views/CalendarView').then(m => ({ default: m.CalendarView })));
const SimulatorView = lazy(() => import('./components/views/SimulatorView').then(m => ({ default: m.SimulatorView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const ResetPasswordView = lazy(() => import('./components/views/ResetPasswordView').then(m => ({ default: m.ResetPasswordView })));

const FallbackLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);
`;

code = code.replace('// Views\n', lazyImports + '\n// Views\n');

code = code.replace(/<LoginView/g, '<Suspense fallback={<FallbackLoader />}><LoginView');
code = code.replace(/<ResetPasswordView \/>/g, '<ResetPasswordView /></Suspense>');
code = code.replace(/<AdminView state={finance\.state} \/>/g, '<Suspense fallback={<FallbackLoader />}><AdminView state={finance.state} /></Suspense>');
code = code.replace(/(<OverviewView state={finance\.state}[^>]*\/>)/, '<Suspense fallback={<FallbackLoader />}>$1</Suspense>');
code = code.replace(/(<TransactionsView state={finance\.state}[^>]*\/>)/, '<Suspense fallback={<FallbackLoader />}>$1</Suspense>');
code = code.replace(/(<AccountsCardsView state={finance\.state}[^>]*\/>)/, '<Suspense fallback={<FallbackLoader />}>$1</Suspense>');
code = code.replace(/(<InvestmentsView state={finance\.state}[^>]*\/>)/, '<Suspense fallback={<FallbackLoader />}>$1</Suspense>');
code = code.replace(/(<GoalsView state={finance\.state}[^>]*\/>)/, '<Suspense fallback={<FallbackLoader />}>$1</Suspense>');
code = code.replace(/(<AnnualView state={finance\.state}[^>]*\/>)/, '<Suspense fallback={<FallbackLoader />}>$1</Suspense>');
code = code.replace(/(<ReportsView state={finance\.state}[^>]*\/>)/, '<Suspense fallback={<FallbackLoader />}>$1</Suspense>');
code = code.replace(/(<CalendarView state={finance\.state}[^>]*\/>)/, '<Suspense fallback={<FallbackLoader />}>$1</Suspense>');
code = code.replace(/(<SimulatorView state={finance\.state}[^>]*\/>)/, '<Suspense fallback={<FallbackLoader />}>$1</Suspense>');
code = code.replace(/(<SettingsView\s+state={finance\.state}[^>]*\/>)/, '<Suspense fallback={<FallbackLoader />}>$1</Suspense>');

fs.writeFileSync('src/App.tsx', code);
