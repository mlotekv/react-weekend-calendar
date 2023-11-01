import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ruRU } from '@mui/x-date-pickers/locales';
import { ruRU as coreLocale } from '@mui/material/locale';
import Calendar from './Calendar.tsx'
import './App.css'


const theme = createTheme(
  {
    palette: {
      mode: 'dark',
    }
  },
  ruRU, // x-date-pickers translations
  coreLocale, // core translations
);

function App() {
  return <ThemeProvider theme={theme}><Calendar/></ThemeProvider>;
}

export default App
