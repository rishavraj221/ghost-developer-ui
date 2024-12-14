import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import Notification from '../../components/custom/notification'
import { removeToast } from '../reducers/toast'

const AlertHandler = () => {
  const dispatch = useDispatch()

  const toasts = useSelector((state) => state.toasts)

  const handleToastDismiss = (toastId) => {
    dispatch(removeToast(toastId))
  }

  return (
    <>
      {console.log('toasts length', toasts.length)}
      {toasts?.length > 0 &&
        toasts.map(({ toastId, open, message, severity }) => (
          <Notification
            key={toastId}
            open={open} // Determines if the notification is visible
            message={message} // The message displayed in the notification
            severity={severity} // The severity level of the notification
            onClose={() => handleToastDismiss(toastId)} // Handle notification close
          />
        ))}
    </>
  )
}

export default AlertHandler
