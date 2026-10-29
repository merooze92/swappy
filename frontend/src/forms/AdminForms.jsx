import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  adminSkillCreateSchema,
  adminSkillManagementSchema,
  adminLoginSchema,
  categorySchema,
  platformManagementSchema,
  userManagementSchema,
} from './schemas.js'

export function AdminLoginForm() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const submission = useSubmission()
  const { register, handleSubmit, formState: { errors } } = useZodForm(adminLoginSchema)

  async function onSubmit(values) {
    const result = await submission.run(async () => {
      const response = await api('/auth/login', { method: 'POST', body: JSON.stringify(values) })
      if (pathname === '/admin/login' && response.user.role !== 'admin') {
        throw new Error('This login page is for platform administrators.')
      }
      return response
    }, 'Signed in successfully.')
    if (result) {
      signIn(result)
      navigate(`/${result.user.role}/dashboard`, { replace: true })
    }
  }

  return (
    <>
      <PageHeading
        eyebrow={pathname === '/admin/login' ? 'Administrator' : 'Welcome back'}
        title={pathname === '/admin/login' ? 'Admin sign in' : 'Sign in to SWAPPY'}
        description={pathname === '/admin/login' ? 'Use the administrator credentials configured by the platform owner.' : 'Access your skill-swap dashboard.'}
      />
      <FormCard><div className="card-body p-4">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="Email" name="email" register={register} errors={errors} as="email" autoComplete="email" />
          <FormField label="Password" name="password" register={register} errors={errors} as="password" autoComplete="current-password" />
          <SubmitButton loading={submission.loading}>Sign in</SubmitButton>
          <FormMessage message={submission.message} />
          <ErrorNotice error={submission.error} />
        </form>
      </div></FormCard>
    </>
  )
}

export function UserManagementForm() {
  const { token } = useAuth()
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const submission = useSubmission()
  const { data, error, loading, reload } = useApiData(`/admin/users?search=${encodeURIComponent(search)}`)
  const { register, handleSubmit, reset, formState: { errors } } = useZodForm(userManagementSchema)
  const users = data?.users || []
  const selected = users.find((user) => user._id === selectedId)

  useEffect(() => {
    if (selected) {
      reset({
        user: selected._id,
        fullName: selected.fullName,
        email: selected.email,
        contactNumber: selected.contactNumber || '',
        bio: selected.bio || '',
        location: selected.location || '',
        active: selected.active,
      })
    }
  }, [selected, reset])

  async function onSubmit(values) {
    const { user, ...updates } = values
    const result = await submission.run(
      () => api(`/admin/users/${user}`, { token, method: 'PATCH', body: JSON.stringify(updates) }),
      'The user record has been updated.',
    )
    if (result) reload()
  }

  return (
    <>
      <PageHeading eyebrow="Admin · Form 10" title="Manage platform users" description="Search member accounts, update profile details, and activate or deactivate access." />
      <FormCard><div className="card-body p-4">
        <div className="d-flex gap-2 mb-4">
          <label className="visually-hidden" htmlFor="user-search">Search users</label>
          <input id="user-search" className="form-control" value={searchText} onChange={(event) => setSearchText(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              setSearch(searchText)
            }
          }} placeholder="Search by name or email" />
          <button type="button" className="btn btn-outline-primary" onClick={() => setSearch(searchText)}>Search</button>
        </div>
        <ErrorNotice error={error} />
        {loading ? <p>Loading users from MongoDB…</p> : (
          <>
            <label className="form-label" htmlFor="user-select">Select account</label>
            <select id="user-select" className="form-select mb-4" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              <option value="">Choose a user</option>
              {users.map((user) => <option value={user._id} key={user._id}>{user.fullName} · {user.email} · {user.role}</option>)}
            </select>
            {selected ? (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <input type="hidden" {...register('user')} />
                <FormField label="Full name" name="fullName" register={register} errors={errors} />
                <FormField label="Email" name="email" register={register} errors={errors} as="email" />
                <FormField label="Contact number" name="contactNumber" register={register} errors={errors} />
                <FormField label="Bio" name="bio" register={register} errors={errors} as="textarea" />
                <FormField label="Location" name="location" register={register} errors={errors} />
                <div className="form-check mb-3">
                  <input className="form-check-input" id="user-active" type="checkbox" {...register('active')} />
                  <label className="form-check-label" htmlFor="user-active">Account is active</label>
                  {errors.active && <div className="text-danger small">{errors.active.message}</div>}
                </div>
                <p className="text-muted">Role: {selected.role} · Passwords are never shown or edited here.</p>
                <SubmitButton loading={submission.loading}>Save user changes</SubmitButton>
                <FormMessage message={submission.message} />
                <ErrorNotice error={submission.error} />
              </form>
            ) : <p className="text-muted mb-0">{users.length ? 'Choose an account to edit.' : 'No user records matched your search.'}</p>}
          </>
        )}
      </div></FormCard>
    </>
  )
}

