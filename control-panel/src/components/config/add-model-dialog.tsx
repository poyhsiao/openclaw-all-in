import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ModelFormData } from '@/services/config-hooks'

const modelFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  provider: z.enum(['ollama', 'openai', 'anthropic', 'google'], {
    required_error: 'Provider is required',
  }),
  modelId: z.string().min(1, 'Model ID is required').max(200, 'Model ID must be less than 200 characters'),
  temperature: z.number().min(0, 'Temperature must be at least 0').max(2, 'Temperature must be at most 2').optional(),
  maxTokens: z.number().min(1, 'Max tokens must be at least 1').max(128000, 'Max tokens must be at most 128000').optional(),
  isDefault: z.boolean().optional(),
})

interface AddModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ModelFormData) => Promise<void>
  isSubmitting?: boolean
}

export function AddModelDialog({ open, onOpenChange, onSubmit, isSubmitting }: AddModelDialogProps) {
  const form = useForm<z.infer<typeof modelFormSchema>>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      name: '',
      provider: 'ollama',
      modelId: '',
      temperature: 0.7,
      maxTokens: 2048,
      isDefault: false,
    },
  })

  const handleSubmit = async (data: z.infer<typeof modelFormSchema>) => {
    try {
      await onSubmit(data)
      form.reset()
    } catch (error) {
      // Error is handled by parent, don't reset form
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Model</DialogTitle>
          <DialogDescription>
            Add a new AI model configuration for inference
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Model" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="ollama">Ollama</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model ID</FormLabel>
                  <FormControl>
                    <Input placeholder="qwen2.5:3b" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperature (0-2)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      placeholder="0.7"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          field.onChange(undefined)
                        } else {
                          const parsed = parseFloat(value)
                          field.onChange(Number.isNaN(parsed) ? undefined : parsed)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxTokens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Tokens</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="128000"
                      placeholder="2048"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          field.onChange(undefined)
                        } else {
                          const parsed = parseInt(value)
                          field.onChange(Number.isNaN(parsed) ? undefined : parsed)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Model'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
