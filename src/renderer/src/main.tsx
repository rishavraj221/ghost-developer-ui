import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import '@radix-ui/themes/styles.css'

import './global.css'
import { Theme } from '@radix-ui/themes'
// import { Flex, Text, Button } from '@radix-ui/themes'
import App from './App'
import store from './redux'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <Theme>
        <App />
        {/* <ThemePanel /> */}
      </Theme>
    </Provider>
  </React.StrictMode>
)
