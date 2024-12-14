import React from 'react'

import {
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport
} from '../ui/toast'
import { Button } from '../ui/button'

const Notification = ({ open, onClose, message, severity = 'info', autoHideDuration = 5000 }) => {
  // Maps severity to corresponding styles
  const severityStyles = {
    info: 'bg-blue-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-black',
    error: 'bg-red-500 text-white'
  }

  // Auto-close the Toast after a specified duration
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose(false)
      }, autoHideDuration)
      return () => clearTimeout(timer)
    }
  }, [open, onClose, autoHideDuration])

  if (!open) return null

  return (
    <ToastProvider>
      <ToastRoot className={`rounded-lg p-4 ${severityStyles[severity]}`}>
        <ToastTitle className="font-bold">{severity.toUpperCase()}</ToastTitle>
        <ToastDescription>{message}</ToastDescription>
        <ToastClose asChild>
          <Button variant="ghost" size="sm" onClick={() => onClose(false)}>
            Close
          </Button>
        </ToastClose>
      </ToastRoot>
      <ToastViewport className="fixed top-4 right-4 z-50" />
    </ToastProvider>
  )
}

export default Notification
