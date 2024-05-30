import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchPage from './SearchPage';
import ReviewSummary from './ReviewSummary';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/reviews/:asin" element={<ReviewSummary />} />
      </Routes>
    </Router>
  );
}

export default App;