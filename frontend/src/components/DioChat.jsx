import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Loader2, ExternalLink, User, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Animated Butterfly Logo (Dio Mascot)
const ButterflyLogo = ({ size = 50, animate = true }) => (
  <svg
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: size, height: size }}
  >
    <style>
      {`
        .dio-left-wing, .dio-right-wing {
          transform-origin: 10px 10px;
        }
        ${animate ? `
        .dio-left-wing {
          animation: dio-flap-left 0.4s ease-in-out infinite alternate;
        }
        .dio-right-wing {
          animation: dio-flap-right 0.4s ease-in-out infinite alternate;
        }
        @keyframes dio-flap-left {
          from { transform: rotate(0deg); }
          to { transform: rotate(-25deg); }
        }
        @keyframes dio-flap-right {
          from { transform: rotate(0deg); }
          to { transform: rotate(25deg); }
        }
        ` : ''}
      `}
    </style>
    {/* Right Wing */}
    <g className="dio-right-wing">
      <path fill="#4D629A" d="M12.7,16.16c-2.36-2.36-2.64-6.14-2.64-6.14s3.98,0.48,6.14,2.64c1.27,1.28,1.52,3.09,0.56,4.06S13.97,17.43,12.7,16.16z"/>
      <path fill="#2F4977" d="M10.06,10.03c0,0,1.91,2.77,6.57,3.13c-0.25-0.33-0.52-0.63-0.83-0.9L10.06,10.03z"/>
      <path fill="#00A096" d="M16.26,12.5c-3.34,0-6.2-2.48-6.2-2.48s3.16-2.48,6.2-2.48c1.8,0,3.26,1.11,3.26,2.48S18.07,12.5,16.26,12.5z"/>
      <path fill="#08877A" d="M10.06,10.03c0,0,3.63,0.39,7.07-2.39c0,0-0.34-0.13-1.51-0.09L10.06,10.03z"/>
      <path fill="#89BF4A" d="M16.19,7.39c-2.36,2.36-6.14,2.64-6.14,2.64s0.48-3.99,2.64-6.14c1.27-1.27,3.09-1.52,4.05-0.56S17.47,6.12,16.19,7.39z"/>
    </g>
    {/* Left Wing */}
    <g className="dio-left-wing">
      <path fill="#8F5398" d="M7.3,16.11c2.36-2.36,2.64-6.14,2.64-6.14s-3.98,0.48-6.14,2.64c-1.27,1.27-1.52,3.09-0.56,4.06S6.03,17.39,7.3,16.11z"/>
      <path fill="#75387F" d="M9.94,9.98c0,0-1.91,2.77-6.57,3.13c0.25-0.33,0.52-0.63,0.83-0.9L9.94,9.98z"/>
      <path fill="#E16136" d="M3.74,12.45c3.34,0,6.2-2.48,6.2-2.48S6.78,7.5,3.74,7.5c-1.8,0-3.26,1.11-3.26,2.47S1.93,12.45,3.74,12.45z"/>
      <path fill="#C34727" d="M9.94,9.98c0,0-3.63,0.39-7.07-2.39c0,0,0.34-0.13,1.51-0.09L9.94,9.98z"/>
      <path fill="#F3BE33" d="M3.81,7.34c2.36,2.36,6.14,2.64,6.14,2.64S9.46,6,7.3,3.84C6.03,2.57,4.21,2.32,3.25,3.29S2.53,6.07,3.81,7.34z"/>
    </g>
  </svg>
);

