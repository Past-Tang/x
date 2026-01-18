import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import AccountsPage from './pages/AccountsPage'
import TargetsPage from './pages/TargetsPage'
import ReplyTemplatesPage from './pages/ReplyTemplatesPage'
import PostJobsPage from './pages/PostJobsPage'
import PostContentsPage from './pages/PostContentsPage'
import LogsPage from './pages/LogsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/accounts" replace />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="targets" element={<TargetsPage />} />
        <Route path="reply-templates" element={<ReplyTemplatesPage />} />
        <Route path="post-jobs" element={<PostJobsPage />} />
        <Route path="post-contents" element={<PostContentsPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
