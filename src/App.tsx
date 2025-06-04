import './App.css'
import './index.css'
import 'rsuite/dist/rsuite-no-reset.min.css';
import { CustomProvider } from 'rsuite';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/home';
import UploadPage from './pages/upload';

function App() {

  return (
    <>
    <BrowserRouter>
      <CustomProvider theme="dark">
        <Routes>
          <Route path="/" element={ <Home /> } />
          <Route path="subir" element={ <UploadPage /> } />
        </Routes>
      </CustomProvider>
    </BrowserRouter>
    </>
  )
}

export default App
