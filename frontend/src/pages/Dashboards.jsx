import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { useApiData } from '../hooks/useApiData.js'
import { ErrorNotice } from '../components/FormControls.jsx'

const navigation = {
  seeker: [
    ['Dashboard', 'dashboard'],
    ['Profile', 'profile'],
    ['Browse and request skills', 'search'],
    ['Skill requests', 'requests'],
    ['My exchanges', 'exchanges'],
    ['Feedback', 'feedback'],
  ],
  provider: [
    ['Dashboard', 'dashboard'],
    ['Profile', 'profile'],
    ['My offered skills', 'skills'],
    ['Manage skills', 'skills/manage'],
    ['Incoming requests', 'requests'],
    ['Active exchanges', 'exchanges'],
    ['Feedback', 'feedback'],
  ],
  admin: [
    ['Dashboard', 'dashboard'],
    ['Users', 'users'],
    ['Skills and categories', 'skills'],
    ['Exchanges and activity', 'platform'],
  ],
}

const sectionTitles = { seeker: 'Skill Seeker', provider: 'Skill Provider', admin: 'Admin' }

export function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading">Loading your SWAPPY account…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={`/${user.role}/dashboard`} replace />
  return children
}

export function DashboardLayout({ role }) {
  const { user, signOut } = useAuth()
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" to={`/${role}/dashboard`}>SWAPPY</Link>
        <p className="sidebar-role">{sectionTitles[role]} workspace</p>
        <nav className="dashboard-nav" aria-label={`${sectionTitles[role]} navigation`}>
          {navigation[role].map(([label, path]) => (
            <NavLink key={path} to={path} end={path === 'dashboard'} className={({ isActive }) => `dashboard-nav-link${isActive ? ' active' : ''}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-account">
          <span>{user.fullName}</span>
          <button type="button" className="btn btn-sm btn-outline-light" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <span>{sectionTitles[role]} dashboard</span>
          <Link to="/">Back to SWAPPY home</Link>
        </header>
        <div className="dashboard-content"><Outlet /></div>
      </main>
    </div>
  )
}

export function DashboardHome({ role }) {
  const { user } = useAuth()
  const primaryPath = role === 'seeker' ? '/skills/requests' : role === 'provider' ? '/skills' : '/admin/users'
  const secondaryPath = role === 'admin' ? '/admin/exchanges' : '/exchanges'
  const { data: primary, error: primaryError, loading: primaryLoading } = useApiData(primaryPath)
  const { data: secondary, error: secondaryError, loading: secondaryLoading } = useApiData(secondaryPath)

  const count = (result, key) => result?.[key]?.length ?? 0
  const stats = role === 'seeker'
    ? [['My skill requests', count(primary, 'requests')], ['My exchanges', count(secondary, 'exchanges')]]
    : role === 'provider'
      ? [['My offered skills', count(primary, 'skills')], ['Incoming / active exchanges', count(secondary, 'exchanges')]]
      : [['Platform users', count(primary, 'users')], ['Recorded exchanges', count(secondary, 'exchanges')]]

  const quickLinks = role === 'seeker'
    ? [['Browse skills', '/seeker/search'], ['Request an exchange', '/seeker/search'], ['Leave feedback', '/seeker/feedback']]
    : role === 'provider'
      ? [['Offer a skill', '/provider/skills'], ['Manage listings', '/provider/skills/manage'], ['Review requests', '/provider/requests']]
      : [['Manage users', '/admin/users'], ['Moderate skills', '/admin/skills'], ['Review platform activity', '/admin/platform']]

  return (
    <>
      <span className="eyebrow">{sectionTitles[role]} workspace</span>
      <h1 className="dashboard-title">Welcome, {user.fullName}</h1>
      <p className="text-muted">Manage your SWAPPY account and skill exchanges here.</p>
      <ErrorNotice error={primaryError || secondaryError} />
      <section className="dashboard-stats" aria-label="Dashboard overview">
        {stats.map(([label, value]) => (
          <article className="dashboard-stat" key={label}>
            <span>{label}</span>
            <strong>{primaryLoading || secondaryLoading ? '…' : value}</strong>
          </article>
        ))}
      </section>
      <section className="dashboard-profile card border-0 shadow-sm mt-4">
        <div className="card-body">
          <h2 className="h5">Profile</h2>
          <p className="mb-1"><strong>{user.fullName}</strong> · {user.email}</p>
          <p className="text-muted mb-0">{user.bio || 'Add context about yourself to make your profile more useful to the community.'}</p>
        </div>
      </section>
      <section className="mt-4">
        <h2 className="h4">Quick actions</h2>
        <div className="row g-3">
          {quickLinks.map(([label, to]) => (
            <div className="col-md-4" key={label}>
              <Link className="quick-action-card" to={to}>{label}<span aria-hidden="true">→</span></Link>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export function ProfilePage() {
  const { user } = useAuth()
  return (
    <>
      <span className="eyebrow">Account</span>
      <h1 className="dashboard-title">Profile</h1>
      <section className="dashboard-profile card border-0 shadow-sm mt-4">
        <div className="card-body">
          <h2 className="h4">{user.fullName}</h2>
          <p>{user.email}</p>
          <p>{user.contactNumber || 'No contact number provided'}</p>
          <p>{user.location || 'No location provided'}</p>
          <p className="mb-0">{user.bio || 'No bio provided'}</p>
        </div>
      </section>
    </>
  )
}

export function ExchangeListPage({ role }) {
  const { user, token } = useAuth()
  const { data, loading, error, reload } = useApiData('/exchanges')
  const [actionError, setActionError] = useState('')

  async function cancelExchange(exchange) {
    setActionError('')
    try {
      await api(`/exchanges/${exchange._id}`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      })
      reload()
    } catch (requestError) {
      setActionError(requestError.message)
    }
  }

  return (
    <>
      <span className="eyebrow">{sectionTitles[role]}</span>
      <h1 className="dashboard-title">{role === 'seeker' ? 'My exchanges' : 'Active exchanges'}</h1>
      <ErrorNotice error={error || actionError} />
      {loading ? <p>Loading your exchanges…</p> : (
        <div className="data-list">
          {(data?.exchanges || []).filter((exchange) => role !== 'provider' || ['accepted', 'active', 'completed'].includes(exchange.status)).map((exchange) => {
            const other = exchange.seeker?._id === user.id ? exchange.provider : exchange.seeker
            return (
              <article className="data-row exchange-row" key={exchange._id}>
                <div>
                  <strong>{exchange.skillToLearn} ↔ {exchange.skillOffered}</strong>
                  <p className="mb-1 text-muted">With {other?.fullName || 'SWAPPY member'} · {new Date(exchange.preferredDateTime).toLocaleString()}</p>
                  <p className="mb-1">{exchange.message}</p>
                  {exchange.providerResponse && <p className="mb-0 text-muted">Response: {exchange.providerResponse}</p>}
                </div>
                <div className="exchange-actions">
                  <span className="badge text-bg-secondary">{exchange.status}</span>
                  {role === 'seeker' && ['requested', 'accepted', 'active'].includes(exchange.status) && (
                    <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => cancelExchange(exchange)}>Cancel</button>
                  )}
                  {exchange.status === 'completed' && <Link className="btn btn-sm btn-outline-primary" to={`/${role}/feedback`}>Leave feedback</Link>}
                </div>
              </article>
            )
          })}
          {!(data?.exchanges || []).some((exchange) => role !== 'provider' || ['accepted', 'active', 'completed'].includes(exchange.status)) && <p className="text-muted">No exchange records yet. Browse skills to find an exchange partner.</p>}
        </div>
      )}
    </>
  )
}
