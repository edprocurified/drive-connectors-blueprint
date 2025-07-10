import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import FileBrowser from './components/FileBrowser'
import AuthCallback from './components/AuthCallback'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/auth/google/callback" element={<AuthCallback />} />
            <Route path="/files" element={<FileBrowser />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App