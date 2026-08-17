import { MotionConfig } from 'framer-motion'
import { Route, Routes } from 'react-router-dom'
import { CompareTray } from '@/components/compare/CompareTray'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { SkipLink } from '@/components/layout/SkipLink'
import { ErrorBoundary } from '@/components/states/ErrorBoundary'
import { OfflineBanner } from '@/components/states/OfflineBanner'
import { useCompare } from '@/contexts/CompareContext'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * `/` and `/pokemon/:name` render the same page — the dex stays mounted behind
 * the detail view, so closing it returns to the exact scroll position and the
 * grid never refetches. The route param is what opens the modal.
 *
 * `reducedMotion="user"` makes every Framer animation honour the OS setting
 * without each component having to remember to.
 */
export default function App() {
  const { count } = useCompare()

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <SkipLink />
        <OfflineBanner />
        <Header />

        <main id="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pokemon/:name" element={<HomePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />

        {/* The tray floats over the page, so the page ends above it. */}
        {count > 0 ? <div aria-hidden="true" className="h-24" /> : null}
        <CompareTray />
      </MotionConfig>
    </ErrorBoundary>
  )
}
