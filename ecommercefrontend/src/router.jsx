import { createBrowserRouter, Navigate } from 'react-router-dom'
import Login from './features/login/pages/Login'
import Shop from './features/shop/pages/Shop'
import ProtectedRoute from './shared/components/ProtectedRoute'
import RootRedirect from './shared/components/RootRedirect'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/shop',
    element: (
      <ProtectedRoute>
        <Shop />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export default router
