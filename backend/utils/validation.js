export function validate(schema, input) {
  const result = schema.safeParse(input)
  if (!result.success) {
    const error = new Error(result.error.issues[0]?.message || 'Please check the submitted information.')
    error.status = 400
    throw error
  }
  return result.data
}

export function notFound(res, message = 'Record not found.') {
  return res.status(404).json({ message })
}
