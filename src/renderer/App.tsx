import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Chart from './Chart';
import NewChart from './OverlayChart'

function Hello() {
  return (
    <div>
      <NewChart />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
        {/* <Route path="/chart" element={<Chart />}></Route> */}
      </Routes>
    </Router>
  );
}
