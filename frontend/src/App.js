import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerDashboard from './components/CustomerDashboard';
import ParalegalDashboard from './components/ParalegalDashboard';
import LawyerDashboard from './components/LawyerDashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerDashboard />} />
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/paralegal" element={<ParalegalDashboard />} />
        <Route path="/lawyer" element={<LawyerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
