import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import landingHtml from '../landing.html?raw'

const links = {
  action: '/seeker/search',
  'another action': '/provider/skills',
  'something else here': '/admin/login',
  'become a mentor': '/provider/register',
  'browse members': '/seeker/search',
  'success stories': '/seeker/feedback',
  'help center': '/login',
  'contact us': '/login',
  faq: '/login',
  'privacy policy': '/login',
  'terms of service': '/login',
  'cookie policy': '/login',
  accessibility: '/login',
  facebook: '/login',
  twitter: '/login',
  github: '/login',
  linkedin: '/login',
}

export default function LandingPage() {
  const navigate = useNavigate()
  const content = useMemo(() => new DOMParser().parseFromString(landingHtml, 'text/html').body.innerHTML, [])

  function handleClick(event) {
    const anchor = event.target.closest('a')
    if (!anchor || !event.currentTarget.contains(anchor)) return
    const href = anchor.getAttribute('href')
    const label = anchor.textContent.trim().toLowerCase()
    if (href?.startsWith('http') || anchor.hasAttribute('data-bs-toggle')) return
    if (href === '#top') {
      event.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const destination = href === '#'
      ? label === 'swappy' || label === 'home'
        ? '/'
        : label === 'explore' || label === 'discover' || label === 'programming & web' || label === 'creative & design'
          || label === 'business' || label === 'languages' || label === 'health & wellness' || label === 'hobbies & lifestyle'
          ? '/seeker/search'
          : links[label] || '/login'
      : href
    event.preventDefault()
    navigate(destination)
  }

  function handleSubmit(event) {
    const form = event.target
    if (!(form instanceof HTMLFormElement) || form.getAttribute('role') !== 'search') return
    event.preventDefault()
    const input = form.querySelector('input[type="search"]')
    navigate(`/seeker/search?search=${encodeURIComponent(input?.value || '')}`)
  }

  return (
    <main className="landing-page" id="top" onClick={handleClick} onSubmitCapture={handleSubmit}>
      <nav className="landing-portal-nav" aria-label="SWAPPY account navigation">
        <Link className="landing-brand" to="/">SWAPPY</Link>
        <div className="d-flex flex-wrap gap-2">
          <Link className="btn btn-outline-primary btn-sm" to="/seeker/register">Learn a skill</Link>
          <Link className="btn btn-primary btn-sm" to="/provider/register">Offer a skill</Link>
          <Link className="btn btn-link btn-sm" to="/login">Sign in</Link>
        </div>
      </nav>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </main>
  )
}
