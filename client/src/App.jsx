
import { useAuth } from './features/auth/AuthContext.jsx'
import LoginPage from './features/auth/LoginPage.jsx'
import POSLayout from './components/layout/POSLayout.jsx'

function App() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <POSLayout />
}

export default App
