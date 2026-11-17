import { Navigate, Route, Routes } from 'react-router'
import Home from './pages/Home'
import Room from './pages/Room'
import { useSession } from './lib/session'

function App() {
  const { session } = useSession()

  return (
    <Routes>
      <Route
        path="/"
        element={session ? <Navigate to="/room" replace /> : <Home />}
      />
      <Route
        path="/room"
        element={session ? <Room /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
