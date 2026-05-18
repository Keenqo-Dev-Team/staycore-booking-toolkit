import { useEffect, useState } from 'react';
import { Navbar } from './components/common/Navbar.tsx';
import { Footer } from './components/common/Footer.tsx';
import { CookieConsent } from './components/common/CookieConsent.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { PropertiesPage } from './pages/PropertiesPage.tsx';
import { PropertyDetailPage } from './pages/PropertyDetailPage.tsx';
import { BookingPage } from './pages/BookingPage.tsx';
import { ReservationPage } from './pages/ReservationPage.tsx';
import { LegalPage } from './pages/LegalPage.tsx';
import { trackPageView } from './utils/analytics.ts';

function App() {
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    setCurrentPath(window.location.pathname || '/');
    const onPop = () => setCurrentPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.split('?')[0] ?? '/');
    window.scrollTo(0, 0);
    trackPageView(path);
  };

  const renderPage = () => {
    if (currentPath === '/' || currentPath === '') return <HomePage onNavigate={navigate} />;
    if (currentPath === '/properties') return <PropertiesPage onNavigate={navigate} />;
    if (currentPath.startsWith('/properties/')) {
      const slug = currentPath.split('/')[2];
      return <PropertyDetailPage propertySlug={slug ?? ''} onNavigate={navigate} />;
    }
    if (currentPath === '/reserver' || currentPath.startsWith('/booking')) {
      return <BookingPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/reservation/')) {
      const token = currentPath.split('/')[2];
      return <ReservationPage token={token ?? ''} />;
    }
    if (currentPath === '/mentions-legales') return <LegalPage kind="legal" />;
    if (currentPath === '/cgv') return <LegalPage kind="cgv" />;
    if (currentPath === '/privacy') return <LegalPage kind="privacy" />;
    return <HomePage onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onNavigate={navigate} currentPath={currentPath} />
      <main className="flex-1">{renderPage()}</main>
      <Footer onNavigate={navigate} />
      <CookieConsent />
    </div>
  );
}

export default App;
