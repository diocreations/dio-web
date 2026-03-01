import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NewsletterSubscribe = ({ variant = "default", source = "website" }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribed(true);
        setEmail("");
        toast.success(data.message || "Successfully subscribed!");
      } else {
        toast.error(data.detail || "Failed to subscribe");
      }
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className={`flex items-center gap-2 ${variant === "footer" ? "text-green-400" : "text-green-600"}`}>
        <CheckCircle size={18} />
        <span className="text-sm">Thanks for subscribing!</span>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <form onSubmit={handleSubscribe} className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
            data-testid="newsletter-email-footer"
          />
        </div>
        <Button type="submit" disabled={loading} size="sm" data-testid="newsletter-subscribe-footer">
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Subscribe"}
        </Button>
      </form>
    );
  }

  // Default/inline variant
  return (
    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="pl-10 h-12"
          data-testid="newsletter-email"
        />
      </div>
      <Button type="submit" disabled={loading} className="h-12 px-6" data-testid="newsletter-subscribe">
        {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Mail size={18} className="mr-2" />}
        Subscribe
      </Button>
    </form>
  );
};

export default NewsletterSubscribe;
