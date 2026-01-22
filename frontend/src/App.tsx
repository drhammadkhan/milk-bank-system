import './styles/index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DonorList } from './pages/Donors';
import { NewDonor } from './pages/NewDonor';
import { EditDonor } from './pages/EditDonor';
import { ViewDonor } from './pages/ViewDonor';
import { AddDonation } from './pages/AddDonation';
import { BatchList } from './pages/Batches';
import { NewBatch } from './pages/NewBatch';
import { BatchDetail } from './pages/BatchDetail';
import { DispatchList } from './pages/Dispatch';
import { DispatchDetail } from './pages/DispatchDetail';
import { BottleList } from './pages/Bottles';
import { PrinterSettings } from './pages/PrinterSettings';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/donors" element={<DonorList />} />
          <Route path="/donors/new" element={<NewDonor />} />
          <Route path="/donors/:donorId" element={<ViewDonor />} />
          <Route path="/donors/:donorId/edit" element={<EditDonor />} />
          <Route path="/donors/:donorId/add-donation" element={<AddDonation />} />
          <Route path="/batches" element={<BatchList />} />
          <Route path="/batches/new" element={<NewBatch />} />
          <Route path="/batches/:id" element={<BatchDetail />} />
          <Route path="/bottles" element={<BottleList />} />
          <Route path="/dispatch" element={<DispatchList />} />
          <Route path="/dispatch/:id" element={<DispatchDetail />} />
          <Route path="/settings/printers" element={<PrinterSettings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
