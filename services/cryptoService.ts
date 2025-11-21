
import { TrendDirection, PatternType, IndicatorSignal, AnalysisInput, ChartData, CoinOption, FibLevels, NewsItem, SentimentAnalysis, TradingMode, OrderBook, WhaleAlert, RsiDivergence } from '../types';

const BINANCE_SPOT_API = 'https://api.binance.com/api/v3';
const BINANCE_FUTURES_API = 'https://fapi.binance.com/fapi/v1';
const NEWS_API = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN';

interface Kline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Helper to get correct API URL
const getBaseUrl = (mode: TradingMode) => {
  return mode === 'FUTURES' ? BINANCE_FUTURES_API : BINANCE_SPOT_API;
};

// Helper to resolve symbol aliases
const resolveSymbol = (symbol: string): string => {
  const s = symbol.toUpperCase().trim();
  // Handle H / HUSDT -> HBARUSDT (Hedera) which is often what users look for with 'H'
  if (s === 'HUSDT' || s === 'H') return 'HBARUSDT'; 
  return s;
};

// Fetch Order Book
export const fetchOrderBook = async (symbol: string, mode: TradingMode = 'SPOT'): Promise<OrderBook> => {
  try {
    const baseUrl = getBaseUrl(mode);
    const resolvedSymbol = resolveSymbol(symbol);
    const response = await fetch(`${baseUrl}/depth?symbol=${resolvedSymbol}&limit=10`);
    
    if (!response.ok) return { bids: [], asks: [] };
    
    const data = await response.json();
    return {
        bids: data.bids || [],
        asks: data.asks || []
    };
  } catch (error) {
    console.error("Error fetching order book:", error);
    return { bids: [], asks: [] };
  }
};

// Fetch Top Coins based on Mode (Spot vs Futures)
export const getTopCoins = async (mode: TradingMode = 'SPOT'): Promise<CoinOption[]> => {
  try {
    const baseUrl = getBaseUrl(mode);
    const response = await fetch(`${baseUrl}/ticker/24hr`);
    
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    
    // Filter for USDT pairs and sort by quote volume
    const topCoins = data
      .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .map((ticker: any) => ({
        symbol: ticker.symbol,
        name: `${ticker.symbol.replace('USDT', '')}/USDT`
      }));

    if (topCoins.length === 0) throw new Error("No data found");
    
    return topCoins;
  } catch (error) {
    console.error("Error fetching top coins:", error);
    // Fallback list
    return [
      { symbol: 'BTCUSDT', name: 'BTC/USDT' },
      { symbol: 'ETHUSDT', name: 'ETH/USDT' },
      { symbol: 'BNBUSDT', name: 'BNB/USDT' },
      { symbol: 'SOLUSDT', name: 'SOL/USDT' },
      { symbol: 'HBARUSDT', name: 'HBAR/USDT' },
    ];
  }
};

// Fetch Market News
export const fetchCryptoNews = async (): Promise<NewsItem[]> => {
  try {
    const response = await fetch(NEWS_API);
    if (!response.ok) return [];
    const data = await response.json();
    return data.Data.slice(0, 10).map((item: any) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      source: item.source_info.name,
      published_on: item.published_on,
      imageurl: item.imageurl
    }));
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
};

const analyzeNewsSentiment = (news: NewsItem[]): SentimentAnalysis => {
  let score = 0;
  const keywords: string[] = [];
  const bullWords = ['surge', 'bull', 'high', 'soar', 'adoption', 'approve', 'gain', 'rally', 'breakout'];
  const bearWords = ['drop', 'bear', 'low', 'crash', 'ban', 'hack', 'risk', 'fall', 'dump', 'fear'];

  news.forEach(item => {
    const text = item.title.toLowerCase();
    bullWords.forEach(w => {
      if (text.includes(w)) {
        score += 1;
        if (!keywords.includes(w)) keywords.push(w);
      }
    });
    bearWords.forEach(w => {
      if (text.includes(w)) {
        score -= 1;
        if (!keywords.includes(w)) keywords.push(w);
      }
    });
  });

  const normalized = Math.max(-1, Math.min(1, score / 5));
  
  return {
    score: normalized,
    label: normalized > 0.2 ? 'Bullish' : normalized < -0.2 ? 'Bearish' : 'Neutral',
    keywords: keywords.slice(0, 5)
  };
};

