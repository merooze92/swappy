export function FormField({ label, name, register, errors, as = 'input', options = [], setValueAs, ...props }) {
  const error = errors?.[name]
  const common = {
    id: name,
    className: `form-control${error ? ' is-invalid' : ''}`,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${name}-error` : undefined,
    ...register(name, setValueAs ? { setValueAs } : undefined),
    ...props,
  }
  let control
  if (as === 'select') {
    control = (
      <select {...common} className={`form-select${error ? ' is-invalid' : ''}`}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>
    )
  } else if (as === 'textarea') {
    control = <textarea {...common} rows={props.rows || 4} />
  } else {
    control = <input {...common} type={as} />
  }

  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={name}>{label}</label>
      {control}
      {error && <div className="invalid-feedback" id={`${name}-error`}>{error.message}</div>}
    </div>
  )
}

export function SubmitButton({ loading, children = 'Save', className = '' }) {
  return (
    <button className={`btn btn-primary ${className}`} type="submit" disabled={loading}>
      {loading ? 'Please wait…' : children}
    </button>
  )
}

export function FormMessage({ message, type = 'success' }) {
  if (!message) return null
  return <div className={`alert alert-${type} mt-3`} role="status">{message}</div>
}

export function PageHeading({ eyebrow, title, description }) {
  return (
    <header className="page-heading mb-4">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {description && <p className="text-muted mb-0">{description}</p>}
    </header>
  )
}

export function FormCard({ children, className = '' }) {
  return <section className={`form-card card border-0 shadow-sm ${className}`}>{children}</section>
}

export function ErrorNotice({ error }) {
  return error ? <div className="alert alert-danger" role="alert">{error}</div> : null
}
