import { useState } from "react";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Globe,
  Search,
  Check,
  X,
  Loader2,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DomainsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchDomains = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a domain name to search");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Search for suggestions
      const response = await fetch(`${API_URL}/api/domains/suggest?keyword=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();
      
      if (data.suggestions) {
        setResults(data.suggestions);
      } else {
        setResults([]);
      }
    } catch (error) {
      toast.error("Failed to search domains. Please try again.");
      setResults([]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchDomains();
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary/90 to-slate-900" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white font-medium text-sm mb-6 border border-white/20">
              <Globe className="w-4 h-4" />
              Domain Registration
            </span>
            <h1 className="font-heading font-bold text-4xl md:text-5xl text-white mb-4">
              Find Your Perfect Domain
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Search for available domain names and secure your online identity today.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter your desired domain name (e.g., mybusiness)"
                      className="pl-12 h-14 text-lg"
                      data-testid="domain-search-input"
                    />
                  </div>
                  <Button 
                    onClick={searchDomains} 
                    disabled={loading}
                    size="lg"
                    className="h-14 px-8"
                    data-testid="domain-search-btn"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Searching for available domains...</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <X className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="font-heading font-semibold text-xl mb-2">No Results Found</h3>
                <p className="text-muted-foreground">
                  Try searching with a different keyword
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h2 className="font-heading font-bold text-2xl mb-6">
                Domain Availability for "{searchQuery}"
              </h2>
              
              <div className="grid gap-4">
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`transition-all ${result.available ? "hover:border-primary" : "opacity-60"}`}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            result.available ? "bg-green-100" : "bg-red-100"
                          }`}>
                            {result.available ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <X className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{result.domain}</p>
                            <p className={`text-sm ${result.available ? "text-green-600" : "text-red-600"}`}>
                              {result.available ? "Available" : "Not Available"}
                            </p>
                          </div>
                        </div>
                        
                        {result.available && (
                          <Button className="gap-2" data-testid={`register-${result.domain}`}>
                            <ShoppingCart className="w-4 h-4" />
                            Register
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Card className="mt-8 bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-lg mb-2">
                    Need Help Choosing a Domain?
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Our team can help you select the perfect domain for your business. 
                    Contact us for personalized assistance.
                  </p>
                  <Button variant="outline" asChild>
                    <a href="/contact">Contact Us</a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!searched && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                { tld: ".com", desc: "Most popular worldwide", price: "€12.99/year" },
                { tld: ".eu", desc: "Perfect for European business", price: "€9.99/year" },
                { tld: ".io", desc: "Tech & startup favorite", price: "€49.99/year" },
              ].map((item, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <p className="font-heading font-bold text-3xl text-primary mb-2">{item.tld}</p>
                    <p className="text-muted-foreground text-sm mb-3">{item.desc}</p>
                    <p className="font-semibold">{item.price}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default DomainsPage;
