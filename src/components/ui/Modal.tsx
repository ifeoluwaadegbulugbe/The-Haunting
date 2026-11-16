'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect()
    if (!rect) return
    const { clientX: x, clientY: y } = e
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      onClose()
    }
  }

  return (
    <>
      <style>{`
        dialog::backdrop {
          background: rgba(14, 12, 16, 0.85);
        }
        dialog {
          background: transparent;
          border: none;
          padding: 0;
          max-width: 90vw;
        }
      `}</style>
      <dialog ref={dialogRef} onClick={handleBackdropClick}>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-[var(--ink)] border border-gold rounded-lg p-6 min-w-72 max-w-md shadow-2xl"
            >
              {title && (
                <h2 className="font-cormorant text-parchment text-xl font-semibold mb-4">
                  {title}
                </h2>
              )}
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </dialog>
    </>
  )
}
