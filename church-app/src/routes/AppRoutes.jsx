import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Members from '../pages/Members';
import Congregations from '../pages/Congregations';
import Finances from '../pages/Finances';
import InstitutionFinances from '../pages/InstitutionFinances';
import Events from '../pages/Events';
import Users from '../pages/Users';
import Inventory from '../pages/Inventory';
import Institutions from '../pages/Institutions';
import Family from '../pages/Family';
import Spiritual from '../pages/Spiritual';
import Pastoral from '../pages/Pastoral';
import Communications from '../pages/Communications';
import Documents from '../pages/Documents';
import Audit from '../pages/Audit';
import Offerings from '../pages/Offerings';
import PrivateRoute from './PrivateRoute';
import Layout from '../components/Layout';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/congregations" element={<Congregations />} />
            <Route path="/finances" element={<Finances />} />
            <Route path="/finanzas/congregacion" element={<InstitutionFinances />} />
            <Route path="/finanzas/institucion/:id" element={<InstitutionFinances />} />
            <Route path="/events" element={<Events />} />
            <Route path="/users" element={<Users />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/institutions" element={<Institutions />} />
            <Route path="/family" element={<Family />} />
            <Route path="/spiritual" element={<Spiritual />} />
            <Route path="/pastoral" element={<Pastoral />} />
            <Route path="/communications" element={<Communications />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/offerings" element={<Offerings />} />
            <Route path="/audit" element={<Audit />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
