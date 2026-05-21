'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import CurriculumForm from './CurriculumForm'

type ActionState = { error: string } | null

interface Props {
  subjects: { id: string; name: string }[]
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export default function CurriculumAddButton({ subjects, action }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Tambah Topik
      </DialogTrigger>
      <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Tambah Topik Baru</DialogTitle>
        </DialogHeader>
        <CurriculumForm
          subjects={subjects}
          action={action}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
