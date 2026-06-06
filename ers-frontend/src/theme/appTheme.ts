import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    primary: {
      main: '#0d3b66',
      dark: '#0a2948',
      light: '#2a5883'
    },
    secondary: {
      main: '#0c7b93'
    },
    error: {
      main: '#b42318'
    },
    warning: {
      main: '#d97706'
    },
    success: {
      main: '#157347'
    },
    background: {
      default: '#edf2f7',
      paper: '#ffffff'
    },
    text: {
      primary: '#10243a',
      secondary: '#5d7286'
    }
  },
  shape: {
    borderRadius: 20
  },
  typography: {
    fontFamily: '"Segoe UI Variable", "Bahnschrift", "IBM Plex Sans", sans-serif',
    h3: {
      fontWeight: 700
    },
    h4: {
      fontWeight: 700
    },
    h5: {
      fontWeight: 700
    },
    h6: {
      fontWeight: 700
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 18px 40px rgba(16, 36, 58, 0.08)'
        }
      }
    }
  }
});
