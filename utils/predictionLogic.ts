
import { AnalysisInput, PredictionResult, TrendDirection, PatternType, IndicatorSignal, TradingMode, TradeSetup, MarketBehavior } from '../types';

/**
 * Algorithmic prediction based strictly on "Sirrin Crypto" Chapter 7 & 8
 * Upgraded with Multi-Model decision making for Spot & Futures
 */
export const analyzeMarketLogic = (input: AnalysisInput, useSentiment: boolean = true, mode: TradingMode = 'SPOT'): PredictionResult => {
  let score = 0; // -10 (Strong Sell) to +10 (Strong Buy)
  const reasons: string[] = [];
  let hausSummary = "";
  
  // --- 1. Advanced Market Behavior Analysis ---
  const behavior: MarketBehavior = {
    volatility: 'Normal',
    abnormality: 'None',
    trendStrength: 'Moderate'
  };

  // Volatility Check (ATR normalized by price)
  const atrPercent = (input.atr / input.currentPrice) * 100;
  if (atrPercent > 2) behavior.volatility = 'Extreme';
  else if (atrPercent > 1) behavior.volatility = 'High';
  else if (atrPercent < 0.2) behavior.volatility = 'Low';

  // Pump & Dump / Manipulation Detection
  // Logic: Massive price spike (>5%) + Massive Volume (>3x) in 1h candle = Abnormal
  const isVolumeSpike = input.averageVolume > 0 && input.currentVolume > input.averageVolume * 3;
  const isPriceSpike = input.priceChange24h > 5; // Simplified for 24h, in real-time check last candle 
  const isPriceCrash = input.priceChange24h < -5;

  if (isVolumeSpike && isPriceSpike && input.rsi > 80) {
      behavior.abnormality = 'Pump Detected';
      reasons.push("CRITICAL: Pump detected. High volume + rapid price increase. Risk of reversal.");
  } else if (isVolumeSpike && isPriceCrash && input.rsi < 20) {
      behavior.abnormality = 'Dump Detected';
      reasons.push("CRITICAL: Dump detected. High volume + rapid price drop. Falling knife.");
  } else if (isVolumeSpike && Math.abs(input.priceChange24h) < 1) {
      behavior.abnormality = 'Whale Manipulation';
      reasons.push("WARNING: High volume but low price movement. Whales might be accumulating or distributing.");
  }

  // --- 2. Determine Market Trend Structure ---
  let marketCondition: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
  if (input.currentPrice > input.ma50 && input.ma50 > input.ma200) {
    marketCondition = 'Bullish';
  } else if (input.currentPrice < input.ma50 && input.ma50 < input.ma200) {
    marketCondition = 'Bearish';
  }

  // --- 3. Core Scoring Logic ---

  // RSI
  if (input.rsi > 70) {
    score -= 2;
    reasons.push("RSI Overbought (>70). Market extended.");
  } else if (input.rsi < 30) {
    score += 2;
    reasons.push("RSI Oversold (<30). Potential bargain.");
  }

  // Whale Alert Integration
  if (input.whaleAlert && input.whaleAlert.isDetected) {
      if (input.whaleAlert.type === 'ACCUMULATION') {
          score += 2;
          reasons.push(`WHALE ALERT: Accumulation detected. Smart money buying.`);
      } else if (input.whaleAlert.type === 'DISTRIBUTION') {
          score -= 2;
          reasons.push(`WHALE ALERT: Distribution detected. Smart money selling.`);
      }
  }

  // MACD
  if (input.macd) {
    if (input.macd.hist > 0 && input.macd.line > input.macd.signal) {
      score += 2;
      reasons.push("MACD Bullish momentum.");
    } else if (input.macd.hist < 0 && input.macd.line < input.macd.signal) {
      score -= 2;
      reasons.push("MACD Bearish momentum.");
    }
  }

  // Ichimoku
  if (input.ichimokuSignal === 'Above Cloud') {
    score += 2;
    reasons.push("Price above Ichimoku Cloud (Bullish).");
  } else if (input.ichimokuSignal === 'Below Cloud') {
    score -= 2;
    reasons.push("Price below Ichimoku Cloud (Bearish).");
  }

  // MA Signals
  if (input.movingAverageSignal === IndicatorSignal.GOLDEN_CROSS) {
    score += 4;
    reasons.push("Golden Cross (Strong Buy Signal).");
  } else if (input.movingAverageSignal === IndicatorSignal.DEATH_CROSS) {
    score -= 4;
    reasons.push("Death Cross (Strong Sell Signal).");
  }

  // Sentiment
  if (input.sentiment && useSentiment) {
    if (input.sentiment.label === 'Bullish') {
      score += 2;
      reasons.push("News sentiment is positive.");
    } else if (input.sentiment.label === 'Bearish') {
      score -= 2;
      reasons.push("News sentiment is negative.");
    }
  }

  // Pattern Recognition
  switch (input.pattern) {
    case PatternType.HAMMER:
    case PatternType.DOUBLE_BOTTOM:
    case PatternType.MORNING_STAR:
    case PatternType.ENGULFING_BULLISH:
      if (marketCondition === 'Bearish' || input.rsi < 50) {
        score += 3;
        reasons.push(`Bullish Pattern: ${input.pattern}`);
      }
      break;
    case PatternType.SHOOTING_STAR:
    case PatternType.DOUBLE_TOP:
    case PatternType.EVENING_STAR:
    case PatternType.ENGULFING_BEARISH:
    case PatternType.HEAD_AND_SHOULDERS:
      if (marketCondition === 'Bullish' || input.rsi > 50) {
        score -= 3;
        reasons.push(`Bearish Pattern: ${input.pattern}`);
      }
      break;
  }

  // --- 4. Decision Making & Execution Strategy ---
  
  let action: 'BUY' | 'SELL' | 'HOLD' | 'SHORT' | 'LONG' = 'HOLD';
  let signalStrength: 'Strong' | 'Moderate' | 'Weak' = 'Moderate';
  let tradeSetup: TradeSetup | undefined;

  // Adjust Score based on Abnormality (Safety First)
  if (behavior.abnormality !== 'None') {
      // In extreme volatility/manipulation, reduce confidence or advise waiting
      score = score / 2; // Dampen signals
      reasons.push(`CAUTION: Market abnormality detected (${behavior.abnormality}). Reducing exposure.`);
  }

  // Determine Action based on Mode
  if (mode === 'SPOT') {
      if (score >= 5) action = 'BUY';
      else if (score <= -4) action = 'SELL'; // Exit holdings
      else action = 'HOLD';
  } else {
      // FUTURES
      if (score >= 5) action = 'LONG';
      else if (score <= -5) action = 'SHORT';
      else action = 'HOLD';
  }

  // Determine Strength
  const absScore = Math.abs(score);
  if (absScore >= 8) signalStrength = 'Strong';
  else if (absScore >= 5) signalStrength = 'Moderate';
  else signalStrength = 'Weak';

  // Generate Trade Setup (Only if actionable signal)
  if (action !== 'HOLD' && action !== 'SELL' && behavior.abnormality !== 'Pump Detected' && behavior.abnormality !== 'Dump Detected') {
      const isLong = action === 'BUY' || action === 'LONG';
      const multiplier = 1.5; // Risk Multiplier
      
      // ATR-based Stop Loss & Take Profit
      const stopLoss = isLong 
          ? input.currentPrice - (input.atr * 2) 
          : input.currentPrice + (input.atr * 2);
      
      const takeProfit1 = isLong
          ? input.currentPrice + (input.atr * 3)
          : input.currentPrice - (input.atr * 3);
          
      const takeProfit2 = isLong
          ? input.currentPrice + (input.atr * 5)
          : input.currentPrice - (input.atr * 5);

      // Calculate specific logic for entry
      tradeSetup = {
          type: isLong ? 'LONG' : 'SHORT',
          entryZone: `$${(input.currentPrice * 0.999).toFixed(2)} - $${(input.currentPrice * 1.001).toFixed(2)}`,
          stopLoss: parseFloat(stopLoss.toFixed(2)),
          takeProfit1: parseFloat(takeProfit1.toFixed(2)),
          takeProfit2: parseFloat(takeProfit2.toFixed(2)),
          leverage: mode === 'FUTURES' ? (behavior.volatility === 'High' ? 5 : 10) : undefined,
          riskRewardRatio: 1.5 // Simplification
      };
  }

  // Hausa Summaries based on Context
  if (action === 'BUY' || action === 'LONG') {
      hausSummary = "Kasuwa tana da karfi (Bullish). Akwai damar samun riba idan aka bi tsari. Yi amfani da Stop Loss.";
  } else if (action === 'SHORT') {
      hausSummary = "Kasuwa na nuna alamun sauka (Bearish). Akwai damar yin Short a Futures, amma a kiyaye.";
  } else if (action === 'SELL') {
      hausSummary = "Alamomi sun nuna kasuwa zata sauka. Lokaci ne mai kyau na fitar da riba (Take Profit) ko kare jari.";
  } else {
      hausSummary = "Kasuwa bata da tabbas a yanzu (Indecision). Zai fi kyau a dakata a ga inda zata sa gaba.";
  }

  const confidence = Math.min(Math.abs(score) * 10 + 20, 95);

  return {
    action,
    signalStrength,
    confidence,
    reasoning: reasons,
    hausSummary,
    marketBehavior: behavior,
    tradeSetup,
    marketCondition,
    whaleAlert: input.whaleAlert
  };
};
