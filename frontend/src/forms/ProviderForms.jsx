import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { providerRegistrationSchema, requestManagementSchema, skillManagementSchema, skillSchema } from './schemas.js'

const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
const modes = ['In person', 'Online', 'Either']

export function ProviderRegistrationForm() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const submission = useSubmission()
  const { register, handleSubmit, formState: { errors } } = useZodForm(providerRegistrationSchema, {
    defaultValues: { role: 'provider' },
  })

  async function onSubmit(values) {
    const result = await submission.run(
      () => api('/auth/register', { method: 'POST', body: JSON.stringify(values) }),
      'Your provider account has been created.',
    )
    if (result) {
      signIn(result)
      navigate('/provider/dashboard', { replace: true })
    }
  }

  return (
    <>
      <PageHeading eyebrow="Skill provider" title="Create your provider account" description="Share your experience and make your skills available to others." />
      <FormCard><div className="card-body p-4">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <input type="hidden" {...register('role')} />
          <FormField label="Full name" name="fullName" register={register} errors={errors} autoComplete="name" />
          <FormField label="Email" name="email" register={register} errors={errors} as="email" autoComplete="email" />
          <FormField label="Password" name="password" register={register} errors={errors} as="password" autoComplete="new-password" />
          <FormField label="Confirm password" name="confirmPassword" register={register} errors={errors} as="password" autoComplete="new-password" />
          <FormField label="Contact number" name="contactNumber" register={register} errors={errors} autoComplete="tel" />
          <FormField label="Bio" name="bio" register={register} errors={errors} as="textarea" />
          <FormField label="Location" name="location" register={register} errors={errors} autoComplete="address-level2" />
          <FormField label="Experience" name="experience" register={register} errors={errors} as="textarea" />
          <SubmitButton loading={submission.loading}>Create provider account</SubmitButton>
          <FormMessage message={submission.message} />
          <ErrorNotice error={submission.error} />
        </form>
        <p className="mt-3 mb-0">Already registered? <Link to="/login">Sign in</Link></p>
      </div></FormCard>
    </>
  )
}

export function AddSkillForm() {
  const { token } = useAuth()
  const submission = useSubmission()
  const { register, handleSubmit, formState: { errors }, reset } = useZodForm(skillSchema)
  const { data, error, loading, reload } = useApiData('/skills')

  async function onSubmit(values) {
    const result = await submission.run(
      () => api('/skills', { token, method: 'POST', body: JSON.stringify(values) }),
      'Your offered skill has been saved.',
    )
    if (result) {
      reset()
      reload()
    }
  }

  return (
    <>
      <PageHeading eyebrow="Skill provider · Form 6" title="Offer a skill" description="Create a provider skill listing that seekers can find and request." />
      <FormCard className="mb-4"><div className="card-body p-4">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="Skill name" name="name" register={register} errors={errors} />
          <FormField label="Skill category" name="category" register={register} errors={errors} />
          <FormField label="Skill level" name="level" register={register} errors={errors} as="select" options={levels} />
          <FormField label="Description" name="description" register={register} errors={errors} as="textarea" />
          <FormField label="Experience" name="experience" register={register} errors={errors} as="textarea" />
          <FormField label="Availability" name="availability" register={register} errors={errors} placeholder="e.g. weekday evenings" />
          <FormField label="Preferred teaching mode" name="mode" register={register} errors={errors} as="select" options={modes} />
          <SubmitButton loading={submission.loading}>Save offered skill</SubmitButton>
          <FormMessage message={submission.message} />
          <ErrorNotice error={submission.error} />
        </form>
      </div></FormCard>
      <section>
        <h2 className="h4">My offered skills</h2>
        <ErrorNotice error={error} />
        {loading ? <p>Loading your skills…</p> : (
          <div className="data-list">
            {(data?.skills || []).map((skill) => (
              <article className="data-row" key={skill._id}>
                <div><strong>{skill.name}</strong><p className="mb-0 text-muted">{skill.category} · {skill.level}</p></div>
                <span className={`badge ${skill.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}`}>{skill.status}</span>
              </article>
            ))}
            {!data?.skills?.length && <p className="text-muted">You have not offered any skills yet.</p>}
          </div>
        )}
      </section>
    </>
  )
}