export function SkillCategoryManagementForm() {
  const { token } = useAuth()
  const [refresh, setRefresh] = useState(0)
  const [editingCategoryId, setEditingCategoryId] = useState('')
  const [editingSkillId, setEditingSkillId] = useState('')
  const submission = useSubmission()
  const { data: categoryData, error: categoryError, loading: categoriesLoading, reload: reloadCategories } = useApiData('/skills/categories', refresh)
  const { data: skillData, error: skillError, loading: skillsLoading, reload: reloadSkills } = useApiData('/admin/skills', refresh)
  const { data: providerData, error: providerError, loading: providersLoading } = useApiData('/admin/users?role=provider', refresh)
  const { register, handleSubmit, reset, formState: { errors } } = useZodForm(categorySchema)
  const { register: registerNewSkill, handleSubmit: handleNewSkillSubmit, reset: resetNewSkill, formState: { errors: newSkillErrors } } = useZodForm(adminSkillCreateSchema)
  const { register: registerSkill, handleSubmit: handleSkillSubmit, reset: resetSkill, formState: { errors: skillErrors } } = useZodForm(adminSkillManagementSchema)
  const categories = categoryData?.categories || []
  const skills = skillData?.skills || []
  const editingCategory = categories.find((category) => category._id === editingCategoryId)
  const editingSkill = skills.find((skill) => skill._id === editingSkillId)

  useEffect(() => {
    if (editingCategory) reset({ name: editingCategory.name, description: editingCategory.description || '' })
  }, [editingCategory, reset])

  useEffect(() => {
    if (editingSkill) {
      resetSkill({
        name: editingSkill.name,
        category: editingSkill.category,
        level: editingSkill.level,
        description: editingSkill.description,
        experience: editingSkill.experience || '',
        availability: editingSkill.availability,
        mode: editingSkill.mode,
        status: editingSkill.status,
      })
    }
  }, [editingSkill, resetSkill])

  async function onSubmit(values) {
    const result = await submission.run(
      () => api(editingCategoryId ? `/skills/categories/${editingCategoryId}` : '/skills/categories', {
        token,
        method: editingCategoryId ? 'PATCH' : 'POST',
        body: JSON.stringify(values),
      }),
      `The category has been ${editingCategoryId ? 'updated' : 'saved'}.`,
    )
    if (result) {
      setEditingCategoryId('')
      reset()
      setRefresh((value) => value + 1)
      reloadCategories()
    }
  }

  async function onSkillSubmit(values) {
    const result = await submission.run(
      () => api(`/admin/skills/${editingSkillId}`, { token, method: 'PATCH', body: JSON.stringify(values) }),
      'The skill listing has been updated.',
    )
    if (result) {
      setEditingSkillId('')
      setRefresh((value) => value + 1)
      reloadSkills()
    }
  }

  async function onNewSkillSubmit(values) {
    const result = await submission.run(
      () => api('/admin/skills', { token, method: 'POST', body: JSON.stringify(values) }),
      'The provider skill listing has been added.',
    )
    if (result) {
      resetNewSkill()
      setRefresh((value) => value + 1)
      reloadSkills()
    }
  }

  async function setSkillStatus(skill, status) {
    await submission.run(
      () => api(`/admin/skills/${skill._id}`, { token, method: 'PATCH', body: JSON.stringify({ status }) }),
      `The skill is now ${status}.`,
    )
    reloadSkills()
  }

  async function setCategoryStatus(category) {
    await submission.run(
      () => api(`/skills/categories/${category._id}`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ active: !category.active }),
      }),
      `Category ${category.active ? 'deactivated' : 'activated'}.`,
    )
    reloadCategories()
  }

  return (
    <>
      <PageHeading eyebrow="Admin · Form 11" title="Manage skills and categories" description="Create skill categories, moderate inappropriate listings, and manage listing visibility." />
      <FormCard className="mb-4"><div className="card-body p-4">
        <h2 className="h4">{editingCategoryId ? 'Update category' : 'Add a skill category'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="Category name" name="name" register={register} errors={errors} />
          <FormField label="Description" name="description" register={register} errors={errors} as="textarea" />
          <SubmitButton loading={submission.loading}>{editingCategoryId ? 'Update category' : 'Save category'}</SubmitButton>
          {editingCategoryId && <button className="btn btn-link" type="button" onClick={() => { setEditingCategoryId(''); reset() }}>Cancel</button>}
          <FormMessage message={submission.message} />
          <ErrorNotice error={submission.error} />
        </form>
      </div></FormCard>
      <FormCard className="mb-4"><div className="card-body p-4">
        <h2 className="h4">Add a skill listing for a provider</h2>
        <ErrorNotice error={providerError} />
        {providersLoading ? <p>Loading providers…</p> : (
          <form onSubmit={handleNewSkillSubmit(onNewSkillSubmit)} noValidate>
            <FormField
              label="Provider"
              name="provider"
              register={registerNewSkill}
              errors={newSkillErrors}
              as="select"
              options={(providerData?.users || []).filter((provider) => provider.active).map((provider) => ({
                value: provider._id,
                label: `${provider.fullName} · ${provider.email}`,
              }))}
            />
            <FormField label="Skill name" name="name" register={registerNewSkill} errors={newSkillErrors} />
            <FormField label="Category" name="category" register={registerNewSkill} errors={newSkillErrors} />
            <FormField label="Level" name="level" register={registerNewSkill} errors={newSkillErrors} as="select" options={['Beginner', 'Intermediate', 'Advanced', 'Expert']} />
            <FormField label="Description" name="description" register={registerNewSkill} errors={newSkillErrors} as="textarea" />
            <FormField label="Experience" name="experience" register={registerNewSkill} errors={newSkillErrors} as="textarea" />
            <FormField label="Availability" name="availability" register={registerNewSkill} errors={newSkillErrors} />
            <FormField label="Teaching mode" name="mode" register={registerNewSkill} errors={newSkillErrors} as="select" options={['In person', 'Online', 'Either']} />
            <SubmitButton loading={submission.loading}>Add skill listing</SubmitButton>
            <FormMessage message={submission.message} />
            <ErrorNotice error={submission.error} />
            {!providerData?.users?.length && <p className="text-muted mt-2">Register a provider before adding a skill listing.</p>}
          </form>
        )}
      </div></FormCard>
      <div className="row g-4">
        <div className="col-lg-5">
          <h2 className="h4">Categories</h2>
          <ErrorNotice error={categoryError} />
          {categoriesLoading ? <p>Loading categories…</p> : (
            <div className="data-list">
              {categories.map((category) => (
                <article className="data-row" key={category._id}>
                  <div><strong>{category.name}</strong><p className="mb-0 text-muted">{category.description || 'No description'}</p></div>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setEditingCategoryId(category._id)}>Edit</button>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setCategoryStatus(category)}>
                      {category.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </article>
              ))}
              {!categories.length && <p className="text-muted">No categories have been created.</p>}
            </div>
          )}
        </div>
        <div className="col-lg-7">
          <h2 className="h4">Skill listings</h2>
          <ErrorNotice error={skillError} />
          {skillsLoading ? <p>Loading skill listings…</p> : (
            <div className="data-list">
              {skills.map((skill) => (
                <article className="data-row align-items-start" key={skill._id}>
                  <div><strong>{skill.name}</strong><p className="mb-0 text-muted">{skill.category} · {skill.owner?.fullName} · {skill.status}</p></div>
                  <div className="d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setEditingSkillId(skill._id)}>Edit</button>
                    {skill.status !== 'flagged' && <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => setSkillStatus(skill, 'flagged')}>Flag</button>}
                    {skill.status !== 'inactive' && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setSkillStatus(skill, 'inactive')}>Archive</button>}
                    {skill.status !== 'active' && <button type="button" className="btn btn-sm btn-outline-success" onClick={() => setSkillStatus(skill, 'active')}>Restore</button>}
                  </div>
                </article>
              ))}
              {!skills.length && <p className="text-muted">No skill listings have been submitted.</p>}
            </div>
          )}
        </div>
      </div>
      {editingSkill && (
        <FormCard className="mt-4"><div className="card-body p-4">
          <h2 className="h4">Edit skill listing</h2>
          <form onSubmit={handleSkillSubmit(onSkillSubmit)} noValidate>
            <FormField label="Skill name" name="name" register={registerSkill} errors={skillErrors} />
            <FormField label="Category" name="category" register={registerSkill} errors={skillErrors} />
            <FormField label="Level" name="level" register={registerSkill} errors={skillErrors} as="select" options={['Beginner', 'Intermediate', 'Advanced', 'Expert']} />
            <FormField label="Description" name="description" register={registerSkill} errors={skillErrors} as="textarea" />
            <FormField label="Experience" name="experience" register={registerSkill} errors={skillErrors} as="textarea" />
            <FormField label="Availability" name="availability" register={registerSkill} errors={skillErrors} />
            <FormField label="Teaching mode" name="mode" register={registerSkill} errors={skillErrors} as="select" options={['In person', 'Online', 'Either']} />
            <FormField label="Status" name="status" register={registerSkill} errors={skillErrors} as="select" options={['active', 'inactive', 'flagged']} />
            <SubmitButton loading={submission.loading}>Update skill listing</SubmitButton>
            <button className="btn btn-link" type="button" onClick={() => setEditingSkillId('')}>Cancel</button>
            <FormMessage message={submission.message} />
            <ErrorNotice error={submission.error} />
          </form>
        </div></FormCard>
      )}
    </>
  )
}

