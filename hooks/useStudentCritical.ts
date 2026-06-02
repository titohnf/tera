'use client'

import { useMemo } from 'react'
import {
  evaluateBatchCritical,
  getCriticalStudentIds,
  type StudentCriticalInput,
  type StudentCriticalResult,
} from '@/lib/studentCritical'

interface UseStudentCriticalReturn {
  results: StudentCriticalResult[]
  resultMap: Map<string, StudentCriticalResult>
  criticalStudentIds: string[]
  summary: {
    totalCritical: number
    byLevel: { level1: number; level2: number; level3: number }
    byCondition: Record<string, number>
    mostCommonCondition: string
  }
}

export function useStudentCritical(students: StudentCriticalInput[]): UseStudentCriticalReturn {
  return useMemo(() => {
    const { results, summary } = evaluateBatchCritical(students)
    const resultMap = new Map(results.map(r => [r.studentId, r]))
    const criticalStudentIds = getCriticalStudentIds(results)
    return { results, resultMap, criticalStudentIds, summary }
  }, [students])
}