// Static butterfly for message avatars (no animation, unique class names)
const ButterflyStatic = ({ size = 32 }) => (
  <svg
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: size, height: size }}
  >
    <g>
      <path fill="#4D629A" d="M12.7,16.16c-2.36-2.36-2.64-6.14-2.64-6.14s3.98,0.48,6.14,2.64c1.27,1.28,1.52,3.09,0.56,4.06S13.97,17.43,12.7,16.16z"/>
      <path fill="#2F4977" d="M10.06,10.03c0,0,1.91,2.77,6.57,3.13c-0.25-0.33-0.52-0.63-0.83-0.9L10.06,10.03z"/>
      <path fill="#00A096" d="M16.26,12.5c-3.34,0-6.2-2.48-6.2-2.48s3.16-2.48,6.2-2.48c1.8,0,3.26,1.11,3.26,2.48S18.07,12.5,16.26,12.5z"/>
      <path fill="#08877A" d="M10.06,10.03c0,0,3.63,0.39,7.07-2.39c0,0-0.34-0.13-1.51-0.09L10.06,10.03z"/>
      <path fill="#89BF4A" d="M16.19,7.39c-2.36,2.36-6.14,2.64-6.14,2.64s0.48-3.99,2.64-6.14c1.27-1.27,3.09-1.52,4.05-0.56S17.47,6.12,16.19,7.39z"/>
    </g>
    <g>
      <path fill="#8F5398" d="M7.3,16.11c2.36-2.36,2.64-6.14,2.64-6.14s-3.98,0.48-6.14,2.64c-1.27,1.27-1.52,3.09-0.56,4.06S6.03,17.39,7.3,16.11z"/>
      <path fill="#75387F" d="M9.94,9.98c0,0-1.91,2.77-6.57,3.13c0.25-0.33,0.52-0.63,0.83-0.9L9.94,9.98z"/>
      <path fill="#E16136" d="M3.74,12.45c3.34,0,6.2-2.48,6.2-2.48S6.78,7.5,3.74,7.5c-1.8,0-3.26,1.11-3.26,2.47S1.93,12.45,3.74,12.45z"/>
      <path fill="#C34727" d="M9.94,9.98c0,0-3.63,0.39-7.07-2.39c0,0,0.34-0.13,1.51-0.09L9.94,9.98z"/>
      <path fill="#F3BE33" d="M3.81,7.34c2.36,2.36,6.14,2.64,6.14,2.64S9.46,6,7.3,3.84C6.03,2.57,4.21,2.32,3.25,3.29S2.53,6.07,3.81,7.34z"/>
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
  const [showLabel, setShowLabel] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const messagesEndRef = useRef(null);

  // Generate or retrieve session ID + auto-open with greeting on first visit
  useEffect(() => {
    let storedSessionId = localStorage.getItem("dio_session_id");
    const alreadyGreeted = sessionStorage.getItem("dio_greeted");

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
        } else if (!alreadyGreeted) {
          // First visit with no history — auto-open with random greeting
          fetch(`${API_URL}/api/chatbot/greeting`)
            .then((r) => r.json())
            .then((g) => {
              const greeting = g.greeting || "Hey there! I'm Dio, your digital assistant. What can I help you with?";
              setMessages([{ role: "assistant", content: greeting }]);
              setIsOpen(true);
              setHasAutoOpened(true);
              setShowPulse(false);
              sessionStorage.setItem("dio_greeted", "1");
            })
            .catch(() => {
              setMessages([{ role: "assistant", content: "Hey there! I'm Dio from DioCreations. What can I help you with today?" }]);
              setIsOpen(true);
              setHasAutoOpened(true);
              setShowPulse(false);
              sessionStorage.setItem("dio_greeted", "1");
            });
        }
        if (data.lead_info) {
          setLeadInfo(data.lead_info);
        }
      })
      .catch(console.error);
  }, []);

  // Show "Chat with Dio" label after a delay (genie pop-in)
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setShowLabel(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setShowLabel(false);
    }
  }, [isOpen]);

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
          content: "Hey there! Welcome to DioCreations! I'm Dio, your digital buddy.\n\nBefore we dive in, what should I call you?",
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
            content: "Oops! I'm having a tiny hiccup. Could you try that again? Or feel free to contact us directly at info@diocreations.eu!",
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Uh oh! Something went wonky on my end. Give me another shot?",
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
      {/* Chat Toggle Button with Dio Mascot + "Chat with Dio" genie label */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-24 right-6 z-50 flex items-center gap-3">
            {/* "Chat with Dio" genie speech bubble */}
            <AnimatePresence>
              {showLabel && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.1, x: 40, scaleX: 0.3, scaleY: 0.1 }}
                  animate={{ opacity: 1, scale: 1, x: 0, scaleX: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scale: 0.1, x: 40, scaleX: 0.3, scaleY: 0.1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    mass: 0.8,
                  }}
                  style={{ transformOrigin: "right center" }}
                  className="relative"
                  data-testid="dio-chat-label"
                >
                  <div className="bg-white rounded-xl shadow-lg px-4 py-2.5 border border-violet-100 whitespace-nowrap">
                    <p className="text-sm font-medium text-slate-700">
                      Chat with <span className="font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">Dio</span>
                    </p>
                  </div>
                  {/* Speech bubble arrow pointing right */}
                  <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Butterfly Button */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full bg-white shadow-lg shadow-violet-500/30 flex items-center justify-center cursor-pointer border-2 border-violet-200 hover:border-violet-400 transition-colors"
              data-testid="dio-chat-toggle"
            >
              <ButterflyLogo size={48} animate={true} />
              {showPulse && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                </span>
              )}
            </motion.button>
          </div>
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
            {/* Header with Dio - animated logo */}
            <div className="gradient-violet p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center p-1">
                  <ButterflyLogo size={40} animate={true} />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-white">Dio</h3>
                  <p className="text-xs text-violet-100">Your Digital Buddy</p>
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
                      <ButterflyStatic size={32} />
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
                    Check out some of our work:
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
                    <ButterflyLogo size={32} animate={true} />
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
                Powered by AI &bull; DioCreations
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DioChat;
