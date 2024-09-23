import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Chart from './Chart';

function Hello() {
  return (
    <div>
      HI
      <Chart />
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
