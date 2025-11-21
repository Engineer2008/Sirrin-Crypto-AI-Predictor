
import { Language } from '../types';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

export const translations: Translations = {
  en: {
    // Navbar
    dashboard: "Dashboard",
    ai_assistant: "AI Assistant",
    learn: "Learn",
    
    // Dashboard
    title: "Sirrin Crypto AI Predictor",
    subtitle: "Advanced Intelligence & Analysis based on Book Principles",
    live_mode: "Live Intelligence Mode",
    manual_mode: "Manual Simulation",
    analyzing: "Analyzing",
    real_time: "Real-time",
    offline_mode: "Offline Learning Mode",
    analysis_params: "Analysis Parameters",
    analyze_btn: "Analyze Market",
    chart_title: "Advanced Chart (Price Action)",
    market_news: "Market News & Sentiment",
    whale_alert: "Whale Alert",
    signal_verdict: "Signal Verdict",
    tech_factors: "Technical Factors",
    
    // Indicators
    trend_structure: "Trend Structure",
    volume: "Volume",
    crossovers: "Crossovers",
    pattern: "Pattern",
    auto: "(Auto)",
    explain: "Explain",
    
    // Bot
    auto_bot: "Auto-Trading Bot (Paper)",
    balance: "Balance",
    strategy: "Strategy Profile",
    conservative: "Conservative",
    aggressive: "Aggressive",
    custom: "Custom",
    take_profit: "Take Profit (Target)",
    stop_loss: "Stop Loss (Safety)",
    trade_amount: "Trade Amount",
    leverage: "Leverage",
    risk_settings: "Risk Settings",
    start_bot: "Start Bot",
    stop_bot: "Stop Bot",
    bot_running: "Bot Running...",
    history: "History",
    show: "Show",
    hide: "Hide",
    
    // Knowledge
    knowledge_base: "Sirrin Crypto Knowledge Base",
    fund_analysis: "Fundamental Analysis",
    trading_psych: "Trading Psychology",
    tech_analysis: "Technical Analysis",
    risk_mgmt: "Risk Management",
    
    // Misc
    welcome: "Welcome to Sirrin Crypto AI",
    read_more: "Read more",
    refresh: "Refresh",
    settings: "Indicators",
    sent_analysis: "Sentiment Analysis",
    enable_sentiment: "Enable Sentiment",
  },
  ha: {
    // Navbar
    dashboard: "Dashboard",
    ai_assistant: "AI Mataimaki",
    learn: "Koyo",
    
    // Dashboard
    title: "Sirrin Crypto AI Mai Hasashe",
    subtitle: "Bincike Mai Zurfi bisa Ka'idojin Littafin Sirrin Crypto",
    live_mode: "Yanayin Live (Kai Tsaye)",
    manual_mode: "Gwaji na Hannu",
    analyzing: "Ana Binciken",
    real_time: "Lokacin Yanzu",
    offline_mode: "Yanayin Koyo (Offline)",
    analysis_params: "Abubuwan Bincike",
    analyze_btn: "Bincika Kasuwa",
    chart_title: "Taswirar Farashi (Chart)",
    market_news: "Labaran Kasuwa & Ra'ayi",
    whale_alert: "Karkarwar 'Whale'",
    signal_verdict: "Hukuncin AI",
    tech_factors: "Dalilan Fasaha (Technical)",
    
    // Indicators
    trend_structure: "Tsarin Trend",
    volume: "Yawan Ciniki (Volume)",
    crossovers: "Crossovers",
    pattern: "Siffa (Pattern)",
    auto: "(Na'ura)",
    explain: "Bayani",
    
    // Bot
    auto_bot: "Bot na Trading (Gwaji)",
    balance: "Ragowar Kudi",
    strategy: "Tsarin Trading",
    conservative: "Mai Tsantseni (Conservative)",
    aggressive: "Mai Zafin Nama (Aggressive)",
    custom: "Na Musamman (Custom)",
    take_profit: "Karbar Riba (TP)",
    stop_loss: "Tsayar da Asara (SL)",
    trade_amount: "Yawan Kudi",
    leverage: "Leverage (Aro)",
    risk_settings: "Saitin Hadari",
    start_bot: "Fara Bot",
    stop_bot: "Tsayar da Bot",
    bot_running: "Bot yana aiki...",
    history: "Tarihi",
    show: "Nuna",
    hide: "Boye",
    
    // Knowledge
    knowledge_base: "Ilimin Sirrin Crypto",
    fund_analysis: "Binciken Tushe (Fundamental)",
    trading_psych: "Halayyar Trading (Psychology)",
    tech_analysis: "Binciken Fasaha (Technical)",
    risk_mgmt: "Kula da Hadari (Risk Mgmt)",
    
    // Misc
    welcome: "Barka da zuwa Sirrin Crypto AI",
    read_more: "Karanta",
    refresh: "Sake Dubawa",
    settings: "Alamomi (Indicators)",
    sent_analysis: "Binciken Ra'ayi (Sentiment)",
    enable_sentiment: "Sanya Sentiment",
  }
};