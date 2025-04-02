import { toast } from "sonner"

export const useToast = () => {
  return {
    toast: (options) => {
      if (typeof options === 'string') {
        return toast(options)
      }
      const { title, description, variant } = options
      return toast(title, {
        description,
        ...(variant === 'destructive' ? { style: { backgroundColor: 'rgb(239 68 68)', color: 'white' } } : {})
      })
    },
    toasts: [], // Sonner manages its own toast state internally
  }
} 