import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  apiSupervisorEPFactory,
  folderGhostEPFactory,
  queryGhostEPFactory,
  supervisorEPFactory,
  uiSupervisorEPFactory,
  projectManagerGhostEPFactory,
  ghostBuilderEPFactory
} from './endpoints/index.js'
import { API_BASE_URL, API_PREFIX } from '../../../settings/index.js'

export const baseApi = createApi({
  reducerPath: 'baseApi',
  tagTypes: ['user', 'gameStats'],
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/${API_PREFIX}`
  }),
  endpoints: (builder) => ({
    queryGhost: queryGhostEPFactory(builder),
    supervisor: supervisorEPFactory(builder),
    uiSupervisor: uiSupervisorEPFactory(builder),
    apiSupervisor: apiSupervisorEPFactory(builder),
    folderGhost: folderGhostEPFactory(builder),
    projectManagerGhost: projectManagerGhostEPFactory(builder),
    ghostBuilder: ghostBuilderEPFactory(builder)
  })
})

export const {
  useLazyQueryGhostQuery,
  useLazySupervisorQuery,
  useLazyUiSupervisorQuery,
  useLazyApiSupervisorQuery,
  useLazyFolderGhostQuery,
  useLazyProjectManagerGhostQuery,
  useLazyGhostBuilderQuery
} = baseApi
