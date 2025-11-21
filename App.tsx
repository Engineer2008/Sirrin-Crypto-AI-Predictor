
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import AIChat from './components/AIChat';
import KnowledgeBase from './components/KnowledgeBase';
import { LayoutDashboard, MessageSquare, BookOpen, Menu, X, Globe } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'learn'>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ha' : 'en');
  };

  return (
    <div className="min-h-screen bg-crypto-dark text-gray-100 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-400 rounded-lg flex items-center justify-center font-bold text-white">S</div>
              <span className="text-xl font-bold tracking-tight">Sirrin<span className="text-crypto-accent">Crypto</span></span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 items-center">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'text-crypto-accent' : 'text-gray-400 hover:text-white'}`}
              >
                <LayoutDashboard size={18} /> {t('dashboard')}
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'chat' ? 'text-crypto-accent' : 'text-gray-400 hover:text-white'}`}
              >
                <MessageSquare size={18} /> {t('ai_assistant')}
              </button>
              <button 
                onClick={() => setActiveTab('learn')}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'learn' ? 'text-crypto-accent' : 'text-gray-400 hover:text-white'}`}
              >
                <BookOpen size={18} /> {t('learn')}
              </button>
              
              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-600 text-xs font-bold transition-colors"
              >
                <Globe size={14} />
                {language === 'en' ? 'EN' : 'HA'}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <button 
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-600 text-xs font-bold transition-colors"
                >
                  <Globe size={14} />
                  {language === 'en' ? 'EN' : 'HA'}
              </button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-300 hover:text-white p-2">
                {menuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-gray-800 border-b border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => {setActiveTab('dashboard'); setMenuOpen(false)}} className="block px-3 py-2 text-base font-medium text-white w-full text-left">{t('dashboard')}</button>
              <button onClick={() => {setActiveTab('chat'); setMenuOpen(false)}} className="block px-3 py-2 text-base font-medium text-gray-300 w-full text-left">{t('ai_assistant')}</button>
              <button onClick={() => {setActiveTab('learn'); setMenuOpen(false)}} className="block px-3 py-2 text-base font-medium text-gray-300 w-full text-left">{t('learn')}</button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="p-4">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'chat' && <AIChat />}
        {activeTab === 'learn' && <KnowledgeBase />}
      </main>

      <footer className="border-t border-gray-800 mt-12 py-8 text-center text-gray-500 text-sm">
        <p>© 2024 Sirrin Crypto AI. Based on the book by Nasir I. Mahuta.</p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