export function PlatformManagementForm() {
  const { token } = useAuth()
  const submission = useSubmission()
  const { data, loading, error, reload } = useApiData('/admin/exchanges')
  const { data: activityData, error: activityError, loading: activityLoading } = useApiData('/admin/activity')
  const { register, handleSubmit, reset, watch, formState: { errors } } = useZodForm(platformManagementSchema)
  const selectedId = watch('exchange')
  const exchanges = data?.exchanges || []
  const selected = exchanges.find((exchange) => exchange._id === selectedId)

  useEffect(() => {
    if (selected) reset({ exchange: selected._id, status: selected.status, providerResponse: selected.providerResponse || '' })
  }, [selected, reset])

  async function onSubmit(values) {
    const result = await submission.run(
      () => api(`/exchanges/${values.exchange}`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ status: values.status, providerResponse: values.providerResponse }),
      }),
      'The exchange status has been updated.',
    )
    if (result) reload()
  }

  return (
    <>
      <PageHeading eyebrow="Admin · Form 12" title="Platform and exchange management" description="Monitor exchange activity, intervene where needed, and review the platform audit trail." />
      <ErrorNotice error={error} />
      <FormCard className="mb-4"><div className="card-body p-4">
        <h2 className="h4">Review an exchange</h2>
        {loading ? <p>Loading exchanges…</p> : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField
              label="Exchange"
              name="exchange"
              register={register}
              errors={errors}
              as="select"
              options={exchanges.map((exchange) => ({
                value: exchange._id,
                label: `${exchange.skillToLearn} · ${exchange.seeker?.fullName} ↔ ${exchange.provider?.fullName} · ${exchange.status}`,
              }))}
            />
            {selected && <p className="text-muted">Provider skill: {selected.skill?.name || 'Unavailable'} · Requested: {new Date(selected.preferredDateTime).toLocaleString()}</p>}
            <FormField label="Exchange status" name="status" register={register} errors={errors} as="select" options={['requested', 'accepted', 'rejected', 'active', 'completed', 'cancelled']} />
            <FormField label="Admin note / response" name="providerResponse" register={register} errors={errors} as="textarea" />
            <SubmitButton loading={submission.loading}>Update exchange</SubmitButton>
            <FormMessage message={submission.message} />
            <ErrorNotice error={submission.error} />
            {!exchanges.length && <p className="text-muted">There are no exchanges to manage yet.</p>}
          </form>
        )}
      </div></FormCard>
      <section>
        <h2 className="h4">Platform activity</h2>
        <ErrorNotice error={activityError} />
        {activityLoading ? <p>Loading activity…</p> : (
          <div className="data-list">
            {(activityData?.activity || []).map((item) => (
              <article className="data-row" key={item._id}>
                <div><strong>{item.action.replaceAll('.', ' ')}</strong><p className="mb-0">{item.details}</p><small className="text-muted">{item.actor?.fullName || 'Former member'} · {new Date(item.createdAt).toLocaleString()}</small></div>
              </article>
            ))}
            {!activityData?.activity?.length && <p className="text-muted">No recorded platform activity yet.</p>}
          </div>
        )}
      </section>
    </>
  )
}
