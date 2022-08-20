import { Navigate, Route, Routes } from 'react-router-dom';
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

  const user = useContext<LocalStorageSessionInfo>(Context)

  return (
    <ThemeProvider theme={LoginTheme}>
      <div className="App">
        <AppHeading user={user} bgColor={LoginTheme.palette.primary.main} />
        <Routes>
          <Route path='*' element={<NotFound />} />
          <Route path='/' element={<Landing />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/dashboard' element={user?.sessionId ? <Dashboard /> : <Navigate replace to="/login" />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
