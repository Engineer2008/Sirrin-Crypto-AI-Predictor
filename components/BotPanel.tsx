
import React, { useState, useEffect } from 'react';
import { Bot, Play, Square, TrendingUp, DollarSign, AlertTriangle, History, Sliders } from 'lucide-react';
import { BotConfig, BotTrade } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface BotPanelProps {
  currentPrice: number;
  symbol: string;
}

const BotPanel: React.FC<BotPanelProps> = ({ currentPrice, symbol }) => {
  const { t } = useLanguage();
  const [config, setConfig] = useState<BotConfig>({
    active: false,
    entryPrice: 0,
    amount: 1000, // Simulated USDT
    takeProfit: 0,
    stopLoss: 0,
    strategy: 'Conservative',
    trades: [],
    leverage: 1,
    slPercent: 2,
    tpPercent: 4
  });

  const [simulatedBalance, setSimulatedBalance] = useState(10000); // Starting Paper Money
  const [showHistory, setShowHistory] = useState(false);

  // Apply Strategy Presets
  const applyStrategy = (strat: 'Conservative' | 'Aggressive') => {
    const sl = strat === 'Conservative' ? 2 : 5;
    const tp = strat === 'Conservative' ? 4 : 15;
    const lev = strat === 'Conservative' ? 1 : 5;

    setConfig(prev => ({
      ...prev,
      strategy: strat,
      slPercent: sl,
      tpPercent: tp,
      leverage: lev
    }));
  };

  // Update Prices based on Percentages (when bot is inactive)
  useEffect(() => {
    if (!config.active && currentPrice > 0) {
      const slPrice = currentPrice * (1 - (config.slPercent / 100));
      const tpPrice = currentPrice * (1 + (config.tpPercent / 100));
      
      setConfig(prev => ({
        ...prev,
        stopLoss: parseFloat(slPrice.toFixed(2)),
        takeProfit: parseFloat(tpPrice.toFixed(2))
      }));
    }
  }, [currentPrice, config.slPercent, config.tpPercent, config.active]);

  // Bot Execution Logic
  useEffect(() => {
    if (!config.active || config.entryPrice === 0) return;

    let triggered = false;
    let reason = '';
    let rawProfit = 0;

    // Check Take Profit
    if (currentPrice >= config.takeProfit) {
      triggered = true;
      reason = 'Take Profit Hit';
      // Calculate profit considering leverage
      const percentChange = (config.takeProfit - config.entryPrice) / config.entryPrice;
      rawProfit = config.amount * percentChange * config.leverage;
    }
    // Check Stop Loss
    else if (currentPrice <= config.stopLoss) {
      triggered = true;
      reason = 'Stop Loss Hit';
      const percentChange = (config.stopLoss - config.entryPrice) / config.entryPrice;
      rawProfit = config.amount * percentChange * config.leverage;
    }

    if (triggered) {
      const newTrade: BotTrade = {
        id: Date.now(),
        type: rawProfit > 0 ? 'SELL' : 'SELL', // Simplified direction
        price: currentPrice,
        timestamp: new Date(),
        profit: rawProfit,
        reason,
        leverage: config.leverage
      };

      setSimulatedBalance(prev => prev + config.amount + rawProfit);
      setConfig(prev => ({
        ...prev,
        active: false,
        trades: [newTrade, ...prev.trades]
      }));
      
      // Browser Notification
      if ('Notification' in window && Notification.permission === 'granted') {
         new Notification(`Sirrin Bot Alert: ${symbol}`, { body: `${reason}: $${rawProfit.toFixed(2)} PNL` });
      }
    }
  }, [currentPrice, config.active, config.takeProfit, config.stopLoss, config.amount, config.leverage, config.entryPrice, symbol]);

  const handleStart = () => {
    if (currentPrice <= 0) return;
    
    setConfig(prev => ({
      ...prev,
      active: true,
      entryPrice: currentPrice
    }));

    setSimulatedBalance(prev => prev - config.amount);

    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const handleStop = () => {
     setConfig(prev => ({ ...prev, active: false }));
     setSimulatedBalance(prev => prev + config.amount); // Refund amount
  };

  const handlePercentChange = (type: 'sl' | 'tp', value: string) => {
      const val = parseFloat(value);
      if (isNaN(val)) return;
      
      setConfig(prev => ({
          ...prev,
          strategy: 'Custom',
          [type === 'sl' ? 'slPercent' : 'tpPercent']: val
      }));
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
        <div className="flex items-center gap-2 text-crypto-accent">
           <Bot size={20} />
           <h3 className="font-bold">{t('auto_bot')}</h3>
        </div>
        <div className="text-xs font-mono text-gray-400">
           {t('balance')}: <span className={`font-bold ${simulatedBalance < 10000 ? 'text-red-400' : 'text-green-400'}`}>${simulatedBalance.toFixed(2)}</span>
        </div>
      </div>

      {!config.active ? (
        <div className="space-y-4">
           <div>
             <label className="text-xs text-gray-400 block mb-1">{t('strategy')}</label>
             <div className="flex gap-2">
               <button 
                 onClick={() => applyStrategy('Conservative')}
                 className={`flex-1 py-2 text-xs rounded border transition-colors ${config.strategy === 'Conservative' ? 'bg-blue-900/40 border-blue-500 text-blue-300' : 'border-gray-600 text-gray-400 hover:bg-gray-700'}`}
               >
                 {t('conservative')}
               </button>
               <button 
                 onClick={() => applyStrategy('Aggressive')}
                 className={`flex-1 py-2 text-xs rounded border transition-colors ${config.strategy === 'Aggressive' ? 'bg-purple-900/40 border-purple-500 text-purple-300' : 'border-gray-600 text-gray-400 hover:bg-gray-700'}`}
               >
                 {t('aggressive')}
               </button>
             </div>
           </div>

           <div className="p-3 bg-gray-900 rounded-lg border border-gray-700 space-y-3">
               <div className="flex items-center justify-between">
                   <label className="text-xs text-gray-300 flex items-center gap-1"><Sliders size={10} /> {t('leverage')}</label>
                   <span className="text-xs font-bold text-yellow-400">{config.leverage}x</span>
               </div>
               <input 
                 type="range" 
                 min="1" 
                 max="20" 
                 step="1"
                 value={config.leverage} 
                 onChange={(e) => setConfig({...config, leverage: parseInt(e.target.value), strategy: 'Custom'})}
                 className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
               />
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-green-400 block mb-1">{t('take_profit')} %</label>
                <div className="relative">
                    <input 
                      type="number"
                      value={config.tpPercent}
                      onChange={e => handlePercentChange('tp', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-white focus:border-green-500 outline-none pr-6"
                    />
                    <span className="absolute right-2 top-2 text-xs text-gray-500">%</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1 text-right font-mono">
                    ~${config.takeProfit}
                </div>
              </div>
              <div>
                <label className="text-xs text-red-400 block mb-1">{t('stop_loss')} %</label>
                <div className="relative">
                    <input 
                      type="number"
                      value={config.slPercent}
                      onChange={e => handlePercentChange('sl', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-white focus:border-red-500 outline-none pr-6"
                    />
                    <span className="absolute right-2 top-2 text-xs text-gray-500">%</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1 text-right font-mono">
                    ~${config.stopLoss}
                </div>
              </div>
           </div>

           <div>
             <label className="text-xs text-gray-400 block mb-1">{t('trade_amount')} (USDT)</label>
             <input 
               type="number" 
               value={config.amount} 
               onChange={e => setConfig({...config, amount: parseFloat(e.target.value)})}
               className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-white"
             />
           </div>

           <button 
             onClick={handleStart}
             className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
           >
             <Play size={18} /> {t('start_bot')}
           </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
           <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
              <div className="flex justify-between text-xs text-gray-400 mb-2 border-b border-gray-700/50 pb-2">
                 <span>Leverage</span>
                 <span className="text-yellow-400 font-bold">{config.leverage}x</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                 <span>Entry</span>
                 <span className="text-white font-mono">${config.entryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                 <span>Target (TP)</span>
                 <span className="text-green-400 font-mono font-bold">${config.takeProfit.toFixed(2)} (+{config.tpPercent}%)</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                 <span>Stop (SL)</span>
                 <span className="text-red-400 font-mono font-bold">${config.stopLoss.toFixed(2)} (-{config.slPercent}%)</span>
              </div>
           </div>
           
           <div className="text-center py-2">
             <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs animate-pulse border border-green-500/30">
               <span className="w-2 h-2 rounded-full bg-green-500"></span> {t('bot_running')}
             </span>
           </div>

           <button 
             onClick={handleStop}
             className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
           >
             <Square size={18} /> {t('stop_bot')}
           </button>
        </div>
      )}
      
      <button 
        onClick={() => setShowHistory(!showHistory)}
        className="w-full mt-4 text-xs text-gray-500 flex items-center justify-center gap-1 hover:text-white"
      >
        <History size={12} /> {showHistory ? t('hide') : t('show')} {t('history')}
      </button>
      
      {showHistory && config.trades.length > 0 && (
        <div className="mt-2 max-h-32 overflow-y-auto text-xs space-y-2 border-t border-gray-700 pt-2">
          {config.trades.map(trade => (
             <div key={trade.id} className="flex justify-between items-center bg-gray-900/50 p-2 rounded">
                <div className="flex flex-col">
                    <span className={trade.profit && trade.profit > 0 ? 'text-green-400' : 'text-red-400'}>
                    {trade.reason}
                    </span>
                    <span className="text-[10px] text-gray-500">{trade.leverage}x Leverage</span>
                </div>
                <span className={`font-mono ${trade.profit && trade.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.profit && trade.profit > 0 ? '+' : ''}{trade.profit?.toFixed(2)}
                </span>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BotPanel;
