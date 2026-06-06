import { AuthProvider } from './AuthContext';

export function AppProviders({ children }: { children: React.ReactNode }): JSX.Element {
  return <AuthProvider>{children}</AuthProvider>;
}
