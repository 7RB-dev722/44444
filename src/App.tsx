import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import { ProductsGrid } from './components/ProductsGrid';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import { AnimatedBackground } from './components/AnimatedBackground';
import WinningPhotosPage from './components/WinningPhotosPage';
import { SettingsProvider } from './contexts/SettingsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ImagePaymentPage from './components/ImagePaymentPage';
import LinkPaymentPage from './components/LinkPaymentPage';
import CompatibilityCheckPage from './components/CompatibilityCheckPage';
import PrePurchaseInfoPage from './components/PrePurchaseInfoPage';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <Header />
        <Hero />
        <ProductsGrid />
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/winning-photos" element={<WinningPhotosPage />} />
            <Route path="/pay/:productId" element={<ImagePaymentPage />} />
            <Route path="/link-pay/:productId" element={<LinkPaymentPage />} />
            <Route path="/check-compatibility/:productId" element={<CompatibilityCheckPage />} />
            <Route path="/pre-purchase/:productId" element={<PrePurchaseInfoPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </SettingsProvider>
  );
}

export default App;
