import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { StockPage } from './pages/StockPage';
import { PricesPage } from './pages/PricesPage';
import { OrdersPage } from './pages/OrdersPage';
import { NewOrderPage } from './pages/NewOrderPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ContactsPage } from './pages/ContactsPage';
import { StockIntakePage } from './pages/StockIntakePage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/precios" element={<PricesPage />} />
        <Route path="/pedidos" element={<OrdersPage />} />
        <Route path="/pedidos/nuevo" element={<NewOrderPage />} />
        <Route path="/pedidos/:id" element={<OrderDetailPage />} />
        <Route path="/contactos" element={<ContactsPage />} />
        <Route path="/recepcion" element={<StockIntakePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
