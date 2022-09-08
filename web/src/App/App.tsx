import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Landing from '../Landing/Landing';
import NotFound from '../NotFound/NotFound';
import Login from '../Login/Login';
import Register from '../Register/Register'
import './App.css';
import { useContext } from 'react';
import { createTheme, ThemeProvider } from '@mui/material';
import { Context, LocalStorageSessionInfo } from '../AccountContext';
import AppHeading from './AppHeading';
import Dashboard from '../Dashboard/Dashboard';
import { AnimatePresence } from 'framer-motion'
import UserDocument from '../Documents/Document';
import Post from '../postRequest';

export const post = Post.config({
  baseURL: 'http://localhost:5000/api',
  interceptor: async (_, data) => {
    if ('name' in data && data.name === 'Invalid session id') {
      window.location.href = 'http://localhost:3000/login'
      document.dispatchEvent(new Event('on:account-logout'))
    }
  }
})

function App() {
  const LoginTheme = createTheme({
    palette: {
      primary: {
        main: '#d68018'
      },
      secondary: {
        main: '#3b3740'
      }
    }
  })

  // find a more efficient way to do this.
  const user = useContext<LocalStorageSessionInfo>(Context)
  const location = useLocation()

  return (
    <ThemeProvider theme={LoginTheme}>
      <div className="App">
        <AnimatePresence>
          <AppHeading user={user} bgColor={LoginTheme.palette.primary.main} />
          <Routes location={location} key={location.pathname}>
            <Route path='*' element={<NotFound />} />
            <Route path='/' element={<Landing />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/dashboard' element={user?.sessionId ? <Dashboard /> : <Navigate replace to="/login" />} />
            <Route path='/d/:id' element={<UserDocument />} />
          </Routes>
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
}

export default App;
