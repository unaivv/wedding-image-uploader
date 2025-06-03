import './App.css'
import './index.css'
import MainLayout from './components/MainLayout'
import 'rsuite/dist/rsuite-no-reset.min.css';
import { CustomProvider } from 'rsuite';

function App() {

  return (
    <>
      <CustomProvider theme="dark">
        <h1>Unai Y MF</h1>
        <MainLayout />
      </CustomProvider>
    </>
  )
}

export default App
