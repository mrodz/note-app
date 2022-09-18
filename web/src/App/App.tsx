import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Landing from '../Landing/Landing'
import NotFound from '../NotFound/NotFound'
import Login from '../Login/Login'
import Register from '../Register/Register'
import './App.css'
import { useContext, useEffect } from 'react'
import { Button, createTheme, ThemeProvider } from '@mui/material'
import { Context, LocalStorageSessionInfo } from '../AccountContext'
import AppHeading from './AppHeading'
import Dashboard from '../Dashboard/Dashboard'
import UserDocument from '../Documents/Document'
import Post from '../postRequest'
import { useSnackbar } from 'notistack'
import { TOS } from '../Register/TOS'
import { AnimatePresence } from 'framer-motion'

export const post = Post.config({
  baseURL: 'http://localhost:5000/api',
  interceptor: async (_, data) => {
    if ('name' in data && data.name === 'Invalid session id') {
      window.location.href = 'http://localhost:3000/login'
      document.dispatchEvent(new Event('on:account-logout'))
    }
  }
})

interface Notification {
  clear?: boolean,
  persist?: boolean,
  variant?: 'success' | 'error',
}

export function pushNotification(message, settings?: Notification) {
  document.dispatchEvent(new CustomEvent('on:snackbar', {
    detail: {
      clear: settings?.clear ?? false,
      message: message,
      variant: settings?.variant ?? 'success',
      persist: settings?.persist ?? false
    }
  }))
}

export function clearNotifications() {
  document.dispatchEvent(new Event('on:snackbar-clear'))
}

export const LoginTheme = createTheme({
  palette: {
    primary: {
      main: '#d68018'
    },
    secondary: {
      main: '#3b3740'
    }
  }
})

function App() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  useEffect(() => {
    function displaySnackbar(e) {
      if (e.detail?.clear) {
        closeSnackbar()
      }

      const key = 'SNACKBAR_' + Math.random()
      enqueueSnackbar(e.detail.message, {
        variant: e.detail.variant,
        persist: e.detail.persist,
        key: key,
        action: () => <Button color="secondary" onClick={() => { closeSnackbar(key) }}>{"×"}</Button>
      })
    }

    function clearNotifications() {
      closeSnackbar()
    }

    document.addEventListener('on:snackbar', displaySnackbar)
    document.addEventListener('on:snackbar-clear', clearNotifications)

    return () => {
      document.removeEventListener('on:snackbar', displaySnackbar)
      document.removeEventListener('on:snackbar-clear', clearNotifications)
    }
  }, [enqueueSnackbar, closeSnackbar])

  // find a more efficient way to do this.
  const user = useContext<LocalStorageSessionInfo>(Context)
  const location = useLocation()

  return (
    <ThemeProvider theme={LoginTheme}>
      <div className="App">
        <AnimatePresence mode="sync">
          <AppHeading locations={{
            '/dashboard': true,
          }} location={location.pathname} user={user} />
          <Routes location={location} key={location.pathname}>
            <Route path='*' element={<NotFound />} />
            <Route path='/' element={<Landing />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/dashboard' element={user?.sessionId ? <Dashboard /> : <Navigate replace to="/login" />} />
            <Route path='/d/:id' element={<UserDocument />} />
            <Route path='/tos' element={<TOS />} />
          </Routes>
        </AnimatePresence>
      </div>
    </ThemeProvider>
  )
}

export default App
