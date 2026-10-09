
import { LandingPage } from './components/landing/landing-page'
import { AuthCard } from './components/auth/auth-card'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QuestionsPage } from './components/questions/question'
function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/sign-in"
          element={
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
              <AuthCard initialMode="sign-in" />
            </div>
          }
        />

        {/* Sign Up Route */}
        <Route
          path="/sign-up"
          element={
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
              <AuthCard initialMode="sign-up" />
            </div>
          }
        />
        <Route
          path='/questions'
          element={
            <QuestionsPage />
          }
        />
      </Routes>

    </>

  )
}
export default App
