export const queryGhost = (builder) =>
  builder.query({
    query: ({ conversation }) => ({
      url: 'query-agent',
      method: 'POST',
      body: {
        conversation
      }
    })
  })

export const supervisor = (builder) =>
  builder.query({
    query: ({ query, ui_dir_path, api_dir_path }) => ({
      url: 'supervisor',
      method: 'POST',
      body: {
        query,
        ui_dir_path,
        api_dir_path
      }
    })
  })

export const uiSupervisor = (builder) =>
  builder.query({
    query: ({ query, ui_dir_path }) => ({
      url: 'ui-supervisor',
      method: 'POST',
      body: {
        query,
        ui_dir_path
      }
    })
  })

export const apiSupervisor = (builder) =>
  builder.query({
    query: ({ query, api_dir_path }) => ({
      url: 'api-supervisor',
      method: 'POST',
      body: {
        query,
        api_dir_path
      }
    })
  })

export const folderGhost = (builder) =>
  builder.query({
    query: ({ folder_agent_id, agent_prompt, ui_dir_path, api_dir_path }) => ({
      url: 'folder-agent',
      method: 'POST',
      body: {
        folder_agent_id,
        agent_prompt,
        ui_dir_path,
        api_dir_path
      }
    })
  })

export const ghostBuilderEPFactory = (builder) =>
  builder.query({
    query: ({ conversation, codebase_info, code_info }) => ({
      url: 'app-service-v3',
      method: 'POST',
      body: {
        conversation,
        codebase_info,
        code_info
      }
    })
  })
