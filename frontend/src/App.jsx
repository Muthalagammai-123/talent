import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProviders } from '@/contexts/AppProviders'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { FreelancerLayout } from '@/components/layout/FreelancerLayout'
import { ClientLayout } from '@/components/layout/ClientLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { LandingPage } from '@/pages/landing/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { RoleSelectionPage } from '@/pages/auth/RoleSelectionPage'
import { FreelancerDashboardPage } from '@/pages/freelancer/FreelancerDashboardPage'
import { PortfolioPage } from '@/pages/freelancer/PortfolioPage'
import { PortfolioCreatePage } from '@/pages/freelancer/PortfolioCreatePage'
import { BrowseProjectsPage } from '@/pages/freelancer/BrowseProjectsPage'
import { ApplicationFlowPage } from '@/pages/freelancer/ApplicationFlowPage'
import { MyApplicationsPage } from '@/pages/freelancer/MyApplicationsPage'
import { VerificationPage } from '@/pages/freelancer/VerificationPage'
import { ClientDashboardPage } from '@/pages/client/ClientDashboardPage'
import { ClientCandidatesPage } from '@/pages/client/ClientCandidatesPage'
import { AIFeaturesPage } from '@/pages/ai/AIFeaturesPage'
import { MessagingPage } from '@/pages/messaging/MessagingPage'
import { PaymentDashboardPage } from '@/pages/payments/PaymentDashboardPage'
import { CommunityPage } from '@/pages/community/CommunityPage'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage'
import { AdminVerificationPage } from '@/pages/admin/AdminVerificationPage'

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>
          <Route path="role-selection" element={<RoleSelectionPage />} />

          <Route path="freelancer" element={<FreelancerLayout />}>
            <Route index element={<FreelancerDashboardPage />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="portfolio/create" element={<PortfolioCreatePage />} />
            <Route path="projects" element={<BrowseProjectsPage />} />
            <Route path="apply/:projectId" element={<ApplicationFlowPage />} />
            <Route path="applications" element={<MyApplicationsPage />} />
            <Route path="verify" element={<VerificationPage />} />
          </Route>

          <Route path="client" element={<ClientLayout />}>
            <Route index element={<ClientDashboardPage />} />
            <Route path="candidates" element={<ClientCandidatesPage />} />
          </Route>

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="verifications" element={<AdminVerificationPage />} />
          </Route>

          <Route element={<AppLayout />}>
            <Route path="messages" element={<MessagingPage />} />
            <Route path="payments" element={<PaymentDashboardPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="ai" element={<AIFeaturesPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  )
}

export default App
