import { ThemeProvider } from './ThemeContext'
import { AuthProvider } from './AuthContext'
import { PortfolioProvider } from './PortfolioContext'
import { MessagesProvider } from './MessagesContext'
import { PaymentsProvider } from './PaymentsContext'
import { CommunityProvider } from './CommunityContext'
import { ClientProvider } from './ClientContext'

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PortfolioProvider>
          <PaymentsProvider>
            <CommunityProvider>
              <ClientProvider>
                <MessagesProvider>{children}</MessagesProvider>
              </ClientProvider>
            </CommunityProvider>
          </PaymentsProvider>
        </PortfolioProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
