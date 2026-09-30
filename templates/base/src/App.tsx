import { useEffect, useState } from 'react';
import { useOrgConfig } from '@staycore/booking-sdk/react';
import { Navbar } from './components/common/Navbar.tsx';
import { Footer } from './components/common/Footer.tsx';
import { CookieConsent } from './components/common/CookieConsent.tsx';
import { TestModeBanner } from './components/common/TestModeBanner.tsx';
import { ChatBubble } from './components/common/ChatBubble.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { PropertiesPage } from './pages/PropertiesPage.tsx';
import { PropertyDetailPage } from './pages/PropertyDetailPage.tsx';
import { BookingPage } from './pages/BookingPage.tsx';
import { ReservationPage } from './pages/ReservationPage.tsx';
import { LegalPage } from './pages/LegalPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { GiftCardPage } from './pages/GiftCardPage.tsx';
import { GiftCardConfirmationPage } from './pages/GiftCardConfirmationPage.tsx';
import { findPropertyBySlug } from './data/properties.ts';
import { trackPageView } from './utils/analytics.ts';

function App() {
  const [currentPath, setCurrentPath] = useState('/');
  const [search, setSearch] = useState('');

  // Chat, contact form and gift cards are switched on by the host in Stay'Core
  // (Moteur de résa › Site web): the site shows them only when they are.
  const orgConfig = useOrgConfig();
  const modules = orgConfig.data?.modules;

  useEffect(() => {
    const sync = () => {
      setCurrentPath(window.location.pathname || '/');
      setSearch(window.location.search);
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.split('?')[0] ?? '/');
    setSearch(window.location.search);
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
      // Keyed on the query: a booking link sent by the chat reloads the form with its dates.
      return <BookingPage key={search} onNavigate={navigate} />;
    }
    if ((currentPath === '/contact' || currentPath === '/carte-cadeau') && !orgConfig.data && !orgConfig.error) {
      // Landing straight on a module page: wait for the config instead of flashing the home page.
      return <p className="text-center text-gray-600 py-24">Chargement…</p>;
    }
    if (currentPath === '/contact' && modules?.contact.enabled) return <ContactPage />;
    if (currentPath.startsWith('/carte-cadeau/confirmation/')) {
      const token = currentPath.split('/')[3];
      return <GiftCardConfirmationPage token={token ?? ''} onNavigate={navigate} />;
    }
    if (currentPath === '/carte-cadeau' && modules?.gift_cards.enabled) {
      return <GiftCardPage settings={modules.gift_cards} onNavigate={navigate} />;
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

  const extraLinks = [
    ...(modules?.gift_cards.enabled ? [{ path: '/carte-cadeau', label: 'Carte cadeau' }] : []),
    ...(modules?.contact.enabled ? [{ path: '/contact', label: 'Contact' }] : []),
  ];
  // On a property page, the chat is answered by that property's assistant.
  const viewedProperty = currentPath.startsWith('/properties/')
    ? findPropertyBySlug(currentPath.split('/')[2] ?? '')
    : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <TestModeBanner />
      <Navbar onNavigate={navigate} currentPath={currentPath} extraLinks={extraLinks} />
      <main className="flex-1">{renderPage()}</main>
      <Footer onNavigate={navigate} extraLinks={extraLinks} />
      <CookieConsent />
      {modules?.chat.enabled && (
        <ChatBubble
          welcome={modules.chat.welcome_message_fr}
          propertyId={viewedProperty?.pmsPropertyId}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}

export default App;
