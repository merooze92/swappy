import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { useApiData } from '../hooks/useApiData.js'
import { useSubmission } from '../hooks/useSubmission.js'
import { useZodForm } from '../hooks/useZodForm.js'
import {
  ErrorNotice,
  FormCard,
  FormField,
  FormMessage,
  PageHeading,
  SubmitButton,
} from '../components/FormControls.jsx'
import {
  exchangeRequestSchema,
  feedbackSchema,
  seekerRegistrationSchema,
  skillRequestSchema,
} from './schemas.js'

const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

export function SeekerRegistrationForm() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const submission = useSubmission()
  const { register, handleSubmit, formState: { errors } } = useZodForm(seekerRegistrationSchema, {
    defaultValues: { role: 'seeker' },
  })

  async function onSubmit(values) {
    const result = await submission.run(
      () => api('/auth/register', { method: 'POST', body: JSON.stringify(values) }),
      'Your seeker account has been created.',
    )
    if (result) {
      signIn(result)
      navigate('/seeker/dashboard', { replace: true })
    }
  }

  return (
    <>
      <PageHeading eyebrow="Skill seeker" title="Create your seeker account" description="Tell the community what you want to learn." />
      <FormCard><div className="card-body p-4">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <input type="hidden" {...register('role')} />
          <FormField label="Full name" name="fullName" register={register} errors={errors} autoComplete="name" />
          <FormField label="Email" name="email" register={register} errors={errors} as="email" autoComplete="email" />
          <FormField label="Password" name="password" register={register} errors={errors} as="password" autoComplete="new-password" />
          <FormField label="Confirm password" name="confirmPassword" register={register} errors={errors} as="password" autoComplete="new-password" />
          <FormField label="Contact number" name="contactNumber" register={register} errors={errors} autoComplete="tel" />
          <FormField label="Bio" name="bio" register={register} errors={errors} as="textarea" />
          <FormField
            label="Skills interested in (comma-separated)"
            name="skillsInterestedIn"
            register={register}
            errors={errors}
            setValueAs={(value) => typeof value === 'string' ? value.split(',').map((skill) => skill.trim()).filter(Boolean) : []}
          />
          <SubmitButton loading={submission.loading}>Create seeker account</SubmitButton>
          <FormMessage message={submission.message} />
          <ErrorNotice error={submission.error} />
        </form>
        <p className="mt-3 mb-0">Already registered? <Link to="/login">Sign in</Link></p>
      </div></FormCard>
    </>
  )
}

