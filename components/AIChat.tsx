
import React, { useState, useRef, useEffect } from 'react';
import { askSirrinCrypto } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, Bot, User, Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const AIChat: React.FC = () => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: language === 'ha' 
        ? 'Sannu! Ni ne AI mai taimakawa akan Sirrin Crypto. Tambaye ni game da Fundamental Analysis, Candlesticks, ko Trading Strategies.' 
        : 'Sannu! I am Sirrin Crypto AI. Ask me anything about Fundamental Analysis, Candlesticks, or Trading Strategies.',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset welcome message when language changes if it's the only message
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'model') {
       setMessages([{
        role: 'model',
        text: language === 'ha' 
          ? 'Sannu! Ni ne AI mai taimakawa akan Sirrin Crypto. Tambaye ni game da Fundamental Analysis, Candlesticks, ko Trading Strategies.' 
          : 'Sannu! I am Sirrin Crypto AI. Ask me anything about Fundamental Analysis, Candlesticks, or Trading Strategies.',
        timestamp: Date.now()
       }]);
    }
  }, [language]);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = language === 'ha' ? 'ha-NG' : 'en-US'; // Try setting lang
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognitionRef.current = recognition;
    }
  }, [language]); // Re-init if lang changes

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Browser does not support voice input.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = language === 'ha' ? 'ha-NG' : 'en-US';
      recognitionRef.current.start();
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Pass current language to service
    const aiResponse = await askSirrinCrypto(input, language);
    
    const botMsg: ChatMessage = { role: 'model', text: aiResponse, timestamp: Date.now() };
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-crypto-card rounded-xl border border-gray-700 shadow-xl max-w-4xl mx-auto mt-8 overflow-hidden">
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center gap-2">
        <Bot className="text-crypto-accent" />
        <h3 className="font-bold text-white">Sirrin Crypto Assistant</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-crypto-dark">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-gray-700 text-gray-200 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-gray-700 rounded-2xl p-4 rounded-bl-none flex gap-2">
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-2">
          <button 
            onClick={toggleListening}
            className={`p-3 rounded-lg transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            title="Voice Input"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={language === 'ha' ? "Tambaye ni..." : "Ask me..."}
            className="flex-1 bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-crypto-accent"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-crypto-accent hover:bg-green-600 text-white p-3 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
