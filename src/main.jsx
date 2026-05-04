import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './design-system/components/Toast/Toast.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { HomeworkProvider } from './contexts/HomeworkContext.jsx'
import { TeacherProvider } from './contexts/TeacherContext.jsx'
import { UserManagementProvider } from './contexts/UserManagementContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TeacherProvider>
          <UserManagementProvider>
            <HomeworkProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </HomeworkProvider>
          </UserManagementProvider>
        </TeacherProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

