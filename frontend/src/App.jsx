import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import Dashboard from './pages/admin/Dashboard';
import ProductForm from './pages/admin/ProductForm';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import { Toaster } from 'react-hot-toast';


function App() {
  return (
    <BrowserRouter>
      <Navbar />
      
      <Toaster position="top-center" toastOptions={{ style: { fontSize: '0.875rem', fontWeight: '500' } }} />
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/" element={
          <PrivateRoute>
            <Catalog />
          </PrivateRoute>
        } />
        
        <Route path="/checkout" element={
          <PrivateRoute>
            <Checkout />
          </PrivateRoute>
        } />
        
        <Route path="/admin" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/admin/products/new" element={
          <PrivateRoute>
             <ProductForm />
          </PrivateRoute>
        } />
        
        <Route path="/admin/products/:id" element={
           <PrivateRoute>
             <ProductForm />
           </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
