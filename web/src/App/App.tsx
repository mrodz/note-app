import { Route, Routes } from 'react-router-dom';
import Landing from '../Landing/Landing';
import NotFound from '../NotFound/NotFound';
import Login from '../Login/Login';
import Register from '../Register/Register'
import { useSnackbar } from 'notistack'
import './App.css';
import React, { useContext } from 'react';
import { createTheme, ThemeProvider } from '@mui/material';
import LogoutButton from '../Login/LogoutButton';
import { AccountContext, Context } from '../AccountContext';

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

  const user = useContext(Context)

  return (
    <ThemeProvider theme={LoginTheme}>
      <div className="App">
        <header className='App-header'>
          <LogoutButton />
        </header>
        <Routes>
          <Route path='*' element={<NotFound />} />
          <Route path='/' element={<Landing />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
        </Routes>
        signed in as {user?.username}
      </div>
    </ThemeProvider>
  );
}

export default App;
