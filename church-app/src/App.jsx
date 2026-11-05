import { Toaster } from 'sonner';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster 
        position="top-right"
        richColors
        closeButton
      />
    </>
  );
}

export default App;
