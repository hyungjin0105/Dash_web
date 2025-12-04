import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { AppLayout } from '../components/layout/AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { RestaurantsPage } from '../pages/RestaurantsPage'
import { MenusPage } from '../pages/MenusPage'
import { OrdersPage } from '../pages/OrdersPage'
import { PromotionsPage } from '../pages/PromotionsPage'
import { CustomerFeedbackPage } from '../pages/CustomerFeedbackPage'
import { PlaybooksPage } from '../pages/PlaybooksPage'
import { DataSheetPage } from '../pages/DataSheetPage'
import { PrivacyPage } from '../pages/PrivacyPage'
import {
  AccessDeniedState,
  LoadingState,
  SignInState,
} from '../components/auth/AuthStates'

export const AppRouter = () => {
  const { status, user, signOut } = useAuth()

  if (status === 'loading') {
    return <LoadingState />
  }

  if (status === 'unauthenticated') {
    return <SignInState />
  }

  if (status === 'rejected' || !user?.isAdmin) {
    return <AccessDeniedState />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout user={user} onSignOut={signOut} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/menus" element={<MenusPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/feedback" element={<CustomerFeedbackPage />} />
          <Route path="/data-sheet" element={<DataSheetPage />} />
          <Route path="/playbooks" element={<PlaybooksPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
