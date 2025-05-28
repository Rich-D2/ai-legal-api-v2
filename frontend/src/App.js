import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CustomerDashboard from './components/CustomerDashboard';
import ParalegalDashboard from './components/ParalegalDashboard';
import LawyerDashboard from './components/LawyerDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import { Typography } from '@mui/material';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route index element={<CustomerDashboard />} />
          <Route path="customer" element={<CustomerDashboard />} />
          <Route path="paralegal" element={<ParalegalDashboard />} />
          <Route path="lawyer" element={<LawyerDashboard />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="*" element={<Typography variant="h6">404 - Page Not Found</Typography>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
