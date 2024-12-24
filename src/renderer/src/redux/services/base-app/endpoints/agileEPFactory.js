export const projectManagerGhost = (builder) =>
  builder.query({
    query: ({ conversation }) => ({
      url: 'agile/product-manager',
      method: 'POST',
      body: {
        conversation
      }
    })
  })
