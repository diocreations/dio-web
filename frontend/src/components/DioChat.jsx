import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Sparkles, ExternalLink, User, Mail, Phone, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Animated Logo SVG for chat button
const AnimatedLogoIcon = () => (
  <svg viewBox="0 0 40 40" className="w-8 h-8">
    <defs>
      <linearGradient id="chatGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#a78bfa" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="18" fill="url(#chatGrad1)" />
    <g transform="translate(10, 10)">
      <path d="M10 2 L18 10 L10 18 L2 10 Z" fill="white" opacity="0.9">
        <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="8s" repeatCount="indefinite"/>
      </path>
      <circle cx="10" cy="10" r="4" fill="white" opacity="0.7">
        <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/>
      </circle>
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
  const [showBuilderCTA, setShowBuilderCTA] = useState(false);
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
          content:
            "Hi! 👋 I'm Dio, your digital assistant from DIOCREATIONS. I'm here to help you find the perfect solution for your business needs.\n\nLooking to build a website? Try our AI Website Builder - create a professional site in minutes!\n\nOr tell me what you need: websites, hosting, SEO, or AI solutions.",
        },
      ]);
      // Show builder CTA after a short delay
      setTimeout(() => setShowBuilderCTA(true), 1000);
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
        setPortfolioItems(data.slice(0, 4)); // Show max 4 items
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

        // Update lead info if available
        if (data.lead_info) {
          setLeadInfo(data.lead_info);
        }

        // Show portfolio if requested
        if (data.show_portfolio) {
          await fetchPortfolio(data.show_portfolio);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I'm having trouble connecting right now. Please try again or contact us directly!",
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Oops! Something went wrong. Please refresh and try again.",
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
      fetch(`${API_URL}/api/chat/${sessionId}`, { method: "DELETE" }).catch(
        console.error
      );
      const newSessionId = `dio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("dio_session_id", newSessionId);
      setSessionId(newSessionId);
    }
    setMessages([]);
    setPortfolioItems([]);
    setShowPortfolio(false);
    setLeadInfo({});
    setIsOpen(false);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full gradient-violet shadow-lg shadow-violet-500/30 flex items-center justify-center cursor-pointer"
            data-testid="dio-chat-toggle"
          >
            <MessageCircle className="text-white" size={24} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white animate-pulse" />
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
            {/* Header */}
            <div className="gradient-violet p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-white">Dio</h3>
                  <p className="text-xs text-violet-100">
                    Your AI Assistant • Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="text-white/70 hover:text-white text-xs underline"
                  data-testid="clear-chat-btn"
                >
                  Clear
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

            {/* Lead Info Bar (if collected) */}
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
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-white text-foreground shadow-sm border border-slate-100 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
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
                    📁 Sample Works:
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
                            <p className="text-xs font-medium text-foreground truncate">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-primary">
                              {item.category}
                            </p>
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
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin text-primary" size={16} />
                      <span className="text-sm text-muted-foreground">
                        Dio is typing...
                      </span>
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
                Powered by AI • DioCreations
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DioChat;
