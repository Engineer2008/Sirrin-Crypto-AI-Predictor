
export type Language = 'en' | 'ha';

export enum TrendDirection {
  UPTREND = 'Uptrend (Farashi na tashi)',
  DOWNTREND = 'Downtrend (Farashi na sauka)',
  SIDEWAYS = 'Sideways (Lilo a guri daya)'
}

export enum PatternType {
  NONE = 'None',
  DOJI = 'Doji (Rashin Tabbaci)',
  HAMMER = 'Hammer (Alamar Tashi)',
  SHOOTING_STAR = 'Shooting Star (Alamar Sauka)',
  ENGULFING_BULLISH = 'Bullish Engulfing (Rinjayen Masu Saye)',
  ENGULFING_BEARISH = 'Bearish Engulfing (Rinjayen Masu Sayarwa)',
  HEAD_AND_SHOULDERS = 'Head and Shoulders',
  DOUBLE_TOP = 'Double Top',
  DOUBLE_BOTTOM = 'Double Bottom',
  MORNING_STAR = 'Morning Star (Agogon Farko - Bullish)',
  EVENING_STAR = 'Evening Star (Agogon Karshe - Bearish)',
  HARAMI_BULLISH = 'Bullish Harami (Mace mai ciki - Tashi)',
  HARAMI_BEARISH = 'Bearish Harami (Mace mai ciki - Sauka)'
}

export enum IndicatorSignal {
  NEUTRAL = 'Neutral',
  OVERBOUGHT = 'Overbought (RSI > 70)',
  OVERSOLD = 'Oversold (RSI < 30)',
  GOLDEN_CROSS = 'Golden Cross (MA 50 ta tsallake 200)',
  DEATH_CROSS = 'Death Cross (MA 200 ta tsallake 50)',
  BOL_SQUEEZE = 'Bollinger Squeeze (Shirin Fashewa)',
  ICHIMOKU_BREAKOUT = 'Ichimoku Cloud Breakout'
}

export interface ChartData {
  time: string;
  price: number;
  sma20: number;
  sma50: number;
  sma100: number;
  sma200: number;
  rsi: number; // Added RSI history
  
  // Bollinger Bands
  bbUpper?: number;
  bbLower?: number;
  bbMiddle?: number;

  // MACD
  macdLine?: number;
  macdSignal?: number;
  macdHist?: number;

  // Ichimoku
  tenkan?: number; // Conversion Line
  kijun?: number;  // Base Line
  senkouA?: number; // Leading Span A
  senkouB?: number; // Leading Span B
}

export interface FibLevels {
  zero: number; // High
  twoThreeSix: number;
  threeEightTwo: number;
  five: number;
  sixOneEight: number;
  one: number; // Low
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  published_on: number;
  imageurl: string;
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: 'Bullish' | 'Bearish' | 'Neutral';
  keywords: string[];
}

export interface BotConfig {
  active: boolean;
  entryPrice: number;
  amount: number;
  takeProfit: number; // Price
  stopLoss: number; // Price
  strategy: 'Conservative' | 'Aggressive' | 'Custom';
  trades: BotTrade[];
  leverage: number;
  slPercent: number;
  tpPercent: number;
  orderType?: 'MARKET' | 'STOP_LIMIT';
  limitPrice?: number;
}

export interface BotTrade {
  id: number;
  type: 'BUY' | 'SELL';
  price: number;
  timestamp: Date;
  profit?: number;
  reason: string;
  leverage: number;
}

export type TradingMode = 'SPOT' | 'FUTURES';

export interface TradeSetup {
  type: 'LONG' | 'SHORT' | 'WAIT';
  entryZone: string;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  leverage?: number; // Only for futures
  riskRewardRatio: number;
}

export interface MarketBehavior {
  volatility: 'Low' | 'Normal' | 'High' | 'Extreme';
  abnormality: 'None' | 'Pump Detected' | 'Dump Detected' | 'Whale Manipulation';
  trendStrength: 'Weak' | 'Moderate' | 'Strong';
}

export interface WhaleAlert {
  isDetected: boolean;
  type: 'ACCUMULATION' | 'DISTRIBUTION' | 'HIGH_VOLATILITY' | 'NONE';
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface RsiDivergence {
  type: 'Bullish' | 'Bearish';
  priceStart: number;
  priceEnd: number;
  timeStart: string;
  timeEnd: string;
  rsiStart: number;
  rsiEnd: number;
}

export interface OrderBook {
  bids: [string, string][]; // [price, amount]
  asks: [string, string][];
}

export interface AnalysisInput {
  currentPrice: number;
  rsi: number;
  trend: TrendDirection;
  volumeState: 'High' | 'Low';
  currentVolume: number;
  averageVolume: number;
  priceChange24h: number; 
  pattern: PatternType;
  movingAverageSignal: IndicatorSignal;
  historicalData?: ChartData[];
  fibLevels?: FibLevels;
  news?: NewsItem[];
  ma50: number;
  ma200: number;
  atr: number; // Average True Range for Volatility
  
  // Advanced
  macd?: { line: number; signal: number; hist: number };
  ichimokuSignal?: 'Above Cloud' | 'Below Cloud' | 'Inside Cloud';
  sentiment?: SentimentAnalysis;
  whaleAlert: WhaleAlert;
  rsiDivergence?: RsiDivergence; // Added
}

export interface PredictionResult {
  action: 'BUY' | 'SELL' | 'HOLD' | 'SHORT' | 'LONG';
  signalStrength: 'Strong' | 'Moderate' | 'Weak';
  confidence: number; // 0 to 100
  reasoning: string[]; // List of reasons based on the book
  hausSummary: string; // Summary in Hausa
  marketBehavior: MarketBehavior; // New field for behavioral analysis
  tradeSetup?: TradeSetup; // New field for actionable decision
  marketCondition: 'Bullish' | 'Bearish' | 'Neutral';
  whaleAlert?: WhaleAlert;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface CoinOption {
  symbol: string;
  name: string;
}