// Fetch candlestick data (Klines)
const fetchKlines = async (symbol: string, interval: string = '1h', limit: number = 250, mode: TradingMode): Promise<Kline[]> => {
  try {
    const baseUrl = getBaseUrl(mode);
    const actualSymbol = resolveSymbol(symbol);
    
    const response = await fetch(`${baseUrl}/klines?symbol=${actualSymbol}&interval=${interval}&limit=${limit}`);
    
    if (!response.ok) {
      console.warn(`Binance API returned status ${response.status} for ${actualSymbol}`);
      return [];
    }

    const data = await response.json();
    
    // Handle API errors (e.g., symbol not found returning error object)
    if (!Array.isArray(data)) {
        console.warn(`API returned non-array for ${actualSymbol}:`, data);
        return [];
    }

    return data.map((d: any) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    return [];
  }
};

// --- INDICATOR CALCULATIONS ---

const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) gains += change; else losses -= change;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const currentGain = change >= 0 ? change : 0;
    const currentLoss = change < 0 ? -change : 0;
    avgGain = ((avgGain * (period - 1)) + currentGain) / period;
    avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateSMA = (prices: number[], period: number): number => {
  if (prices.length < period) return 0;
  const slice = prices.slice(prices.length - period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
};

const calculateEMA = (prices: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  let ema = prices[0];
  emaArray.push(ema);
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    emaArray.push(ema);
  }
  return emaArray;
};

const calculateATR = (klines: Kline[], period: number = 14): number[] => {
    const trs = [];
    for(let i=1; i<klines.length; i++) {
        const high = klines[i].high;
        const low = klines[i].low;
        const prevClose = klines[i-1].close;
        
        const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
        trs.push(tr);
    }
    
    const atr = [];
    for(let i=0; i < trs.length; i++) {
        if (i < period - 1) {
             atr.push(0); 
             continue;
        }
        const slice = trs.slice(i - period + 1, i + 1);
        const sum = slice.reduce((a, b) => a + b, 0);
        atr.push(sum / period);
    }
    return atr;
};

const calculateMACD = (prices: number[]) => {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);
  
  return {
    line: macdLine,
    signal: signalLine,
    hist: histogram
  };
};

