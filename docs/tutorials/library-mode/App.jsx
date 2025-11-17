import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
