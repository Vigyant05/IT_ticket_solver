'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import { useNewTicket } from '@admin/hooks/useNewTicket';
import { TicketPriority, TicketCategory } from '@admin/lib/types';
import { cn } from '@admin/lib/utils';

const schema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requesterName: z.string().min(2, 'Name must be at least 2 characters'),
  requesterDepartment: z.string().min(2, 'Department is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as [TicketPriority, ...TicketPriority[]]),
  category: z.enum([
    'Network', 'Software', 'Hardware', 'Licensing', 'Security', 'Access', 'Other',
  ] as [TicketCategory, ...TicketCategory[]]),
});

type FormValues = z.infer<typeof schema>;

export function NewTicketDialog() {
  const [open, setOpen] = useState(false);

  const { mutate, isPending } = useNewTicket(() => {
    setOpen(false);
    reset();
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'medium',
      category: 'Software',
    },
  });

  const onSubmit = (data: FormValues) => mutate(data);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/50 text-white text-sm font-semibold rounded-lg shadow-md shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus size={15} />
        New Ticket
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Create New Ticket</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fill in the details to submit a support request
                </p>
              </div>
              <button
                onClick={() => !isPending && setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Subject *
                </label>
                <input
                  {...register('subject')}
                  placeholder="Brief description of the issue"
                  className={cn(
                    'w-full px-3 py-2.5 text-sm bg-muted/40 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50',
                    errors.subject ? 'border-red-500/50' : 'border-border/60'
                  )}
                />
                {errors.subject && (
                  <p className="text-xs text-red-400 mt-1">{errors.subject.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Description *
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Detailed explanation of the issue..."
                  className={cn(
                    'w-full px-3 py-2.5 text-sm bg-muted/40 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none placeholder:text-muted-foreground/50',
                    errors.description ? 'border-red-500/50' : 'border-border/60'
                  )}
                />
                {errors.description && (
                  <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Name + Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Your Name *
                  </label>
                  <input
                    {...register('requesterName')}
                    placeholder="Full name"
                    className={cn(
                      'w-full px-3 py-2.5 text-sm bg-muted/40 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50',
                      errors.requesterName ? 'border-red-500/50' : 'border-border/60'
                    )}
                  />
                  {errors.requesterName && (
                    <p className="text-xs text-red-400 mt-1">{errors.requesterName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Department *
                  </label>
                  <input
                    {...register('requesterDepartment')}
                    placeholder="e.g. Engineering"
                    className={cn(
                      'w-full px-3 py-2.5 text-sm bg-muted/40 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50',
                      errors.requesterDepartment ? 'border-red-500/50' : 'border-border/60'
                    )}
                  />
                  {errors.requesterDepartment && (
                    <p className="text-xs text-red-400 mt-1">{errors.requesterDepartment.message}</p>
                  )}
                </div>
              </div>

              {/* Priority + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Priority
                  </label>
                  <select
                    {...register('priority')}
                    className="w-full px-3 py-2.5 text-sm bg-muted/40 border border-border/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Category
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2.5 text-sm bg-muted/40 border border-border/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  >
                    {['Network', 'Software', 'Hardware', 'Licensing', 'Security', 'Access', 'Other'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !isPending && setOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-muted/40 border border-border/60 rounded-lg hover:bg-muted/60 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary hover:bg-primary/50 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg shadow-md shadow-primary/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isPending ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
