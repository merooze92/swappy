import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export function useZodForm(schema, options = {}) {
  return useForm({ resolver: zodResolver(schema), mode: 'onTouched', ...options })
}
