import React from 'react';
import { BookOpen, TrendingUp, Shield, Activity, Fingerprint } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const KnowledgeBase: React.FC = () => {
  const { t, language } = useLanguage();

  const content = {
    en: [
      {
        title: "Fundamental Analysis",
        icon: <BookOpen className="text-yellow-400" />,
        content: "Gano tushen coin (Foundation). Yi duba zuwa ga On-chain metrics (Transactions), Project metrics (White paper, Team), da Financial metrics (Market Cap)."
      },
      {
        title: "Trading Psychology",
        icon: <Activity className="text-purple-400" />,
        content: "Control your emotions (Greed & Fear). Guji 'Gambler's Fallacy' da 'FOMO'. Kada ka sayi coin don wani ya saya (Bandwagon Bias)."
      },
      {
        title: "Technical Analysis",
        icon: <TrendingUp className="text-blue-400" />,
        content: "Fahimtar tafiyar farashi ta hanyar Chart. Amfani da Candlesticks (Doji, Hammer) da Indicators (RSI, MACD) don gane Trend."
      },
      {
        title: "Risk Management",
        icon: <Shield className="text-green-400" />,
        content: "Saita 'Stop Loss' (Daily Loss). Yi amfani da 'Diversification' (Rarraba kafa). Kada ka sa duk kudinka a coin daya."
      },
      {
        title: "Humanity Protocol",
        icon: <Fingerprint className="text-pink-400" />,
        content: "A sybil-resistant blockchain network utilizing Proof of Humanity. It ensures one-person-one-vote and fair distribution of assets through bio-authentication."
      }
    ],
    ha: [
      {
        title: "Binciken Tushe (Fundamental)",
        icon: <BookOpen className="text-yellow-400" />,
        content: "Gano tushen coin (Foundation). Duba On-chain metrics (Hada-hada), Project metrics (White paper, Team), da Financial metrics (Market Cap)."
      },
      {
        title: "Halayyar Trading (Psychology)",
        icon: <Activity className="text-purple-400" />,
        content: "Sarrafa motsin zuciya (Hadama & Tsoro). Guji 'Gambler's Fallacy' da 'FOMO'. Kada ka sayi coin don wani ya saya."
      },
      {
        title: "Binciken Fasaha (Technical)",
        icon: <TrendingUp className="text-blue-400" />,
        content: "Fahimtar tafiyar farashi ta Chart. Amfani da Candlesticks (Doji, Hammer) da Indicators (RSI, MACD) don gane Trend."
      },
      {
        title: "Kula da Hadari (Risk Mgmt)",
        icon: <Shield className="text-green-400" />,
        content: "Saita 'Stop Loss'. Yi amfani da 'Diversification' (Rarraba kafa). Kada ka sa duk kudinka a coin daya."
      },
      {
        title: "Humanity Protocol",
        icon: <Fingerprint className="text-pink-400" />,
        content: "Tsarin blockchain da ke tabbatar da cewa kowane mutum daya ne. Yana amfani da 'Proof of Humanity' don hana magudi a raba arziki."
      }
    ]
  };

  const topics = content[language];

  return (
    <div className="max-w-7xl mx-auto p-6 mt-12 mb-12">
       <div className="flex items-center gap-3 mb-8">
         <BookOpen className="text-crypto-accent" size={32} />
         <h2 className="text-2xl font-bold text-white">{t('knowledge_base')}</h2>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {topics.map((topic, idx) => (
           <div key={idx} className="bg-gray-800/50 border border-gray-700 hover:border-crypto-accent transition-colors p-6 rounded-xl">
             <div className="mb-4">{topic.icon}</div>
             <h3 className="text-lg font-bold text-white mb-2">{topic.title}</h3>
             <p className="text-sm text-gray-400 leading-relaxed">{topic.content}</p>
           </div>
         ))}
       </div>

       <div className="mt-8 p-6 bg-blue-900/10 border border-blue-800 rounded-xl">
         <h3 className="text-blue-400 font-bold mb-2">Important Note on Wallets:</h3>
         <p className="text-gray-300 text-sm">
           Kamar yadda littafin ya bayyana: <strong>"Not your keys, not your coins."</strong> 
           Yi amfani da Cold Wallets (Hardware/Paper) don ajiye coin na dogon lokaci (HODLing). 
           Yi amfani da Hot Wallets (TrustWallet, MetaMask) don trading na yau da kullum.
         </p>
       </div>
    </div>
  );
};

export default KnowledgeBase;
