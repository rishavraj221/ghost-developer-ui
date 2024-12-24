import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Provider } from 'react-redux'

import './global.css'
import App from './App'
import { ThemeProvider } from './components/theme-provider'
import store from './redux'

const darkTheme = createTheme({
  palette: {
    mode: 'dark'
  }
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <MUIThemeProvider theme={darkTheme}>
          <CssBaseline />
          <App />
        </MUIThemeProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
)
