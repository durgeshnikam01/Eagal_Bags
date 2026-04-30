import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from '../layouts/ProtectedLayout';
import Login from '../pages/Login';
import SalesInquiry from '../pages/SalesInquiry';
import OrderManagement from '../pages/OrderManagement';
import ProductionPlanning from '../pages/ProductionPlanning';
import InventoryManagement from '../pages/InventoryManagement';
import PurchaseManagement from '../pages/PurchaseManagement';
import ProductionTracking from '../pages/ProductionTracking';
import QualityControl from '../pages/QualityControl';
import DispatchLogistics from '../pages/DispatchLogistics';
import AccountsBilling from '../pages/AccountsBilling';
import ExecutiveReports from '../pages/ExecutiveReports';
import Customers from '../pages/Customers';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/sales-inquiry" replace />} />
          <Route path="/sales-inquiry" element={<SalesInquiry />} />
          <Route path="/order-management" element={<OrderManagement />} />
          <Route path="/production-planning" element={<ProductionPlanning />} />
          <Route path="/inventory-management" element={<InventoryManagement />} />
          <Route path="/purchase-management" element={<PurchaseManagement />} />
          <Route path="/production-tracking" element={<ProductionTracking />} />
          <Route path="/quality-control" element={<QualityControl />} />
          <Route path="/dispatch-logistics" element={<DispatchLogistics />} />
          <Route path="/accounts-billing" element={<AccountsBilling />} />
          <Route path="/executive-reports" element={<ExecutiveReports />} />
          <Route path="/customers" element={<Customers />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/sales-inquiry" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
