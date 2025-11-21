
import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, BarChart2, AlertTriangle, CheckCircle, RefreshCw, Wifi, WifiOff, Info, Bell, X, ShieldAlert, Zap, Settings, Newspaper, ExternalLink, Layers, Target, Crosshair, Lock, Search, Anchor } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine, Label, Area, ComposedChart, Bar, Cell } from 'recharts';
import { TrendDirection, PatternType, IndicatorSignal, AnalysisInput, PredictionResult, CoinOption, TradingMode } from '../types';
import { analyzeMarketLogic } from '../utils/predictionLogic';
import { getMarketAnalysis, getTopCoins, fetchOrderBook } from '../services/cryptoService';
import BotPanel from './BotPanel';
import OnboardingTour from './OnboardingTour';
import { useLanguage } from '../contexts/LanguageContext';

// Dynamic Pattern Explanations based on Language
const getPatternExplanations = (lang: 'en' | 'ha'): Record<string, string> => {
  if (lang === 'ha') {
    return {
      [PatternType.DOJI]: "Doji (Rashin Tabbaci): Yana nuna 'Indecision'. Kasuwa tana jira. A littafin 'Sirrin Crypto', ana kwatanta shi da daidaito akan sikeli.",
      [PatternType.HAMMER]: "Hammer (Guduma): Alama ce mai karfi ta 'Bullish Reversal'. Kamar yadda guduma ke buga kusa, wannan pattern yana buga kasan farashi don ya tashi.",
      [PatternType.SHOOTING_STAR]: "Shooting Star (Tauraruwa mai wutsiya): Alama ce ta 'Bearish Reversal'. Tana nuna cewa farashi ya gama tashi, kamar tauraruwa mai wutsiya da ke fadowa kasa.",
      [PatternType.ENGULFING_BULLISH]: "Bullish Engulfing: Koren candle ya hadiye jan candle na baya. Wannan yana nuna cikakken rinjayen masu saye.",
      [PatternType.ENGULFING_BEARISH]: "Bearish Engulfing: Jan candle ya hadiye koren candle na baya. Alamar masu sayarwa sun kwace kasuwa.",
      [PatternType.MORNING_STAR]: "Morning Star (Agogon Farko): Alamar tashi mai karfi. Hasken safiya yana korar duhu.",
      [PatternType.EVENING_STAR]: "Evening Star (Agogon Karshe): Alamar sauka mai karfi. Dare ya yi, farashi zai yi barci (sauka).",
      [PatternType.HARAMI_BULLISH]: "Bullish Harami (Mace mai ciki): Karamin kore a cikin babban ja. Alama ce cewa karfin masu sayarwa ya kare.",
      [PatternType.HARAMI_BEARISH]: "Bearish Harami (Mace mai ciki): Karamin ja a cikin babban kore. Alama ce cewa karfin masu saye ya kare.",
      [PatternType.HEAD_AND_SHOULDERS]: "Head and Shoulders: Siffar kai da kafadu. Alama ce ta canjin trend daga tashi zuwa sauka.",
      [PatternType.DOUBLE_TOP]: "Double Top: Kololuwa biyu. Farashi ya kasa fasa silin sau biyu, alama ce ta sauka.",
      [PatternType.DOUBLE_BOTTOM]: "Double Bottom: Kasa biyu (W shape). Farashi ya kasa fasa kasa sau biyu, alama ce ta tashi.",
      [PatternType.NONE]: "Babu wata takamaiman siffa (pattern) mai karfi a yanzu."
    };
  } else {
    return {
      [PatternType.DOJI]: "Doji (Indecision): Shows market indecision. Buyers and sellers are balanced.",
      [PatternType.HAMMER]: "Hammer: Strong Bullish Reversal signal. Looks like a hammer nailing the price bottom.",
      [PatternType.SHOOTING_STAR]: "Shooting Star: Strong Bearish Reversal. Indicates price has peaked and may fall.",
      [PatternType.ENGULFING_BULLISH]: "Bullish Engulfing: Green candle completely engulfs previous red candle. Buyers taking over.",
      [PatternType.ENGULFING_BEARISH]: "Bearish Engulfing: Red candle engulfs previous green candle. Sellers taking control.",
      [PatternType.MORNING_STAR]: "Morning Star: Strong bullish signal indicating the start of a new uptrend.",
      [PatternType.EVENING_STAR]: "Evening Star: Strong bearish signal indicating the end of an uptrend.",
      [PatternType.HARAMI_BULLISH]: "Bullish Harami: Small green candle inside large red one. Selling pressure is fading.",
      [PatternType.HARAMI_BEARISH]: "Bearish Harami: Small red candle inside large green one. Buying pressure is fading.",
      [PatternType.HEAD_AND_SHOULDERS]: "Head & Shoulders: Reversal pattern from bullish to bearish.",
      [PatternType.DOUBLE_TOP]: "Double Top: Bearish reversal pattern.",
      [PatternType.DOUBLE_BOTTOM]: "Double Bottom: Bullish reversal pattern.",
      [PatternType.NONE]: "No significant pattern detected."
    };
  }
};

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const [isLive, setIsLive] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [searchQuery, setSearchQuery] = useState('');
  const [tradingMode, setTradingMode] = useState<TradingMode>('SPOT');
  const [coinList, setCoinList] = useState<CoinOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCoinsLoading, setIsCoinsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showTour, setShowTour] = useState(false);
  
  // Visual Settings
  const [showFib, setShowFib] = useState(true);
  const [showMA, setShowMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showIchimoku, setShowIchimoku] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [useSentiment, setUseSentiment] = useState(true);

  // Alert State
  const [rsiAlertLow, setRsiAlertLow] = useState(30);
  const [rsiAlertHigh, setRsiAlertHigh] = useState(70);
  const [alertActive, setAlertActive] = useState<{type: 'high'|'low', val: number} | null>(null);
  const [showPatternInfo, setShowPatternInfo] = useState(false);
  
  // Alert Configuration
  const [priceAlerts, setPriceAlerts] = useState<{target: number, type: 'above'|'below'}[]>([]);
  const [newPriceAlert, setNewPriceAlert] = useState('');
  
  // Order Book State
  const [orderBook, setOrderBook] = useState<{bids: [string, string][], asks: [string, string][]}>({ bids: [], asks: [] });


  const [input, setInput] = useState<AnalysisInput>({
    currentPrice: 0,
    rsi: 50,
    trend: TrendDirection.SIDEWAYS,
    volumeState: 'Low',
    currentVolume: 0,
    averageVolume: 0,
    priceChange24h: 0,
    pattern: PatternType.NONE,
    movingAverageSignal: IndicatorSignal.NEUTRAL,
    historicalData: [],
    fibLevels: undefined,
    news: [],
    ma50: 0,
    ma200: 0,
    atr: 0,
    whaleAlert: { isDetected: false, type: 'NONE', confidence: 'Low', description: '' }
  });

  const [result, setResult] = useState<PredictionResult | null>(null);

  // Check if first time visit
  useEffect(() => {
    const visited = localStorage.getItem('sirrin_crypto_visited');
    if (!visited) {
      setShowTour(true);
    }
  }, []);

  // Fetch Coin List based on Mode
  useEffect(() => {
    const loadCoins = async () => {
      setIsCoinsLoading(true);
      const coins = await getTopCoins(tradingMode);
      setCoinList(coins);
      
      // Reset selection if current symbol is not in new list (simplified check)
      // But allow custom symbols to stay
      const exists = coins.some(c => c.symbol === selectedSymbol);
      if (!exists && !searchQuery) {
          if(coins.length > 0) setSelectedSymbol(coins[0].symbol);
      }
      setIsCoinsLoading(false);
    };
    loadCoins();
  }, [tradingMode]); // Re-run when trading mode changes

  const fetchLiveData = async () => {
    setIsLoading(true);
    const data = await getMarketAnalysis(selectedSymbol, tradingMode);
    const ob = await fetchOrderBook(selectedSymbol, tradingMode);
    setOrderBook(ob);
    
    if (data.currentPrice) {
      const newInput = { ...input, ...data } as AnalysisInput;
      setInput(newInput);
      setLastUpdated(new Date());
      
      // Auto-analyze
      const prediction = analyzeMarketLogic(newInput, useSentiment, tradingMode);
      setResult(prediction);

      // Check RSI Alerts
      if (newInput.rsi >= rsiAlertHigh) {
        setAlertActive({ type: 'high', val: newInput.rsi });
      } else if (newInput.rsi <= rsiAlertLow) {
        setAlertActive({ type: 'low', val: newInput.rsi });
      } else {
        setAlertActive(null);
      }
      
      // Check Price Alerts
      priceAlerts.forEach((alert, idx) => {
         if ((alert.type === 'above' && newInput.currentPrice >= alert.target) || 
             (alert.type === 'below' && newInput.currentPrice <= alert.target)) {
             alert(`Price Alert! ${selectedSymbol} is ${alert.type} ${alert.target}`);
             setPriceAlerts(prev => prev.filter((_, i) => i !== idx));
         }
      });
      
      if (newInput.pattern !== PatternType.NONE) {
        setShowPatternInfo(true);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isLive) {
      fetchLiveData(); 
      interval = setInterval(fetchLiveData, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive, selectedSymbol, rsiAlertHigh, rsiAlertLow, useSentiment, tradingMode]);

  const handleAnalyze = () => {
    const prediction = analyzeMarketLogic(input, useSentiment, tradingMode);
    setResult(prediction);
  };

  const handleTourComplete = () => {
    localStorage.setItem('sirrin_crypto_visited', 'true');
    setShowTour(false);
  };

  const refreshNews = async () => {
     setIsLoading(true);
     const data = await getMarketAnalysis(selectedSymbol, tradingMode);
     if (data.news) {
       setInput(prev => ({ ...prev, news: data.news }));
     }
     setIsLoading(false);
  };
  
  const addPriceAlert = () => {
      const price = parseFloat(newPriceAlert);
      if (!price) return;
      const type = price > input.currentPrice ? 'above' : 'below';
      setPriceAlerts([...priceAlerts, { target: price, type }]);
      setNewPriceAlert('');
  };
  
  const handleSymbolSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
          let symbol = searchQuery.toUpperCase().trim();
          if (!symbol.endsWith('USDT')) symbol += 'USDT';
          setSelectedSymbol(symbol);
          // Optionally add to local list display
          if (!coinList.some(c => c.symbol === symbol)) {
              setCoinList(prev => [{ symbol, name: `${symbol.replace('USDT', '')}/USDT` }, ...prev]);
          }
      }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Onboarding Tour */}
      {showTour && <OnboardingTour onComplete={handleTourComplete} />}

      {/* Alert Banner */}
      {alertActive && isLive && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-2xl border-2 flex items-center gap-4 animate-bounce ${
          alertActive.type === 'high' 
            ? 'bg-red-900/90 border-red-500 text-white' 
            : 'bg-green-900/90 border-green-500 text-white'
        }`}>
          <Bell className="animate-swing" />
          <div>
            <h3 className="font-bold text-lg">RSI ALERT!</h3>
            <p>{alertActive.type === 'high' ? 'Overbought' : 'Oversold'} levels detected: {alertActive.val}</p>
          </div>
          <button onClick={() => setAlertActive(null)} className="ml-4 p-1 hover:bg-white/20 rounded-full"><X size={18} /></button>
        </div>
      )}

      {/* Whale Alert Banner */}
      {result?.whaleAlert?.isDetected && isLive && (
        <div className="mb-6 p-4 rounded-xl bg-blue-900/40 border border-blue-500 flex items-center justify-between animate-pulse shadow-lg shadow-blue-900/20">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-full">
                 <Anchor className="text-white" size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-blue-300 text-lg">{t('whale_alert')}</h3>
                 <p className="text-sm text-gray-300">{result.whaleAlert.description} ({result.whaleAlert.type})</p>
              </div>
           </div>
           <div className="bg-blue-800 px-3 py-1 rounded-lg text-xs font-bold text-blue-200">
              {result.whaleAlert.confidence} Confidence
           </div>
        </div>
      )}

      {/* RSI Divergence Alert Banner */}
      {input.rsiDivergence && isLive && (
         <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between animate-bounce shadow-lg ${
             input.rsiDivergence.type === 'Bullish' ? 'bg-green-900/40 border-green-500' : 'bg-red-900/40 border-red-500'
         }`}>
             <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full ${input.rsiDivergence.type === 'Bullish' ? 'bg-green-600' : 'bg-red-600'}`}>
                    <Zap className="text-white" size={24} />
                 </div>
                 <div>
                     <h3 className={`font-bold text-lg ${input.rsiDivergence.type === 'Bullish' ? 'text-green-300' : 'text-red-300'}`}>
                        RSI DIVERGENCE DETECTED: {input.rsiDivergence.type}
                     </h3>
                     <p className="text-sm text-gray-300">
                        {input.rsiDivergence.type === 'Bullish' 
                          ? "Price making Lower Lows while RSI makes Higher Lows. Hidden Strength!" 
                          : "Price making Higher Highs while RSI makes Lower Highs. Hidden Weakness!"}
                     </p>
                 </div>
             </div>
         </div>
      )}

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-crypto-accent mb-2">{t('title')}</h1>
        <p className="text-gray-400">{t('subtitle')}</p>
      </div>

      {/* Header & Mode Toggle */}
      <div className="flex flex-col xl:flex-row justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700 mb-8 gap-4 shadow-lg">
        <div className="flex items-center gap-3 w-full xl:w-auto justify-center xl:justify-start">
          <div className={`p-2 rounded-full ${isLive ? 'bg-green-500/20' : 'bg-gray-700'}`}>
            {isLive ? <Wifi className="text-green-500" size={20} /> : <WifiOff className="text-gray-400" size={20} />}
          </div>
          <div>
            <h3 className="font-bold text-white">{isLive ? t('live_mode') : t('manual_mode')}</h3>
            <p className="text-xs text-gray-400">
              {isLive ? `${t('analyzing')} ${selectedSymbol} • ${tradingMode}` : t('offline_mode')}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
           {isLive && (
               <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                   <button 
                     onClick={() => setTradingMode('SPOT')} 
                     className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${tradingMode === 'SPOT' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                   >
                       SPOT
                   </button>
                   <button 
                     onClick={() => setTradingMode('FUTURES')} 
                     className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${tradingMode === 'FUTURES' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                   >
                       FUTURES
                   </button>
               </div>
           )}

           {isLive && (
             <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
               <Bell size={14} className="text-gray-400" />
               <input 
                type="number" 
                value={rsiAlertLow} 
                onChange={e => setRsiAlertLow(Number(e.target.value))}
                className="w-10 bg-gray-800 text-white text-xs rounded p-1 border border-gray-600 focus:border-green-500 outline-none text-center"
                title="Oversold Alert (Low)"
               />
               <span className="text-gray-500 text-xs">-</span>
               <input 
                type="number" 
                value={rsiAlertHigh} 
                onChange={e => setRsiAlertHigh(Number(e.target.value))}
                className="w-10 bg-gray-800 text-white text-xs rounded p-1 border border-gray-600 focus:border-red-500 outline-none text-center"
                title="Overbought Alert (High)"
               />
             </div>
           )}

           {isLive && (
            <div className="flex gap-2 w-full sm:w-auto">
               <div className="relative w-32 sm:w-40">
                 <select
                   className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg pl-2 pr-6 py-2 focus:outline-none focus:ring-2 focus:ring-crypto-accent appearance-none text-xs truncate"
                   value={selectedSymbol}
                   onChange={(e) => setSelectedSymbol(e.target.value)}
                   disabled={isCoinsLoading}
                 >
                   {isCoinsLoading ? (
                      <option>Loading...</option>
                   ) : (
                      coinList.map(coin => (
                        <option key={coin.symbol} value={coin.symbol}>{coin.name}</option>
                      ))
                   )}
                 </select>
               </div>
               
               <form onSubmit={handleSymbolSearch} className="relative w-24 sm:w-32">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg pl-2 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                  <button type="submit" className="absolute right-2 top-2 text-gray-400 hover:text-white">
                    <Search size={14} />
                  </button>
               </form>
            </div>
           )}
           
           <button 
             onClick={() => setIsLive(!isLive)}
             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isLive ? 'bg-crypto-accent' : 'bg-gray-600'}`}
             title="Toggle Live Mode"
           >
             <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isLive ? 'translate-x-6' : 'translate-x-1'}`} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: Chart & News */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Advanced Chart Area */}
          {isLive && input.historicalData && input.historicalData.length > 0 && (
            <div className="space-y-4">
              <div className="bg-crypto-card p-4 rounded-xl border border-gray-700 h-[500px] relative group" id="chart">
                 <div className="absolute top-4 right-4 z-10">
                   <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-gray-800/80 rounded-lg hover:bg-gray-700 text-gray-300 border border-gray-600 flex items-center gap-2 text-xs font-bold">
                     <Layers size={14} /> {t('settings')}
                   </button>
                   {showSettings && (
                     <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-600 rounded-lg shadow-xl p-3 text-sm z-20">
                       <h4 className="font-bold text-gray-400 mb-2 border-b border-gray-700 pb-1">Chart Layers</h4>
                       <label className="flex items-center gap-2 mb-2 cursor-pointer p-1 hover:bg-gray-800 rounded">
                         <input type="checkbox" checked={showMA} onChange={() => setShowMA(!showMA)} className="accent-blue-500" />
                         Moving Averages (50/200)
                       </label>
                       <label className="flex items-center gap-2 mb-2 cursor-pointer p-1 hover:bg-gray-800 rounded">
                         <input type="checkbox" checked={showBB} onChange={() => setShowBB(!showBB)} className="accent-blue-500" />
                         Bollinger Bands
                       </label>
                       <label className="flex items-center gap-2 mb-2 cursor-pointer p-1 hover:bg-gray-800 rounded">
                         <input type="checkbox" checked={showIchimoku} onChange={() => setShowIchimoku(!showIchimoku)} className="accent-blue-500" />
                         Ichimoku Cloud
                       </label>
                       <label className="flex items-center gap-2 mb-2 cursor-pointer p-1 hover:bg-gray-800 rounded">
                         <input type="checkbox" checked={showMACD} onChange={() => setShowMACD(!showMACD)} className="accent-blue-500" />
                         MACD (Oscillator)
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-800 rounded">
                         <input type="checkbox" checked={showFib} onChange={() => setShowFib(!showFib)} className="accent-yellow-500" />
                         Fibonacci Levels
                       </label>
                       <h4 className="font-bold text-gray-400 mt-3 mb-2 border-b border-gray-700 pb-1">Price Alerts</h4>
                        <div className="flex gap-1">
                            <input type="number" value={newPriceAlert} onChange={e => setNewPriceAlert(e.target.value)} placeholder="Target Price" className="w-full bg-gray-800 border border-gray-600 rounded p-1 text-xs text-white" />
                            <button onClick={addPriceAlert} className="bg-blue-600 text-white p-1 rounded text-xs">+</button>
                        </div>
                         {priceAlerts.map((a, i) => (
                            <div key={i} className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>{a.type} {a.target}</span>
                                <button onClick={() => setPriceAlerts(p => p.filter((_, idx) => idx !== i))} className="text-red-400">x</button>
                            </div>
                        ))}
                     </div>
                   )}
                 </div>

                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                     <Activity size={16} /> {t('chart_title')}
                  </h3>
                </div>
                
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={input.historicalData} syncId="cryptoChart">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 11}} />
                    <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{fontSize: 11}} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                    
                    {/* Bollinger Bands Area */}
                    {showBB && (
                      <>
                        <Area type="monotone" dataKey="bbUpper" stroke="none" fill="#60a5fa" fillOpacity={0.1} />
                        <Area type="monotone" dataKey="bbLower" stroke="none" fill="#60a5fa" fillOpacity={0.1} />
                        <Line type="monotone" dataKey="bbUpper" stroke="#60a5fa" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="bbLower" stroke="#60a5fa" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                      </>
                    )}

                    {/* Ichimoku Cloud Area */}
                    {showIchimoku && (
                      <>
                         <Area type="monotone" dataKey="senkouA" stroke="none" fill="#10b981" fillOpacity={0.1} />
                         <Area type="monotone" dataKey="senkouB" stroke="none" fill="#ef4444" fillOpacity={0.1} />
                      </>
                    )}
                    
                    {/* Main Price */}
                    <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} dot={false} name="Price" />
                    
                    {/* Moving Averages */}
                    {showMA && <Line type="monotone" dataKey="sma50" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="MA 50" />}
                    {showMA && <Line type="monotone" dataKey="sma200" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="MA 200" />}

                    {/* Fibonacci Retracement Lines */}
                    {showFib && input.fibLevels && (
                      <>
                        <ReferenceLine y={input.fibLevels.zero} stroke="#a855f7" strokeDasharray="3 3" opacity={0.5}>
                          <Label value="High" position="insideRight" fill="#a855f7" fontSize={10} />
                        </ReferenceLine>
                        <ReferenceLine y={input.fibLevels.sixOneEight} stroke="#a855f7" strokeDasharray="3 3" opacity={0.8}>
                           <Label value="0.618" position="insideRight" fill="#a855f7" fontSize={10} />
                        </ReferenceLine>
                         <ReferenceLine y={input.fibLevels.five} stroke="#a855f7" strokeDasharray="3 3" opacity={0.5}>
                           <Label value="0.5" position="insideRight" fill="#a855f7" fontSize={10} />
                        </ReferenceLine>
                        <ReferenceLine y={input.fibLevels.one} stroke="#a855f7" strokeDasharray="3 3" opacity={0.5}>
                           <Label value="Low" position="insideRight" fill="#a855f7" fontSize={10} />
                        </ReferenceLine>
                      </>
                    )}

                    {/* RSI Divergence Line */}
                    {input.rsiDivergence && (
                        <ReferenceLine 
                          segment={[{ x: input.rsiDivergence.timeStart, y: input.rsiDivergence.priceStart }, { x: input.rsiDivergence.timeEnd, y: input.rsiDivergence.priceEnd }]} 
                          stroke={input.rsiDivergence.type === 'Bullish' ? '#10b981' : '#ef4444'}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          ifOverflow="extendDomain"
                        >
                           <Label value={`${input.rsiDivergence.type} Divergence`} position="top" fill={input.rsiDivergence.type === 'Bullish' ? '#10b981' : '#ef4444'} fontSize={12} fontWeight="bold" />
                        </ReferenceLine>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* MACD Chart */}
              {showMACD && (
                <div className="bg-crypto-card p-4 rounded-xl border border-gray-700 h-[200px]">
                  <h3 className="text-xs font-bold text-gray-400 mb-2">MACD Oscillator</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={input.historicalData} syncId="cryptoChart">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="time" hide />
                      <YAxis stroke="#94a3b8" tick={{fontSize: 10}} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                      
                      <Bar dataKey="macdHist" name="Histogram">
                        {input.historicalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={(entry.macdHist || 0) > 0 ? "#10b981" : "#ef4444"} />
                        ))}
                      </Bar>
                      <Line type="monotone" dataKey="macdLine" stroke="#3b82f6" strokeWidth={1} dot={false} name="MACD Line" />
                      <Line type="monotone" dataKey="macdSignal" stroke="#f59e0b" strokeWidth={1} dot={false} name="Signal Line" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Order Book Panel */}
          {isLive && (
            <div className="bg-crypto-card p-4 rounded-xl border border-gray-700">
                <h3 className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2"><Layers size={14}/> Order Book</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <h4 className="text-green-400 font-bold mb-1">Bids (Buy)</h4>
                        {orderBook.bids.slice(0, 5).map((bid, i) => (
                            <div key={i} className="flex justify-between">
                                <span className="text-gray-300">{bid[0]}</span>
                                <span className="text-gray-500">{parseFloat(bid[1]).toFixed(4)}</span>
                            </div>
                        ))}
                    </div>
                    <div>
                        <h4 className="text-red-400 font-bold mb-1">Asks (Sell)</h4>
                        {orderBook.asks.slice(0, 5).map((ask, i) => (
                            <div key={i} className="flex justify-between">
                                <span className="text-gray-300">{ask[0]}</span>
                                <span className="text-gray-500">{parseFloat(ask[1]).toFixed(4)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {/* Market News Feed */}
          {isLive && input.news && input.news.length > 0 && (
            <div className="bg-crypto-card p-6 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
                <div className="flex items-center gap-2">
                   <Newspaper className="text-crypto-accent" size={20} />
                   <h3 className="font-bold text-lg text-gray-200">{t('market_news')}</h3>
                </div>
                <div className="flex items-center gap-3">
                   <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer mr-2">
                      <input type="checkbox" checked={useSentiment} onChange={() => setUseSentiment(!useSentiment)} className="accent-blue-500" />
                      {t('enable_sentiment')}
                   </label>
                  <button onClick={refreshNews} className="p-1 text-gray-400 hover:text-white" title="Refresh News">
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                  </button>
                  {input.sentiment && useSentiment && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                       input.sentiment.label === 'Bullish' ? 'bg-green-900/50 text-green-400' : 
                       input.sentiment.label === 'Bearish' ? 'bg-red-900/50 text-red-400' : 'bg-gray-700 text-gray-300'
                    }`}>
                       {input.sentiment.label} ({input.sentiment.score > 0 ? '+' : ''}{input.sentiment.score.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                 {input.news.slice(0, 3).map((item) => (
                   <div key={item.id} className="flex gap-4 group cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors">
                     <img src={item.imageurl} alt="news" className="w-16 h-16 object-cover rounded-md opacity-80 group-hover:opacity-100" />
                     <div className="flex-1">
                       <a href={item.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-gray-300 group-hover:text-white hover:underline line-clamp-2">
                         {item.title}
                       </a>
                       <div className="flex justify-between mt-2">
                         <span className="text-xs text-crypto-accent">{item.source}</span>
                         <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-gray-500 flex items-center gap-1 hover:text-white">
                            <ExternalLink size={10} /> {t('read_more')}
                         </a>
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COL: Analysis Controls & Results */}
        <div className="space-y-8">
          {/* CONTROL PANEL */}
          <div className="bg-crypto-card p-6 rounded-xl shadow-lg border border-gray-700 relative overflow-hidden" id="indicators">
            {isLive && isLoading && !lastUpdated && (
              <div className="absolute inset-0 bg-gray-900/80 z-10 flex items-center justify-center">
                <RefreshCw className="animate-spin text-crypto-accent" size={32} />
              </div>
            )}

            <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="text-blue-400" />
                <h2 className="text-xl font-semibold">{t('analysis_params')}</h2>
              </div>
              {isLive && input.currentPrice > 0 && (
                <div className="flex flex-col items-end">
                  <div className="text-xl font-mono font-bold text-white animate-pulse">
                    ${input.currentPrice.toLocaleString()}
                  </div>
                  <span className={`text-xs font-bold ${input.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {input.priceChange24h >= 0 ? '+' : ''}{input.priceChange24h.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-5">
              {/* RSI */}
              <div className={isLive ? "opacity-80 pointer-events-none" : ""}>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex justify-between">
                  <span>RSI</span>
                  <span className={`font-bold ${input.rsi > 70 || input.rsi < 30 ? 'text-crypto-accent' : 'text-gray-400'}`}>{input.rsi}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={input.rsi}
                  disabled={isLive}
                  onChange={(e) => setInput({ ...input, rsi: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span className={input.rsi < 30 ? "text-green-400 font-bold" : ""}>Oversold</span>
                  <span>Neutral</span>
                  <span className={input.rsi > 70 ? "text-red-400 font-bold" : ""}>Overbought</span>
                </div>
              </div>

              {/* Patterns */}
              <div className={isLive ? "" : ""}>
                <div className="flex items-center mb-2 justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    {t('pattern')} {isLive && <span className="text-xs text-yellow-500 ml-1">{t('auto')}</span>}
                  </label>
                  <button 
                      onClick={() => setShowPatternInfo(!showPatternInfo)}
                      className={`text-xs flex items-center gap-1 transition-colors ${showPatternInfo ? 'text-crypto-accent' : 'text-blue-400 hover:text-white'}`}
                    >
                      <Info size={14} /> {t('explain')}
                  </button>
                </div>
                
                {(showPatternInfo || (isLive && input.pattern !== PatternType.NONE)) && (
                      <div className="mb-3 bg-gray-800 border border-gray-600 p-3 rounded-lg text-xs text-gray-200 shadow-xl animate-fade-in">
                        <p className="font-semibold text-crypto-accent mb-1">{input.pattern !== PatternType.NONE ? input.pattern : "Detailed Explanations"}:</p>
                        <p>{getPatternExplanations(language)[input.pattern] || "Select a pattern to see its definition from the book 'Sirrin Crypto'."}</p>
                      </div>
                )}
                
                <select
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  value={input.pattern}
                  disabled={isLive}
                  onChange={(e) => setInput({ ...input, pattern: e.target.value as PatternType })}
                >
                  {Object.values(PatternType).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Trend */}
              <div className={isLive ? "opacity-80 pointer-events-none" : ""}>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('trend_structure')}</label>
                <select
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                  value={input.trend}
                  disabled={isLive}
                  onChange={(e) => setInput({ ...input, trend: e.target.value as TrendDirection })}
                >
                  {Object.values(TrendDirection).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Metrics Grid */}
              <div className={`grid grid-cols-2 gap-4 ${isLive ? "opacity-80 pointer-events-none" : ""}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('volume')}</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => !isLive && setInput({ ...input, volumeState: 'High' })}
                      className={`flex-1 py-2 rounded-lg text-xs transition-colors ${input.volumeState === 'High' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                    >
                      High
                    </button>
                    <button
                      onClick={() => !isLive && setInput({ ...input, volumeState: 'Low' })}
                      className={`flex-1 py-2 rounded-lg text-xs transition-colors ${input.volumeState === 'Low' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                    >
                      Low
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('crossovers')}</label>
                  {isLive && input.movingAverageSignal !== IndicatorSignal.NEUTRAL ? (
                    <div className={`p-2 rounded-lg border text-xs font-bold text-center animate-pulse ${
                      input.movingAverageSignal === IndicatorSignal.GOLDEN_CROSS 
                        ? 'bg-green-900/50 border-green-500 text-green-400'
                        : input.movingAverageSignal === IndicatorSignal.DEATH_CROSS
                        ? 'bg-red-900/50 border-red-500 text-red-400'
                        : 'bg-gray-800 border-gray-600'
                    }`}>
                      {input.movingAverageSignal}
                    </div>
                  ) : (
                    <select
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-xs text-white disabled:opacity-50"
                      value={input.movingAverageSignal}
                      disabled={isLive}
                      onChange={(e) => setInput({ ...input, movingAverageSignal: e.target.value as IndicatorSignal })}
                    >
                      {Object.values(IndicatorSignal).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {!isLive && (
                <button
                  onClick={handleAnalyze}
                  className="w-full mt-4 bg-crypto-accent hover:bg-green-600 text-white font-bold py-3 rounded-lg shadow-lg transform transition hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <BarChart2 size={20} />
                  {t('analyze_btn')}
                </button>
              )}
            </div>
          </div>

          {/* BOT PANEL */}
          {isLive && (
             <div id="bot">
               <BotPanel currentPrice={input.currentPrice} symbol={selectedSymbol} />
             </div>
          )}

          {/* RESULT DISPLAY */}
          {result && (
            <div className="bg-crypto-card p-6 rounded-xl shadow-lg border border-gray-700 h-auto animate-fade-in flex flex-col">
              
              {/* Warnings & Manipulation */}
              {result.marketBehavior.abnormality !== 'None' && (
                 <div className="mb-4 p-3 bg-red-900/40 border border-red-600 rounded-xl flex items-center gap-3 animate-pulse">
                    <ShieldAlert className="text-red-500 shrink-0" size={20} />
                    <div>
                      <h3 className="font-bold text-red-400 uppercase text-xs">MARKET ABNORMALITY: {result.marketBehavior.abnormality}</h3>
                      <p className="text-xs text-gray-300">Extreme Volatility Detected. Trade with caution.</p>
                    </div>
                 </div>
              )}

              <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
                <h2 className="text-lg font-semibold text-white">{t('signal_verdict')}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  result.signalStrength === 'Strong' ? 'bg-purple-500/20 text-purple-300 border border-purple-500' : 
                  result.signalStrength === 'Moderate' ? 'bg-blue-500/20 text-blue-300 border border-blue-500' :
                  'bg-gray-600/20 text-gray-400'
                }`}>
                  {result.confidence}% Conf.
                </span>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                   <div className={`text-4xl font-black ${
                      result.action === 'BUY' || result.action === 'LONG' ? 'text-crypto-accent' :
                      result.action === 'SELL' || result.action === 'SHORT' ? 'text-crypto-danger' :
                      'text-yellow-400'
                   }`}>
                     {result.action}
                   </div>
                   {result.marketCondition && (
                     <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border-4 ${
                       result.marketCondition === 'Bullish' ? 'border-green-500 bg-green-900/20' :
                       result.marketCondition === 'Bearish' ? 'border-red-500 bg-red-900/20' :
                       'border-gray-500 bg-gray-800'
                     }`} title={`Market Structure: ${result.marketCondition}`}>
                        {result.marketCondition === 'Bullish' ? <TrendingUp size={20} className="text-green-500" /> :
                         result.marketCondition === 'Bearish' ? <TrendingDown size={20} className="text-red-500" /> :
                         <Activity size={20} className="text-gray-400" />}
                     </div>
                   )}
                </div>
                <p className="text-sm text-gray-300 font-medium italic border-l-2 border-crypto-primary pl-3 text-left">"{result.hausSummary}"</p>
              </div>
              
              {/* Execution Setup Box */}
              {result.tradeSetup && (
                 <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-4">
                    <h3 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2"><Target size={14}/> Execution Plan</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                       <div className="flex justify-between">
                          <span className="text-gray-400">Entry:</span>
                          <span className="text-white font-mono">{result.tradeSetup.entryZone}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-400">SL:</span>
                          <span className="text-red-400 font-mono font-bold">{result.tradeSetup.stopLoss}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-400">TP 1:</span>
                          <span className="text-green-400 font-mono font-bold">{result.tradeSetup.takeProfit1}</span>
                       </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">TP 2:</span>
                          <span className="text-green-400 font-mono font-bold">{result.tradeSetup.takeProfit2}</span>
                       </div>
                       {result.tradeSetup.leverage && (
                           <div className="flex justify-between col-span-2 border-t border-blue-900/50 pt-1 mt-1">
                              <span className="text-gray-400">Leverage:</span>
                              <span className="text-yellow-400 font-bold">{result.tradeSetup.leverage}x</span>
                           </div>
                       )}
                    </div>
                 </div>
              )}

              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex-grow">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                   <Zap size={12} className="text-yellow-500" /> {t('tech_factors')}:
                </h3>
                <ul className="space-y-2">
                  {result.reasoning.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                      <CheckCircle size={14} className="text-blue-400 mt-0.5 shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
