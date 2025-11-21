
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const OnboardingTour: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = language === 'ha' ? [
    {
        target: 'center',
        title: "Barka da zuwa Sirrin Crypto AI",
        content: "Wannan manhaja tana amfani da Fasahar Zamani (AI) wajen binciken kasuwar crypto bisa koyarwar littafin 'Sirrin Crypto'."
    },
    {
        target: 'chart',
        title: "Taswirar Kasuwa",
        content: "Anan zaka ga yadda farashi ke tafiya. Mun kara muku kayan aiki kamar Ichimoku da Bollinger Bands."
    },
    {
        target: 'indicators',
        title: "Bincike & Alamomi",
        content: "Zaka iya zabar alamomin da kake so (RSI, MACD). AI tana hada duka wadannan don baka shawara."
    },
    {
        target: 'bot',
        title: "Bot na Trading (Gwaji)",
        content: "Sabuwar Dama: Zaka iya gwada saita Bot don ya saya ko ya sayar maka a farashin da kake so."
    },
    {
        target: 'chat',
        title: "AI Mataimaki",
        content: "Kana da tambaya? Tambayi AI Mataimaki. Yana jin Hausa da Turanci!"
    }
  ] : [
    {
        target: 'center',
        title: "Welcome to Sirrin Crypto AI",
        content: "This application uses Advanced Intelligence to analyze the crypto market based on the principles of the 'Sirrin Crypto' book."
    },
    {
        target: 'chart',
        title: "Technical Dashboard",
        content: "Here you can see the price action. We've added advanced tools like Ichimoku Cloud and Bollinger Bands."
    },
    {
        target: 'indicators',
        title: "Indicators & Analysis",
        content: "Toggle different indicators (RSI, MACD) to customize your view. The AI combines all these signals to give you a Buy/Sell verdict."
    },
    {
        target: 'bot',
        title: "Automated Trading Bot",
        content: "New Feature: You can now set up a simulated Trading Bot to execute trades automatically based on your rules."
    },
    {
        target: 'chat',
        title: "AI Assistant",
        content: "Have questions? Ask the AI Assistant. It speaks both English and Hausa!"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-600 p-6 rounded-2xl max-w-md w-full shadow-2xl relative animate-fade-in">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>
        
        <div className="mb-6">
          <div className="flex gap-1 mb-4">
             {steps.map((_, idx) => (
               <div key={idx} className={`h-1 flex-1 rounded-full ${idx <= currentStep ? 'bg-crypto-accent' : 'bg-gray-700'}`} />
             ))}
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{steps[currentStep].title}</h2>
          <p className="text-gray-300 text-sm leading-relaxed">{steps[currentStep].content}</p>
        </div>

        <div className="flex justify-between items-center">
           <span className="text-xs text-gray-500">{currentStep + 1} of {steps.length}</span>
           <button 
             onClick={handleNext}
             className="bg-crypto-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-colors"
           >
             {currentStep === steps.length - 1 ? (language === 'ha' ? 'Fara' : 'Get Started') : (language === 'ha' ? 'Gaba' : 'Next')} 
             {currentStep === steps.length - 1 ? <Check size={16} /> : <ChevronRight size={16} />}
           </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
