import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Shell from './components/Shell';
import Overview from './pages/Overview';
import Routing from './pages/Routing';
import Models from './pages/Models';
import Resources from './pages/Resources';
import Connectors from './pages/Connectors';
import Security from './pages/Security';
import Keys from './pages/Keys';
import { TraceDetail, Traces } from './pages/Traces';
import Audit from './pages/Audit';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/routing" element={<Routing />} />
          <Route path="/models" element={<Models />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/connectors" element={<Connectors />} />
          <Route path="/security" element={<Security />} />
          <Route path="/keys" element={<Keys />} />
          <Route path="/traces" element={<Traces />} />
          <Route path="/traces/:id" element={<TraceDetail />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
