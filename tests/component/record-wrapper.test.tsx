import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecordWrapper } from '@/components/digital/RecordWrapper'
import { CASE_001 } from '@/data/case001'

const record = (id: string) => CASE_001.digital.find((r) => r.id === id)!

describe('RecordWrapper', () => {
  it('a visible record holding evidence can be logged with one click', () => {
    const onRecover = vi.fn()
    render(<RecordWrapper record={record('DR-telco')} isRecovered={false} conditionMet isCollected={false} onRecover={onRecover} />)
    fireEvent.click(screen.getByRole('button', { name: 'Log as evidence' }))
    expect(onRecover).toHaveBeenCalledTimes(1)
  })

  it('a logged record shows LOGGED and no button', () => {
    render(<RecordWrapper record={record('DR-photo')} isRecovered={false} conditionMet isCollected onRecover={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Log as evidence' })).toBeNull()
    expect(screen.getByRole('img', { name: 'LOGGED' })).toBeTruthy()
  })

  it('a texture record (no evidence) has no button', () => {
    render(<RecordWrapper record={record('DR-txt-01')} isRecovered={false} conditionMet isCollected={false} onRecover={() => {}} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('a deleted record offers Recover only once its condition is met', () => {
    const { rerender } = render(
      <RecordWrapper record={record('DR-voicemail')} isRecovered={false} conditionMet={false} onRecover={() => {}} />
    )
    expect(screen.queryByRole('button', { name: 'Recover' })).toBeNull()
    rerender(<RecordWrapper record={record('DR-voicemail')} isRecovered={false} conditionMet onRecover={() => {}} />)
    expect(screen.getByRole('button', { name: 'Recover' })).toBeTruthy()
  })
})