const calculateBollingerBands = (prices: number[], period: number = 20, stdDevMultiplier: number = 2) => {
  const bands = prices.map((_, index) => {
    if (index < period - 1) return { upper: 0, middle: 0, lower: 0 };
    
    const slice = prices.slice(index - period + 1, index + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    
    const squaredDiffs = slice.map(p => Math.pow(p - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      middle: mean,
      upper: mean + (stdDev * stdDevMultiplier),
      lower: mean - (stdDev * stdDevMultiplier)
    };
  });
  return bands;
};

const calculateIchimoku = (klines: Kline[]) => {
  const getHighLow = (slice: Kline[]) => {
    const high = Math.max(...slice.map(k => k.high));
    const low = Math.min(...slice.map(k => k.low));
    return (high + low) / 2;
  };

  const results = klines.map((_, i) => {
    if (i < 52) return { tenkan: 0, kijun: 0, senkouA: 0, senkouB: 0 };
    
    const tenkan = getHighLow(klines.slice(i - 8, i + 1)); 
    const kijun = getHighLow(klines.slice(i - 25, i + 1)); 
    const senkouA = (tenkan + kijun) / 2;
    const senkouB = getHighLow(klines.slice(i - 51, i + 1)); 
    
    return { tenkan, kijun, senkouA, senkouB };
  });

  return results;
};

const calculateFibonacci = (klines: Kline[]): FibLevels => {
  const recentKlines = klines.slice(-50);
  const high = Math.max(...recentKlines.map(k => k.high));
  const low = Math.min(...recentKlines.map(k => k.low));
  const diff = high - low;

  return {
    zero: high,
    twoThreeSix: high - (diff * 0.236),
    threeEightTwo: high - (diff * 0.382),
    five: high - (diff * 0.5),
    sixOneEight: high - (diff * 0.618),
    one: low
  };
};

// --- DIVERGENCE DETECTION ---
const detectRsiDivergence = (data: ChartData[]): RsiDivergence | undefined => {
    if (data.length < 30) return undefined;
    
    // We look at the last 30 candles for pivots
    const scanWindow = data.slice(-30);
    
    // Helper to find pivots
    const pivots: { index: number, price: number, rsi: number, type: 'high'|'low' }[] = [];
    
    for(let i = 2; i < scanWindow.length - 2; i++) {
        const curr = scanWindow[i];
        const prev = scanWindow[i-1];
        const next = scanWindow[i+1];
        const prev2 = scanWindow[i-2];
        const next2 = scanWindow[i+2];
        
        // Local Low
        if (curr.price < prev.price && curr.price < next.price && curr.price < prev2.price && curr.price < next2.price) {
            pivots.push({ index: i, price: curr.price, rsi: curr.rsi, type: 'low' });
        }
        // Local High
        if (curr.price > prev.price && curr.price > next.price && curr.price > prev2.price && curr.price > next2.price) {
            pivots.push({ index: i, price: curr.price, rsi: curr.rsi, type: 'high' });
        }
    }
    
    // Check for Bullish Divergence (Lower Low Price, Higher Low RSI)
    const lows = pivots.filter(p => p.type === 'low');
    if (lows.length >= 2) {
        const lastLow = lows[lows.length - 1];
        const prevLow = lows[lows.length - 2];
        
        // Price Lower Low AND RSI Higher Low
        if (lastLow.price < prevLow.price && lastLow.rsi > prevLow.rsi) {
             // Filter noise: RSI should be somewhat low (< 45 usually)
             if(lastLow.rsi < 45) {
                 return {
                     type: 'Bullish',
                     priceStart: prevLow.price,
                     priceEnd: lastLow.price,
                     rsiStart: prevLow.rsi,
                     rsiEnd: lastLow.rsi,
                     timeStart: scanWindow[prevLow.index].time,
                     timeEnd: scanWindow[lastLow.index].time
                 };
             }
        }
    }
    
    // Check for Bearish Divergence (Higher High Price, Lower High RSI)
    const highs = pivots.filter(p => p.type === 'high');
    if (highs.length >= 2) {
        const lastHigh = highs[highs.length - 1];
        const prevHigh = highs[highs.length - 2];
        
        // Price Higher High AND RSI Lower High
        if (lastHigh.price > prevHigh.price && lastHigh.rsi < prevHigh.rsi) {
             // Filter noise: RSI should be somewhat high (> 55 usually)
             if(lastHigh.rsi > 55) {
                 return {
                     type: 'Bearish',
                     priceStart: prevHigh.price,
                     priceEnd: lastHigh.price,
                     rsiStart: prevHigh.rsi,
                     rsiEnd: lastHigh.rsi,
                     timeStart: scanWindow[prevHigh.index].time,
                     timeEnd: scanWindow[lastHigh.index].time
                 };
             }
        }
    }
    
    return undefined;
};

// Determine Trend and Signal
const analyzeTechnicalData = (klines: Kline[], newsItems: NewsItem[] = []): Partial<AnalysisInput> => {
  if (klines.length < 200) return {};

  const closePrices = klines.map(k => k.close);
  const currentPrice = closePrices[closePrices.length - 1];
  
  const c0 = klines[klines.length - 1];
  const c1 = klines[klines.length - 2];
  const c2 = klines[klines.length - 3];
  
  const price24hAgo = closePrices[closePrices.length - 24] || currentPrice;
  const priceChange24h = ((currentPrice - price24hAgo) / price24hAgo) * 100;

  const rsi = Math.round(calculateRSI(closePrices, 14));
  const sma50 = calculateSMA(closePrices, 50);
  const sma200 = calculateSMA(closePrices, 200);
  const prevClosePrices = closePrices.slice(0, -1);
  const prevSma50 = calculateSMA(prevClosePrices, 50);
  const prevSma200 = calculateSMA(prevClosePrices, 200);

  const macdData = calculateMACD(closePrices);
  const bbData = calculateBollingerBands(closePrices);
  const ichimokuData = calculateIchimoku(klines);
  const atrData = calculateATR(klines);

  const currMacd = {
    line: macdData.line[macdData.line.length - 1],
    signal: macdData.signal[macdData.signal.length - 1],
    hist: macdData.hist[macdData.hist.length - 1]
  };

  const currBB = bbData[bbData.length - 1];
  const cloudIndex = ichimokuData.length - 27;
  const currCloud = cloudIndex > 0 ? ichimokuData[cloudIndex] : { senkouA: 0, senkouB: 0 };
  const currATR = atrData[atrData.length - 1] || 0;

  let trend = TrendDirection.SIDEWAYS;
  if (currentPrice > sma50 * 1.01) trend = TrendDirection.UPTREND;
  else if (currentPrice < sma50 * 0.99) trend = TrendDirection.DOWNTREND;

  let maSignal = IndicatorSignal.NEUTRAL;
  if (prevSma50 < prevSma200 && sma50 > sma200) maSignal = IndicatorSignal.GOLDEN_CROSS;
  else if (prevSma50 > prevSma200 && sma50 < sma200) maSignal = IndicatorSignal.DEATH_CROSS;
  
  const bbWidth = (currBB.upper - currBB.lower) / currBB.middle;
  if (bbWidth < 0.05) maSignal = IndicatorSignal.BOL_SQUEEZE; 

  if (rsi > 70) maSignal = IndicatorSignal.OVERBOUGHT;
  if (rsi < 30) maSignal = IndicatorSignal.OVERSOLD;

  let ichimokuSignal: 'Above Cloud' | 'Below Cloud' | 'Inside Cloud' = 'Inside Cloud';
  if (currentPrice > Math.max(currCloud.senkouA, currCloud.senkouB)) ichimokuSignal = 'Above Cloud';
  else if (currentPrice < Math.min(currCloud.senkouA, currCloud.senkouB)) ichimokuSignal = 'Below Cloud';

  const volumes = klines.map(k => k.volume);
  const avgVol = calculateSMA(volumes, 20);
  const volumeState = c0.volume > avgVol ? 'High' : 'Low';

  const sentiment = analyzeNewsSentiment(newsItems);

  // Whale Alert Detection
  let whaleAlert: WhaleAlert = { isDetected: false, type: 'NONE', confidence: 'Low', description: '' };
  const volMultiple = c0.volume / avgVol;
  
  if (volMultiple > 3) {
      whaleAlert.isDetected = true;
      if (c0.close > c0.open) {
          whaleAlert.type = 'ACCUMULATION';
          whaleAlert.description = 'Unusual buying volume detected.';
      } else {
          whaleAlert.type = 'DISTRIBUTION';
          whaleAlert.description = 'Unusual selling volume detected.';
      }
      whaleAlert.confidence = volMultiple > 5 ? 'High' : 'Medium';
  } else if (Math.abs(priceChange24h) > 10) {
      whaleAlert.isDetected = true;
      whaleAlert.type = 'HIGH_VOLATILITY';
      whaleAlert.description = 'Extreme price movement detected.';
      whaleAlert.confidence = 'High';
  }

  let pattern = PatternType.NONE;
  const isGreen = (k: Kline) => k.close > k.open;
  const isRed = (k: Kline) => k.close < k.open;
  const body = (k: Kline) => Math.abs(k.close - k.open);
  const range = (k: Kline) => k.high - k.low;
  const upperShadow0 = c0.high - Math.max(c0.open, c0.close);
  const lowerShadow0 = Math.min(c0.open, c0.close) - c0.low;

  if (body(c0) <= range(c0) * 0.1) pattern = PatternType.DOJI;
  else if (lowerShadow0 > body(c0) * 2 && upperShadow0 < body(c0)) pattern = PatternType.HAMMER;
  else if (upperShadow0 > body(c0) * 2 && lowerShadow0 < body(c0)) pattern = PatternType.SHOOTING_STAR;
  else if (isRed(c1) && isGreen(c0) && c0.open <= c1.close && c0.close >= c1.open) pattern = PatternType.ENGULFING_BULLISH;
  else if (isGreen(c1) && isRed(c0) && c0.open >= c1.close && c0.close <= c1.open) pattern = PatternType.ENGULFING_BEARISH;
  else if (isRed(c1) && isGreen(c0) && c0.close < c1.open && c0.open > c1.close) pattern = PatternType.HARAMI_BULLISH;
  else if (isGreen(c1) && isRed(c0) && c0.close > c1.open && c0.open < c1.close) pattern = PatternType.HARAMI_BEARISH;
  else if (isRed(c2) && body(c2) > range(c2)*0.5 && body(c1) < range(c1)*0.3 && isGreen(c0) && c0.close > (c2.open + c2.close)/2) pattern = PatternType.MORNING_STAR;
  else if (isGreen(c2) && body(c2) > range(c2)*0.5 && body(c1) < range(c1)*0.3 && isRed(c0) && c0.close < (c2.open + c2.close)/2) pattern = PatternType.EVENING_STAR;

  const historicalData: ChartData[] = [];
  const chartSlice = 60; 
  const startIdx = closePrices.length - chartSlice;
  
  for (let i = startIdx; i < closePrices.length; i++) {
      const sliceForCalc = closePrices.slice(0, i + 1);
      const date = new Date(klines[i].time);
      const cloudIdx = i - 26;
      const cloud = cloudIdx >= 0 ? ichimokuData[cloudIdx] : null;
      // Calculate historic RSI for display/analysis
      const histRsi = Math.round(calculateRSI(sliceForCalc, 14));

      historicalData.push({
          time: `${date.getHours()}:00`,
          price: closePrices[i],
          sma20: calculateSMA(sliceForCalc, 20),
          sma50: calculateSMA(sliceForCalc, 50),
          sma100: calculateSMA(sliceForCalc, 100),
          sma200: calculateSMA(sliceForCalc, 200),
          rsi: histRsi,
          bbUpper: bbData[i].upper,
          bbLower: bbData[i].lower,
          bbMiddle: bbData[i].middle,
          macdHist: macdData.hist[i],
          tenkan: ichimokuData[i].tenkan,
          kijun: ichimokuData[i].kijun,
          senkouA: cloud ? cloud.senkouA : undefined,
          senkouB: cloud ? cloud.senkouB : undefined
      });
  }

  const fibLevels = calculateFibonacci(klines);
  const rsiDivergence = detectRsiDivergence(historicalData);

  return {
    currentPrice,
    rsi,
    trend,
    movingAverageSignal: maSignal,
    volumeState,
    currentVolume: c0.volume,
    averageVolume: avgVol,
    priceChange24h,
    pattern,
    historicalData,
    fibLevels,
    news: newsItems,
    ma50: sma50,
    ma200: sma200,
    atr: currATR,
    macd: currMacd,
    ichimokuSignal,
    sentiment,
    whaleAlert,
    rsiDivergence
  };
};

export const getMarketAnalysis = async (symbol: string, mode: TradingMode = 'SPOT'): Promise<Partial<AnalysisInput>> => {
  const resolvedSymbol = resolveSymbol(symbol);
  const [klines, news] = await Promise.all([
    fetchKlines(resolvedSymbol, '1h', 300, mode),
    fetchCryptoNews()
  ]);
  
  if (klines.length === 0) return {};

  return analyzeTechnicalData(klines, news);
};