export function ManageSkillsForm() {
  const { token } = useAuth()
  const [selectedId, setSelectedId] = useState('')
  const submission = useSubmission()
  const { data, error, loading, reload } = useApiData('/skills')
  const { register, handleSubmit, reset, formState: { errors } } = useZodForm(skillManagementSchema)
  const selectedSkill = (data?.skills || []).find((skill) => skill._id === selectedId)

  useEffect(() => {
    if (selectedSkill) {
      reset({
        name: selectedSkill.name,
        category: selectedSkill.category,
        level: selectedSkill.level,
        description: selectedSkill.description,
        experience: selectedSkill.experience || '',
        availability: selectedSkill.availability,
        mode: selectedSkill.mode,
        status: selectedSkill.status === 'inactive' ? 'inactive' : 'active',
      })
    }
  }, [selectedSkill, reset])

  async function onSubmit(values) {
    const result = await submission.run(
      () => api(`/skills/${selectedId}`, { token, method: 'PATCH', body: JSON.stringify(values) }),
      'Your skill listing has been updated.',
    )
    if (result) reload()
  }

  return (
    <>
      <PageHeading eyebrow="Skill provider · Form 7" title="Manage offered skills" description="Update a listing or pause it so it is no longer visible to seekers." />
      <ErrorNotice error={error} />
      <FormCard><div className="card-body p-4">
        {loading ? <p>Loading your skills…</p> : (
          <>
            <label className="form-label" htmlFor="manage-skill-select">Choose a skill</label>
            <select id="manage-skill-select" className="form-select mb-4" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              <option value="">Select a skill listing</option>
              {(data?.skills || []).map((skill) => <option value={skill._id} key={skill._id}>{skill.name} · {skill.status}</option>)}
            </select>
            {selectedSkill ? (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormField label="Skill name" name="name" register={register} errors={errors} />
                <FormField label="Category" name="category" register={register} errors={errors} />
                <FormField label="Level" name="level" register={register} errors={errors} as="select" options={levels} />
                <FormField label="Description" name="description" register={register} errors={errors} as="textarea" />
                <FormField label="Availability" name="availability" register={register} errors={errors} />
                <FormField label="Experience" name="experience" register={register} errors={errors} as="textarea" />
                <FormField label="Teaching mode" name="mode" register={register} errors={errors} as="select" options={modes} />
                <FormField label="Status" name="status" register={register} errors={errors} as="select" options={['active', 'inactive']} />
                <SubmitButton loading={submission.loading}>Update skill</SubmitButton>
                <FormMessage message={submission.message} />
                <ErrorNotice error={submission.error} />
              </form>
            ) : <p className="text-muted">Select one of your saved skill listings to manage it.</p>}
          </>
        )}
      </div></FormCard>
    </>
  )
}

export function IncomingRequestsForm() {
  const { token } = useAuth()
  const submission = useSubmission()
  const { data, loading, error, reload } = useApiData('/exchanges')
  const { register, handleSubmit, watch, formState: { errors }, reset } = useZodForm(requestManagementSchema)
  const selectedId = watch('exchange')
  const requests = (data?.exchanges || []).filter((exchange) => ['requested', 'accepted', 'active'].includes(exchange.status))
  const selected = requests.find((exchange) => exchange._id === selectedId)

  useEffect(() => {
    if (selected) {
      reset({
        exchange: selected._id,
        status: selected.status === 'requested' ? 'accepted' : selected.status === 'accepted' ? 'active' : 'completed',
        providerResponse: selected.providerResponse || '',
      })
    }
  }, [selected, reset])

  async function onSubmit(values) {
    const result = await submission.run(
      () => api(`/exchanges/${values.exchange}`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ status: values.status, providerResponse: values.providerResponse }),
      }),
      'The exchange request has been updated.',
    )
    if (result) reload()
  }

  return (
    <>
      <PageHeading eyebrow="Skill provider · Form 8" title="Manage incoming exchange requests" description="Review requests and accept, reject, or update an active exchange." />
      <ErrorNotice error={error} />
      <FormCard><div className="card-body p-4">
        {loading ? <p>Loading incoming exchanges…</p> : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField
              label="Incoming request"
              name="exchange"
              register={register}
              errors={errors}
              as="select"
              options={requests.map((exchange) => ({
                value: exchange._id,
                label: `${exchange.skillToLearn} ↔ ${exchange.skillOffered} · ${exchange.status}`,
              }))}
            />
            {selected && (
              <div className="request-detail mb-3">
                <p><strong>From:</strong> {selected.seeker?.fullName}</p>
                <p><strong>Requested skill:</strong> {selected.skillToLearn}</p>
                <p><strong>Offering:</strong> {selected.skillOffered}</p>
                <p><strong>Preferred time:</strong> {new Date(selected.preferredDateTime).toLocaleString()}</p>
                <p className="mb-0"><strong>Message:</strong> {selected.message}</p>
              </div>
            )}
            {selected && (
              <>
                <FormField
                  label="Update status"
                  name="status"
                  register={register}
                  errors={errors}
                  as="select"
                  options={selected.status === 'requested' ? ['accepted', 'rejected'] : selected.status === 'accepted' ? ['active'] : ['completed']}
                />
                <FormField label="Response / message" name="providerResponse" register={register} errors={errors} as="textarea" />
                <SubmitButton loading={submission.loading}>Save request update</SubmitButton>
              </>
            )}
            {!requests.length && <p className="text-muted">There are no pending or active exchanges to manage.</p>}
            <FormMessage message={submission.message} />
            <ErrorNotice error={submission.error} />
          </form>
        )}
      </div></FormCard>
      <p className="mt-3"><Link to="/provider/feedback">View feedback</Link></p>
    </>
  )
}