export function SkillSearchRequestForm() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const [searchText, setSearchText] = useState(initialSearch)
  const [search, setSearch] = useState(initialSearch)
  const [refresh, setRefresh] = useState(0)
  const [requestActionError, setRequestActionError] = useState('')
  const { token } = useAuth()
  const submission = useSubmission()
  const navigate = useNavigate()
  const { data: skillData, loading: skillsLoading, error: skillsError } = useApiData(
    `/skills?search=${encodeURIComponent(search)}`,
  )
  const { data: requestData, loading: requestsLoading, error: requestsError, reload: reloadRequests } = useApiData('/skills/requests', refresh)
  const { register, handleSubmit, formState: { errors }, setValue } = useZodForm(skillRequestSchema)

  async function onSubmit(values) {
    const result = await submission.run(
      () => api('/skills/requests', { token, method: 'POST', body: JSON.stringify(values) }),
      'Your skill request has been saved.',
    )
    if (result) {
      setRefresh((value) => value + 1)
      reloadRequests()
    }
  }

  async function closeRequest(request) {
    setRequestActionError('')
    try {
      await api(`/skills/requests/${request._id}`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ status: 'closed' }),
      })
      reloadRequests()
    } catch (requestError) {
      setRequestActionError(requestError.message)
    }
  }

  return (
    <>
      <PageHeading eyebrow="Skill seeker · Form 2" title="Find a skill or post a request" description="Browse available provider skills or save a request for the skill you want to learn." />
      <FormCard className="mb-4"><div className="card-body p-4">
        <div className="d-flex flex-column flex-md-row gap-2 mb-4">
          <label className="visually-hidden" htmlFor="skill-search">Search skills and providers</label>
          <input id="skill-search" className="form-control" value={searchText} onChange={(event) => setSearchText(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              setSearch(searchText)
            }
          }} placeholder="Search skill names or descriptions" />
          <button className="btn btn-outline-primary" type="button" onClick={() => {
            setSearch(searchText)
            setSearchParams(searchText ? { search: searchText } : {})
          }}>Search</button>
        </div>
        <ErrorNotice error={skillsError} />
        {skillsLoading ? <p>Loading skills from SWAPPY…</p> : (
          <div className="row g-3">
            {(skillData?.skills || []).map((skill) => (
              <div className="col-md-6" key={skill._id}>
                <article className="skill-result h-100">
                  <div className="d-flex justify-content-between gap-3">
                    <h3 className="h5">{skill.name}</h3>
                    <span className="badge text-bg-light align-self-start">{skill.level}</span>
                  </div>
                  <p className="text-muted mb-1">{skill.category} · by {skill.owner?.fullName || 'SWAPPY member'}{skill.owner?.location ? ` · ${skill.owner.location}` : ''}</p>
                  {skill.owner?.bio && <p className="small">{skill.owner.bio}</p>}
                  <p>{skill.description}</p>
                  <p className="small mb-2">{skill.mode} · Available: {skill.availability}</p>
                  <button className="btn btn-sm btn-primary" type="button" onClick={() => navigate(`/seeker/exchanges/new?skill=${skill._id}`)}>
                    Request an exchange
                  </button>
                  <button className="btn btn-sm btn-link ms-2" type="button" onClick={() => {
                    setValue('skillRequired', skill.name)
                    setValue('category', skill.category)
                  }}>Use for my skill request</button>
                </article>
              </div>
            ))}
            {!skillData?.skills?.length && <p className="text-muted mb-0">No matching skills are currently available.</p>}
          </div>
        )}
      </div></FormCard>
      <FormCard className="mb-4"><div className="card-body p-4">
        <h2 className="h4">Post a skill request</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="Skill required" name="skillRequired" register={register} errors={errors} />
          <FormField label="Skill category" name="category" register={register} errors={errors} />
          <FormField label="Preferred level" name="preferredLevel" register={register} errors={errors} as="select" options={levels} />
          <FormField label="Description" name="description" register={register} errors={errors} as="textarea" />
          <FormField label="Preferred schedule" name="preferredSchedule" register={register} errors={errors} />
          <FormField label="Additional requirements" name="additionalRequirements" register={register} errors={errors} as="textarea" />
          <SubmitButton loading={submission.loading}>Save skill request</SubmitButton>
          <FormMessage message={submission.message} />
          <ErrorNotice error={submission.error} />
        </form>
      </div></FormCard>
      <section>
        <h2 className="h4">My saved skill requests</h2>
        <ErrorNotice error={requestsError || requestActionError} />
        {requestsLoading ? <p>Loading requests…</p> : (
          <div className="data-list">
            {(requestData?.requests || []).map((request) => (
              <article className="data-row" key={request._id}>
                <div><strong>{request.skillRequired}</strong><p className="mb-0 text-muted">{request.category} · {request.preferredLevel} · {request.preferredSchedule}</p></div>
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${request.status === 'open' ? 'text-bg-success' : 'text-bg-secondary'}`}>{request.status}</span>
                  {request.status === 'open' && <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => closeRequest(request)}>Close request</button>}
                </div>
              </article>
            ))}
            {!requestData?.requests?.length && <p className="text-muted">You have not posted a skill request yet.</p>}
          </div>
        )}
      </section>
    </>
  )
}

export function SkillExchangeRequestForm() {
  const [searchParams] = useSearchParams()
  const { token } = useAuth()
  const submission = useSubmission()
  const { data, loading, error } = useApiData('/skills')
  const { register, handleSubmit, formState: { errors }, setValue } = useZodForm(exchangeRequestSchema)

  useEffect(() => {
    const selectedSkill = searchParams.get('skill')
    if (selectedSkill) setValue('skill', selectedSkill)
  }, [searchParams, setValue])

  async function onSubmit(values) {
    const result = await submission.run(
      () => api('/exchanges', { token, method: 'POST', body: JSON.stringify(values) }),
      'Your exchange request has been sent to the provider.',
    )
    return result
  }

  return (
    <>
      <PageHeading eyebrow="Skill seeker · Form 3" title="Request a skill exchange" description="Choose a provider skill and describe what you can offer in return." />
      <FormCard><div className="card-body p-4">
        <ErrorNotice error={error} />
        {loading ? <p>Loading available provider skills…</p> : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField
              label="Skill provider and skill"
              name="skill"
              register={register}
              errors={errors}
              as="select"
              options={(data?.skills || []).map((skill) => ({
                value: skill._id,
                label: `${skill.name} — ${skill.owner?.fullName || 'SWAPPY member'} (${skill.level})`,
              }))}
            />
            <FormField label="Skill to learn" name="skillToLearn" register={register} errors={errors} />
            <FormField label="Skill offered in exchange" name="skillOffered" register={register} errors={errors} />
            <FormField label="Preferred date and time" name="preferredDateTime" register={register} errors={errors} as="datetime-local" />
            <FormField label="Message to provider" name="message" register={register} errors={errors} as="textarea" />
            <SubmitButton loading={submission.loading}>Send exchange request</SubmitButton>
            <FormMessage message={submission.message} />
            <ErrorNotice error={submission.error} />
          </form>
        )}
      </div></FormCard>
    </>
  )
}

export function FeedbackForm() {
  const { token, user } = useAuth()
  const submission = useSubmission()
  const { data: exchangeData, error: exchangeError, loading: exchangesLoading } = useApiData('/exchanges')
  const { data: feedbackData, error: feedbackError, loading: feedbackLoading, reload } = useApiData('/feedback', submission.message)
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useZodForm(feedbackSchema)
  const selectedId = watch('exchange')
  const completed = (exchangeData?.exchanges || []).filter((exchange) => exchange.status === 'completed')
  const selected = completed.find((exchange) => exchange._id === selectedId)
  const recipient = selected
    ? (selected.seeker?._id === user.id ? selected.provider : selected.seeker)
    : null

  useEffect(() => {
    if (recipient?._id) setValue('to', recipient._id)
  }, [recipient?._id, setValue])

  async function onSubmit(values) {
    const result = await submission.run(
      () => api('/feedback', { token, method: 'POST', body: JSON.stringify(values) }),
      'Your feedback has been saved.',
    )
    if (result) reload()
  }

  return (
    <>
      <PageHeading eyebrow="Skill seeker · Form 4" title="Leave exchange feedback" description="Rate the other participant after an exchange is complete." />
      <FormCard className="mb-4"><div className="card-body p-4">
        <ErrorNotice error={exchangeError} />
        {exchangesLoading ? <p>Loading completed exchanges…</p> : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField
              label="Completed exchange"
              name="exchange"
              register={register}
              errors={errors}
              as="select"
              options={completed.map((exchange) => ({
                value: exchange._id,
                label: `${exchange.skillToLearn} with ${exchange.provider?.fullName || exchange.seeker?.fullName || 'member'}`,
              }))}
            />
            <input type="hidden" {...register('to')} />
            {recipient && <p className="text-muted">Feedback will be visible on {recipient.fullName}’s profile.</p>}
            <FormField label="Rating" name="rating" register={register} errors={errors} as="select" options={[1, 2, 3, 4, 5].map((value) => ({ value, label: `${value} / 5` }))} />
            <FormField label="Feedback / review" name="review" register={register} errors={errors} as="textarea" />
            <SubmitButton loading={submission.loading}>Save feedback</SubmitButton>
            <FormMessage message={submission.message} />
            <ErrorNotice error={submission.error} />
          </form>
        )}
      </div></FormCard>
      <section>
        <h2 className="h4">Feedback shared with you</h2>
        <ErrorNotice error={feedbackError} />
        {feedbackLoading ? <p>Loading feedback…</p> : (
          <div className="data-list">
            {(feedbackData?.feedback || []).map((feedback) => (
              <article className="data-row" key={feedback._id}>
                <div><strong>{feedback.rating} / 5 · from {feedback.from?.fullName}</strong><p className="mb-0">{feedback.review}</p></div>
              </article>
            ))}
            {!feedbackData?.feedback?.length && <p className="text-muted">No feedback is available yet.</p>}
          </div>
        )}
      </section>
    </>
  )
}
