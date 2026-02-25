import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Loader2, ExternalLink, User, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Animated Dio Mascot SVG
const DioMascot = ({ size = 40, animate = true }) => (
  <svg viewBox="0 0 100 100" className={`w-${size/4} h-${size/4}`} style={{ width: size, height: size }}>
    <defs>
      <linearGradient id="dioGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#a78bfa" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Background circle */}
    <circle cx="50" cy="50" r="45" fill="url(#dioGrad)" />
    {/* Animated ring */}
    <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="2" opacity="0.3">
      {animate && <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="8s" repeatCount="indefinite"/>}
    </circle>
    {/* Face - Happy robot */}
    <g filter="url(#glow)">
      {/* Eyes */}
      <ellipse cx="35" cy="42" rx="8" ry="10" fill="white" opacity="0.9"/>
      <ellipse cx="65" cy="42" rx="8" ry="10" fill="white" opacity="0.9"/>
      <circle cx="35" cy="42" r="4" fill="#1e1b4b">
        {animate && <animate attributeName="cy" values="42;40;42" dur="2s" repeatCount="indefinite"/>}
      </circle>
      <circle cx="65" cy="42" r="4" fill="#1e1b4b">
        {animate && <animate attributeName="cy" values="42;40;42" dur="2s" repeatCount="indefinite"/>}
      </circle>
      {/* Smile */}
      <path d="M 30 60 Q 50 75 70 60" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round">
        {animate && <animate attributeName="d" values="M 30 60 Q 50 75 70 60;M 30 58 Q 50 78 70 58;M 30 60 Q 50 75 70 60" dur="3s" repeatCount="indefinite"/>}
      </path>
      {/* Cheeks */}
      <circle cx="22" cy="55" r="6" fill="#f472b6" opacity="0.5"/>
      <circle cx="78" cy="55" r="6" fill="#f472b6" opacity="0.5"/>
    </g>
    {/* Sparkle */}
    <g opacity="0.8">
      <path d="M 80 20 L 82 25 L 87 25 L 83 28 L 85 33 L 80 30 L 75 33 L 77 28 L 73 25 L 78 25 Z" fill="white">
        {animate && <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite"/>}
      </path>
    </g>
  </svg>
);

const DioChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [leadInfo, setLeadInfo] = useState({});
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef(null);

  // Generate or retrieve session ID
  useEffect(() => {
    let storedSessionId = localStorage.getItem("dio_session_id");
    if (!storedSessionId) {
      storedSessionId = `dio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("dio_session_id", storedSessionId);
    }
    setSessionId(storedSessionId);

    // Load chat history
    fetch(`${API_URL}/api/chat/${storedSessionId}/history`)
      .then((res) => res.json())
      .then((data) => {
        if (data.history && data.history.length > 0) {
          setMessages(data.history);
          setShowPulse(false);
        }
        if (data.lead_info) {
          setLeadInfo(data.lead_info);
        }
      })
      .catch(console.error);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, portfolioItems]);

  // Show welcome message when chat opens for first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hey there! 👋 Welcome to DioCreations! I'm Dio, your digital buddy.\n\nBefore we dive in, what should I call you? 😊",
        },
      ]);
      setShowPulse(false);
    }
  }, [isOpen, messages.length]);

  // Fetch portfolio items based on category
  const fetchPortfolio = async (category) => {
    try {
      let url = `${API_URL}/api/portfolio?active_only=true`;
      if (category && category !== "all") {
        url += `&category=${encodeURIComponent(category)}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPortfolioItems(data.slice(0, 4));
        setShowPortfolio(true);
      }
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !sessionId) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setShowPortfolio(false);
    setPortfolioItems([]);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);

        if (data.lead_info) {
          setLeadInfo(data.lead_info);
        }

        if (data.show_portfolio) {
          await fetchPortfolio(data.show_portfolio);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Oops! 😅 I'm having a tiny hiccup. Could you try that again? Or feel free to contact us directly at info@diocreations.eu!",
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Uh oh! Something went wonky on my end. 🙈 Give me another shot?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    if (sessionId) {
      fetch(`${API_URL}/api/chat/${sessionId}`, { method: "DELETE" }).catch(console.error);
      const newSessionId = `dio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("dio_session_id", newSessionId);
      setSessionId(newSessionId);
    }
    setMessages([]);
    setPortfolioItems([]);
    setShowPortfolio(false);
    setLeadInfo({});
    setIsOpen(false);
    setShowPulse(true);
  };

  // Parse URLs in message and make them clickable
  const renderMessage = (content) => {
    // Match service/product URLs
    const urlRegex = /(\/services\/[a-z-]+|\/products|\/portfolio|\/contact|\/blog)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <Link 
            key={i} 
            to={part} 
            onClick={() => setIsOpen(false)}
            className="text-violet-300 hover:text-violet-200 underline font-medium"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Chat Toggle Button with Dio Mascot */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 z-50 w-16 h-16 rounded-full bg-white shadow-lg shadow-violet-500/30 flex items-center justify-center cursor-pointer border-2 border-violet-200 hover:border-violet-400 transition-colors"
            data-testid="dio-chat-toggle"
          >
            <DioMascot size={48} animate={true} />
            {showPulse && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] h-[560px] max-h-[calc(100vh-150px)] bg-white rounded-2xl shadow-2xl shadow-violet-500/20 flex flex-col overflow-hidden border border-violet-100"
            data-testid="dio-chat-window"
          >
            {/* Header with Dio */}
            <div className="gradient-violet p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center p-1">
                  <DioMascot size={40} animate={true} />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-white">Dio</h3>
                  <p className="text-xs text-violet-100">Your Digital Buddy • Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="text-white/70 hover:text-white text-xs underline"
                  data-testid="clear-chat-btn"
                >
                  Start Over
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  data-testid="close-chat-btn"
                >
                  <X className="text-white" size={18} />
                </button>
              </div>
            </div>

            {/* Lead Info Bar */}
            {(leadInfo.name || leadInfo.email || leadInfo.phone) && (
              <div className="px-4 py-2 bg-violet-50 border-b border-violet-100 flex items-center gap-3 text-xs">
                {leadInfo.name && (
                  <span className="flex items-center gap-1 text-violet-700">
                    <User size={12} /> {leadInfo.name}
                  </span>
                )}
                {leadInfo.email && (
                  <span className="flex items-center gap-1 text-violet-700">
                    <Mail size={12} /> {leadInfo.email}
                  </span>
                )}
                {leadInfo.phone && (
                  <span className="flex items-center gap-1 text-violet-700">
                    <Phone size={12} /> {leadInfo.phone}
                  </span>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full mr-2 flex-shrink-0">
                      <DioMascot size={32} animate={false} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-white text-foreground shadow-sm border border-slate-100 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.role === "assistant" ? renderMessage(msg.content) : msg.content}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Portfolio Display */}
              {showPortfolio && portfolioItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <p className="text-xs text-muted-foreground font-medium px-1">
                    ✨ Check out some of our work:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {portfolioItems.map((item) => (
                      <Link
                        key={item.portfolio_id}
                        to={`/portfolio/${item.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="group block"
                        data-testid={`portfolio-preview-${item.slug}`}
                      >
                        <div className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-primary hover:shadow-md transition-all">
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={item.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&q=60"}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                            <p className="text-[10px] text-primary">{item.category}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    to="/portfolio"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1 text-xs text-primary hover:underline"
                  >
                    View All Projects <ExternalLink size={12} />
                  </Link>
                </motion.div>
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="w-8 h-8 rounded-full mr-2 flex-shrink-0">
                    <DioMascot size={32} animate={true} />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin text-primary" size={16} />
                      <span className="text-sm text-muted-foreground">Dio is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 h-11 rounded-full border-slate-200 focus:border-primary"
                  disabled={isLoading}
                  data-testid="dio-chat-input"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="w-11 h-11 rounded-full bg-primary hover:bg-primary/90"
                  data-testid="dio-send-btn"
                >
                  <Send size={18} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Powered by AI • DioCreations 🚀
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DioChat;
