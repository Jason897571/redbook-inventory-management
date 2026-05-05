import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Series from './pages/Series';
import SeriesEdit from './pages/SeriesEdit';
import Products from './pages/Products';
import ProductEdit from './pages/ProductEdit';
import SemiProducts from './pages/SemiProducts';
import SemiProductEdit from './pages/SemiProductEdit';
import Sales from './pages/Sales';
import StockLogs from './pages/StockLogs';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/series" element={<Series />} />
        <Route path="/series/new" element={<SeriesEdit />} />
        <Route path="/series/:id/edit" element={<SeriesEdit />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/new" element={<ProductEdit />} />
        <Route path="/products/:id/edit" element={<ProductEdit />} />
        <Route path="/semi-products" element={<SemiProducts />} />
        <Route path="/semi-products/new" element={<SemiProductEdit />} />
        <Route path="/semi-products/:id/edit" element={<SemiProductEdit />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/stock-logs" element={<StockLogs />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
