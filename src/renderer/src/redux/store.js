import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'

import { baseApi } from './services/base-app'
import toastsReducer from './reducers/toast'
import errorHandlingMiddleware from './middlewares/error-handling'

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    toasts: toastsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, errorHandlingMiddleware)
})

setupListeners(store.dispatch)
