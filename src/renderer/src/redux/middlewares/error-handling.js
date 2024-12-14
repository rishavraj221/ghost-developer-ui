import { pushToast } from '../reducers/toast'

const errorHandlingMiddleware =
  ({ dispatch }) =>
  (next) =>
  (action) => {
    if (action.error && action.meta && action.meta.baseQueryMeta) {
      const status = action.meta.baseQueryMeta.response.status

      if (status >= 400) {
        dispatch(
          pushToast({
            message:
              action.payload?.data?.error ||
              action.error?.message ||
              action.payload?.message ||
              'Something went wrong!',
            severity: 'error'
          })
        )
      }
    }

    return next(action)
  }

export default errorHandlingMiddleware
