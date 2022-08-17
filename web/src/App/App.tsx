import { Route, Routes } from 'react-router-dom';
import Landing from '../Landing/Landing';
import NotFound from '../NotFound/NotFound';
import Login from '../Login/Login';
import Register from '../Register/Register'
import { SnackbarProvider } from 'notistack'
import './App.css';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material';

const pages = ['Products', 'Pricing', 'Blog'];
const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

function App() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

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

  return (
    <ThemeProvider theme={LoginTheme}>

      <SnackbarProvider maxSnack={3}>
        <div className="App">
          <Routes>
            <Route path='*' element={<NotFound />} />
            <Route path='/' element={<Landing />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
          </Routes>
        </div>
      </SnackbarProvider>
    </ThemeProvider>

  );
}

export default App;
