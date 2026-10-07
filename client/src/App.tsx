import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import Write from "./pages/Write";
import Letter from "./pages/Letter";
import Mailbox from "./pages/Mailbox";
import Report from "./pages/Report";
import Profile from "./pages/Profile";
import PublicMailbox from "./pages/PublicMailbox";
import DailyQuote from "./pages/DailyQuote";
import TimeCapsule from "./pages/TimeCapsule";
import EmotionPlanet from "./pages/EmotionPlanet";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminLetters } from "./pages/AdminLetters";
import { AdminReports } from "./pages/AdminReports";
import { AdminEmotions } from "./pages/AdminEmotions";
import { AdminMembers } from "./pages/AdminMembers";
import { AdminSettings } from "./pages/AdminSettings";
import Login from "./pages/Login";
import UserLogin from "./pages/UserLogin";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import SecuritySettings from "./pages/SecuritySettings";
import PremiumSupport from "./pages/PremiumSupport";
import PaymentResult from "./pages/PaymentResult";
import AdminSupport from "./pages/AdminSupport";
import LegalPage from "./pages/LegalPage";
import { SessionTimeoutProvider } from "./components/SessionTimeoutProvider";
import PresenceTracker from "./components/PresenceTracker";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/user-login"} component={UserLogin} />
      <Route path={"/register"} component={Register} />
      <Route path={"/privacy-policy"} component={() => <LegalPage kind="privacy" />} />
      <Route path={"/terms-of-service"} component={() => <LegalPage kind="terms" />} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/security-settings"} component={SecuritySettings} />
      <Route path={"/premium-support"} component={PremiumSupport} />
      <Route path={"/payment-result"} component={PaymentResult} />
      <Route path={"/write"} component={Write} />
      <Route path={"/letter/:id"} component={Letter} />
      <Route path={"/mailbox"} component={Mailbox} />
      <Route path={"/report"} component={Report} />
      <Route path={"/profile"} component={Profile} />

      <Route path={"/public-mailbox"} component={PublicMailbox} />
      <Route path={"/daily-quote"} component={DailyQuote} />
      <Route path={"/time-capsule"} component={TimeCapsule} />
      <Route path={"/emotion-planet"} component={EmotionPlanet} />
      {/* Admin Routes */}
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/users"} component={AdminUsers} />
      <Route path={"/admin/letters"} component={AdminLetters} />
      <Route path={"/admin/reports"} component={AdminReports} />
      <Route path={"/admin/emotions"} component={AdminEmotions} />
      <Route path={"/admin/members"} component={AdminMembers} />
      <Route path={"/admin/settings"} component={AdminSettings} />
      <Route path={"/admin/support"} component={AdminSupport} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <LanguageProvider>
          <SessionTimeoutProvider>
            <TooltipProvider>
              <PresenceTracker />
              <Toaster />
              <Router />
            </TooltipProvider>
          </SessionTimeoutProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
