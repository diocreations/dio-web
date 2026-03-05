import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Globe,
  Server,
  Shield,
  Layout as LayoutIcon,
  Cloud,
  CloudCog,
  CheckCircle2,
  ArrowRight,
  ShoppingCart,
  Loader2,
  Smartphone,
  Monitor,
  ShoppingBag,
  Palette,
  Code,
  Database,
  Mail,
  Headphones,
  BarChart,
  Zap,
  Settings,
  Lock,
  ExternalLink,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const iconMap = {
  Globe: Globe,
  Server: Server,
  Shield: Shield,
  Layout: LayoutIcon,
  Cloud: Cloud,
  CloudCog: CloudCog,
  Smartphone: Smartphone,
  Monitor: Monitor,
  ShoppingBag: ShoppingBag,
  Palette: Palette,
  Code: Code,
  Database: Database,
  Mail: Mail,
  Headphones: Headphones,
  BarChart: BarChart,
  Zap: Zap,
  Settings: Settings,
  Lock: Lock,
};

const CURRENCY_SYMBOLS = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  INR: "₹",
  AED: "د.إ",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  CHF: "Fr",
};

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [currencyRate, setCurrencyRate] = useState(1);
  const [currencyRates, setCurrencyRates] = useState({ EUR: 1 });
  const [allCurrencies, setAllCurrencies] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", email: "" });

  // Fetch visitor's currency from geo-detection API
  useEffect(() => {
    const fetchGeoCurrency = async () => {
      try {
        const res = await fetch(`${API_URL}/api/geo/currency`);
        if (res.ok) {
          const data = await res.json();
          setCurrency(data.currency || "USD");
          setCurrencySymbol(data.currency_symbol || "$");
          setCurrencyRate(data.currency_rate || 1);
          setAllCurrencies(data.all_currencies || Object.keys(CURRENCY_SYMBOLS));
        }
      } catch (err) {
        console.error("Failed to fetch geo currency:", err);
        // Fallback to USD
        setCurrency("USD");
        setCurrencySymbol("$");
      }
    };
    fetchGeoCurrency();
  }, []);

  // Fetch currency rates for manual currency switching
  useEffect(() => {
    fetch(`${API_URL}/api/admin/currency/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.rates) setCurrencyRates(data.rates);
        if (data.symbols) {
          // Update symbol when currency changes manually
        }
      })
      .catch(console.error);
  }, []);

  // Fetch products
  useEffect(() => {
    fetch(`${API_URL}/api/products?active_only=true`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Handle manual currency change
  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    setCurrencySymbol(CURRENCY_SYMBOLS[newCurrency] || newCurrency);
    const rate = currencyRates[newCurrency] || 1;
    setCurrencyRate(rate);
  };

  // Convert price from product's native currency to display currency
  const convertPrice = (basePrice, productCurrency = "EUR") => {
    if (!basePrice) return null;
    
    const price = parseFloat(basePrice);
    
    // If product currency matches display currency, no conversion needed
    if (productCurrency === currency) {
      return price.toFixed(2);
    }
    
    // Convert from product currency to EUR (base), then to display currency
    const productToEurRate = currencyRates[productCurrency] || 1;
    const priceInEur = price / productToEurRate;
    const displayRate = currencyRates[currency] || 1;
    
    return (priceInEur * displayRate).toFixed(2);
  };

  const handleBuyClick = (product) => {
    if (!product.price) {
      // Redirect to contact for custom pricing
      window.location.href = "/contact";
      return;
    }
    setSelectedProduct(product);
    setCheckoutOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedProduct) return;

    setCheckoutLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/checkout/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.product_id,
          origin_url: window.location.origin,
          customer_email: customerInfo.email || null,
          customer_name: customerInfo.name || null,
          currency: currency,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create checkout");
      }

      const data = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to initiate checkout. Please try again.");
      setCheckoutLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-violet-subtle" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                Our Products
              </span>
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-6">
                Everything You Need to
                <br />
                <span className="text-gradient">Build Online</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                From domain registration to cloud hosting, we provide all the tools 
                and services you need to establish your online presence.
              </p>
              
              {/* Currency Selector */}
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-muted-foreground">Currency:</span>
                <Select value={currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="w-32" data-testid="currency-selector">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(allCurrencies.length > 0 ? allCurrencies : Object.keys(CURRENCY_SYMBOLS)).map((curr) => (
                      <SelectItem key={curr} value={curr}>
                        {CURRENCY_SYMBOLS[curr] || curr} {curr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 rounded-2xl h-96" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, index) => {
                const IconComponent = iconMap[product.icon] || Globe;
                const displayPrice = convertPrice(product.price);
                return (
                  <motion.div
                    key={product.product_id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      className={`p-8 rounded-2xl bg-white h-full relative ${
                        product.is_popular
                          ? "border-2 border-primary shadow-xl shadow-primary/10"
                          : "border border-slate-100 hover:border-primary/20"
                      } hover:shadow-xl transition-all`}
                    >
                      {product.is_popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-medium">
                          Most Popular
                        </span>
                      )}
                      <CardContent className="p-0 space-y-6">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <IconComponent className="text-primary" size={28} />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-xl text-foreground mb-2">
                            {product.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {product.short_description}
                          </p>
                        </div>

                        {displayPrice ? (
                          <div className="py-4 border-y border-slate-100">
                            <span className="font-heading font-bold text-4xl text-foreground">
                              {currencySymbol}{displayPrice}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {product.price_unit ? `/${product.price_unit}` : ""}
                            </span>
                            {product.pricing_type === "subscription" && (
                              <span className="block text-xs text-primary mt-1">
                                {product.billing_period === "yearly" ? "Billed annually" : "Billed monthly"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="py-4 border-y border-slate-100">
                            <span className="font-heading font-semibold text-xl text-muted-foreground">
                              Contact for Pricing
                            </span>
                          </div>
                        )}

                        {product.features && product.features.length > 0 && (
                          <ul className="space-y-3">
                            {product.features.map((feature, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <CheckCircle2
                                  className="text-primary flex-shrink-0 mt-0.5"
                                  size={16}
                                />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Product CTA - External link or Buy Now */}
                        {product.external_url ? (
                          <Button
                            asChild
                            className={`w-full rounded-full ${
                              product.is_popular
                                ? "bg-primary text-white"
                                : ""
                            }`}
                            variant={product.is_popular ? "default" : "outline"}
                            data-testid={`product-link-${product.slug}`}
                          >
                            <a 
                              href={product.external_url}
                              target={product.open_in_new_tab ? "_blank" : "_self"}
                              rel={product.open_in_new_tab ? "noopener noreferrer" : undefined}
                            >
                              {product.cta_text || "Learn More"}
                              {product.open_in_new_tab && <ExternalLink className="ml-2 h-4 w-4" />}
                            </a>
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleBuyClick(product)}
                            className={`w-full rounded-full ${
                              product.is_popular
                                ? "bg-primary text-white"
                                : ""
                            }`}
                            variant={product.is_popular ? "default" : "outline"}
                            data-testid={`product-buy-${product.slug}`}
                          >
                            {product.price ? (
                              <>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Buy Now
                              </>
                            ) : (
                              product.cta_text || "Get Quote"
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
              Why Choose Our Products?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All our products come with these standard features
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "99.9% Uptime", desc: "Rock-solid reliability guaranteed" },
              { title: "24/7 Support", desc: "Expert help whenever you need it" },
              { title: "Easy Setup", desc: "Get started in minutes" },
              { title: "Secure", desc: "Enterprise-grade security" },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-primary" size={32} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-6">
            Need Help Choosing?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Our team is here to help you find the perfect solution for your needs
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90 rounded-full px-8"
            data-testid="products-contact-cta"
          >
            <Link to="/contact">
              Contact Sales
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription>
              {selectedProduct?.title} - {currencySymbol}{convertPrice(selectedProduct?.price)}
              {selectedProduct?.price_unit ? `/${selectedProduct.price_unit}` : ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="checkout-name">Name (Optional)</Label>
              <Input
                id="checkout-name"
                placeholder="Your name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout-email">Email (Optional)</Label>
              <Input
                id="checkout-email"
                type="email"
                placeholder="your@email.com"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You can also checkout as a guest. You'll be redirected to our secure payment page.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={checkoutLoading} className="flex-1">
              {checkoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Proceed to Pay
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ProductsPage;
