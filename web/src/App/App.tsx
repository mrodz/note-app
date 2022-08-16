import { Route, Routes } from 'react-router-dom';
import Landing from '../Landing/Landing';
import NotFound from '../NotFound/NotFound';
import Login from '../Login/Login';
import Register from '../Register/Register'
import { SnackbarProvider } from 'notistack'
import './App.css';

function App() {
  return (
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
  );
}

export default App;
