import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Briefcase,
  Image,
  ShoppingCart,
  Utensils,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  Globe,
  Code,
  Server,
  Download,
  CreditCard,
  Plus,
  Trash2,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const iconMap = {
  Briefcase: Briefcase,
  Image: Image,
  ShoppingCart: ShoppingCart,
  Utensils: Utensils,
  Rocket: Rocket,
  Globe: Globe,
  Code: Code,
  Server: Server,
};

const BuilderPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  
  // Form state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [selectedPages, setSelectedPages] = useState(["home", "about", "services", "contact"]);
  const [selectedTier, setSelectedTier] = useState("basic");
  const [hostingOption, setHostingOption] = useState("download");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  
  // Portfolio specific
  const [portfolioImages, setPortfolioImages] = useState([""]);
  const [portfolioVideos, setPortfolioVideos] = useState([""]);
  
  // E-commerce specific
  const [products, setProducts] = useState([{ name: "", price: "", description: "" }]);
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/builder/categories`).then(r => r.json()),
      fetch(`${API_URL}/api/builder/pricing`).then(r => r.json())
    ]).then(([cats, prices]) => {
      setCategories(cats);
      setPricing(prices);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const availablePages = [
    { id: "home", name: "Home", required: true },
    { id: "about", name: "About Us" },
    { id: "services", name: "Services" },
    { id: "products", name: "Products" },
    { id: "portfolio", name: "Portfolio" },
    { id: "gallery", name: "Gallery" },
    { id: "blog", name: "Blog" },
    { id: "contact", name: "Contact" },
    { id: "faq", name: "FAQ" },
    { id: "testimonials", name: "Testimonials" },
  ];

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // Set default pages based on category
    if (category.template_type === "portfolio") {
      setSelectedPages(["home", "portfolio", "about", "contact"]);
    } else if (category.template_type === "ecommerce") {
      setSelectedPages(["home", "products", "about", "contact"]);
    } else {
      setSelectedPages(["home", "about", "services", "contact"]);
    }
    setStep(2);
  };

  const handleGenerate = async () => {
    if (!businessName.trim()) {
      toast.error("Please enter your business name");
      return;
    }
    
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/builder/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory.slug,
          business_name: businessName,
          business_description: businessDescription,
          pages: selectedPages,
          template_type: selectedCategory.template_type,
          portfolio_images: portfolioImages.filter(img => img.trim()),
          portfolio_videos: portfolioVideos.filter(vid => vid.trim()),
          products: products.filter(p => p.name.trim()),
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setPreviewContent(data.content);
        setStep(3);
      } else {
        toast.error("Failed to generate website. Please try again.");
      }
    } catch (error) {
      toast.error("Generation failed. Please try again.");
    }
    setGenerating(false);
  };

  const handleCheckout = async () => {
    if (!customerEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    
    const tier = pricing.find(p => p.tier === selectedTier);
    
    setCheckoutLoading(true);
    try {
      // Create order first
      const orderResponse = await fetch(`${API_URL}/api/builder/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_email: customerEmail,
          customer_name: customerName,
          category: selectedCategory.slug,
          tier: selectedTier,
          business_name: businessName,
          business_description: businessDescription,
          pages: selectedPages,
          portfolio_images: portfolioImages.filter(img => img.trim()),
          portfolio_videos: portfolioVideos.filter(vid => vid.trim()),
          products: products.filter(p => p.name.trim()),
          generated_content: previewContent,
          hosting_option: hostingOption,
          amount: tier?.price || 99,
          currency: tier?.currency || "EUR"
        })
      });
      
      const orderData = await orderResponse.json();
      
      // Create checkout session
      const checkoutResponse = await fetch(`${API_URL}/api/builder/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderData.order_id,
          origin_url: window.location.origin
        })
      });
      
      const checkoutData = await checkoutResponse.json();
      window.location.href = checkoutData.checkout_url;
      
    } catch (error) {
      toast.error("Checkout failed. Please try again.");
      setCheckoutLoading(false);
    }
  };

  const addPortfolioImage = () => setPortfolioImages([...portfolioImages, ""]);
  const addPortfolioVideo = () => setPortfolioVideos([...portfolioVideos, ""]);
  const addProduct = () => setProducts([...products, { name: "", price: "", description: "" }]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 gradient-violet-subtle" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                AI-Powered Website Builder
              </span>
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4">
                Build Your Website in Minutes
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose a category, describe your business, and let AI create a stunning website for you.
              </p>
            </motion.div>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s ? "bg-primary text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {step > s ? <Check className="w-5 h-5" /> : s}
                  </div>
                  {s < 4 && (
                    <div className={`w-16 h-1 ${step > s ? "bg-primary" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Category Selection */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {categories.map((category) => {
                const IconComponent = iconMap[category.icon] || Briefcase;
                return (
                  <Card
                    key={category.category_id}
                    className="cursor-pointer hover:border-primary hover:shadow-lg transition-all"
                    onClick={() => handleCategorySelect(category)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-heading font-bold text-xl mb-2">{category.name}</h3>
                      <p className="text-muted-foreground text-sm">{category.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </motion.div>
          )}

          {/* Step 2: Business Details */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Tell Us About Your Business</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g., Acme Solutions"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessDescription">Business Description</Label>
                    <Textarea
                      id="businessDescription"
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      placeholder="Describe what your business does, your services, target audience..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Select Pages (max 5 for Basic)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availablePages.map((page) => (
                        <label key={page.id} className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={selectedPages.includes(page.id)}
                            disabled={page.required}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPages([...selectedPages, page.id]);
                              } else {
                                setSelectedPages(selectedPages.filter(p => p !== page.id));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{page.name}</span>
                          {page.required && <span className="text-xs text-muted-foreground">(Required)</span>}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Portfolio specific fields */}
                  {selectedCategory?.template_type === "portfolio" && (
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold">Portfolio Images (URLs)</h4>
                      {portfolioImages.map((img, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            value={img}
                            onChange={(e) => {
                              const newImages = [...portfolioImages];
                              newImages[idx] = e.target.value;
                              setPortfolioImages(newImages);
                            }}
                            placeholder="https://example.com/image.jpg"
                          />
                          {idx > 0 && (
                            <Button variant="outline" size="icon" onClick={() => setPortfolioImages(portfolioImages.filter((_, i) => i !== idx))}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addPortfolioImage}>
                        <Plus className="w-4 h-4 mr-2" /> Add Image URL
                      </Button>
                      
                      <h4 className="font-semibold mt-4">Portfolio Videos (URLs)</h4>
                      {portfolioVideos.map((vid, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            value={vid}
                            onChange={(e) => {
                              const newVideos = [...portfolioVideos];
                              newVideos[idx] = e.target.value;
                              setPortfolioVideos(newVideos);
                            }}
                            placeholder="https://youtube.com/watch?v=..."
                          />
                          {idx > 0 && (
                            <Button variant="outline" size="icon" onClick={() => setPortfolioVideos(portfolioVideos.filter((_, i) => i !== idx))}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addPortfolioVideo}>
                        <Plus className="w-4 h-4 mr-2" /> Add Video URL
                      </Button>
                    </div>
                  )}

                  {/* E-commerce specific fields */}
                  {selectedCategory?.template_type === "ecommerce" && (
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold">Products</h4>
                      {products.map((product, idx) => (
                        <div key={idx} className="grid grid-cols-3 gap-2">
                          <Input
                            value={product.name}
                            onChange={(e) => {
                              const newProducts = [...products];
                              newProducts[idx].name = e.target.value;
                              setProducts(newProducts);
                            }}
                            placeholder="Product name"
                          />
                          <Input
                            value={product.price}
                            onChange={(e) => {
                              const newProducts = [...products];
                              newProducts[idx].price = e.target.value;
                              setProducts(newProducts);
                            }}
                            placeholder="Price"
                          />
                          <div className="flex gap-2">
                            <Input
                              value={product.description}
                              onChange={(e) => {
                                const newProducts = [...products];
                                newProducts[idx].description = e.target.value;
                                setProducts(newProducts);
                              }}
                              placeholder="Description"
                            />
                            {idx > 0 && (
                              <Button variant="outline" size="icon" onClick={() => setProducts(products.filter((_, i) => i !== idx))}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addProduct}>
                        <Plus className="w-4 h-4 mr-2" /> Add Product
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={handleGenerate} disabled={generating} className="flex-1">
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Website
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && previewContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    Your Website is Ready!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Preview */}
                  <div className="bg-slate-100 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Preview</h3>
                    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold" style={{ color: previewContent.colors?.primary || "#7c3aed" }}>
                          {businessName}
                        </h1>
                        <p className="text-muted-foreground">
                          {previewContent.pages?.home?.hero_subtitle || previewContent.meta?.description || "Your professional website"}
                        </p>
                      </div>
                      <div className="flex justify-center gap-4 border-t pt-4">
                        {selectedPages.map(page => (
                          <span key={page} className="text-sm text-primary capitalize">{page}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SEO Info */}
                  {previewContent.meta && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">SEO Optimized</h4>
                      <p className="text-sm text-green-700">Title: {previewContent.meta.title}</p>
                      <p className="text-sm text-green-700">Description: {previewContent.meta.description}</p>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Edit Details
                    </Button>
                    <Button onClick={() => setStep(4)} className="flex-1">
                      Continue to Pricing
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Pricing & Checkout */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {pricing.map((tier) => (
                  <Card
                    key={tier.tier}
                    className={`cursor-pointer transition-all ${
                      selectedTier === tier.tier
                        ? "border-2 border-primary shadow-lg"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedTier(tier.tier)}
                  >
                    <CardContent className="p-6 text-center">
                      <h3 className="font-heading font-bold text-xl mb-2">{tier.name}</h3>
                      <div className="mb-4">
                        <span className="text-4xl font-bold">€{tier.price}</span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {selectedTier === tier.tier && (
                        <div className="bg-primary text-white rounded-full py-1 px-4 text-sm">
                          Selected
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Complete Your Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Email *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Name</Label>
                      <Input
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery Option</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer ${
                          hostingOption === "download" ? "border-primary bg-violet-50" : "border-slate-200"
                        }`}
                        onClick={() => setHostingOption("download")}
                      >
                        <Download className="w-6 h-6 mb-2 text-primary" />
                        <h4 className="font-semibold">Download Code</h4>
                        <p className="text-sm text-muted-foreground">Get HTML/CSS files to host anywhere</p>
                      </div>
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer ${
                          hostingOption === "auto" ? "border-primary bg-violet-50" : "border-slate-200"
                        }`}
                        onClick={() => setHostingOption("auto")}
                      >
                        <Server className="w-6 h-6 mb-2 text-primary" />
                        <h4 className="font-semibold">We Host It</h4>
                        <p className="text-sm text-muted-foreground">We'll set it up and send you credentials</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => setStep(3)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={handleCheckout} disabled={checkoutLoading} className="flex-1">
                      {checkoutLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay €{pricing.find(p => p.tier === selectedTier)?.price || 99}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default BuilderPage;
