import { Link } from "react-router"
import { Button } from "./components/ui/button"
import Footer from "./components/Footer"

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Apartment System (Yen Sabai)
          </h1>
          <p className="font-body text-on-surface-variant mt-3">
            Apartment Management System
          </p>
        </div>
        <Link to="/login">
          <Button variant="secondary" size="lg">
            Get Started
          </Button>
        </Link>
      </div>
      <div className="mt-8"></div>
      <Footer />
    </div>
  )
}

export default App