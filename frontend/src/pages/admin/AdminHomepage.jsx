import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Plus, Trash2, GripVertical, Eye, Palette, Layout, BookOpen, ShoppingBag, BarChart3, Image, ArrowUp, ArrowDown } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const colorOptions = [
  { value: "violet", label: "Violet", preview: "bg-violet-600" },
  { value: "blue", label: "Blue", preview: "bg-blue-600" },
  { value: "teal", label: "Teal", preview: "bg-teal-600" },
  { value: "pink", label: "Pink", preview: "bg-pink-600" },
  { value: "orange", label: "Orange", preview: "bg-orange-600" },
];

const sectionLabels = {
  services: "Services Section",
  products: "Products Section",
  blog: "Blog Section",
  portfolio: "Portfolio Section",
  testimonials: "Testimonials Section",
  cta: "Call to Action Section",
};

const AdminHomepage = () => {
  const [settings, setSettings] = useState(null);
  const [heroVariants, setHeroVariants] = useState([]);
  const [colorSchemes, setColorSchemes] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [featuredBlog, setFeaturedBlog] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [featuredPortfolio, setFeaturedPortfolio] = useState([]);
  const [promotedSections, setPromotedSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, heroRes, colorRes, blogRes, productsRes, servicesRes, portfolioRes, featuredRes, promotedRes] = await Promise.all([
        fetch(`${API_URL}/api/homepage/settings`, { credentials: "include" }),
        fetch(`${API_URL}/api/homepage/hero-variants`, { credentials: "include" }),
        fetch(`${API_URL}/api/homepage/color-schemes`, { credentials: "include" }),
        fetch(`${API_URL}/api/blog?published_only=true`, { credentials: "include" }),
        fetch(`${API_URL}/api/products?active_only=true`, { credentials: "include" }),
        fetch(`${API_URL}/api/services?active_only=true`, { credentials: "include" }),
        fetch(`${API_URL}/api/portfolio?active_only=true`, { credentials: "include" }),
        fetch(`${API_URL}/api/homepage/featured-items`, { credentials: "include" }),
        fetch(`${API_URL}/api/homepage/promoted-sections`, { credentials: "include" }),
      ]);

      const [settingsData, heroData, colorData, blogData, productsData, servicesData, portfolioData, featuredData, promotedData] = await Promise.all([
        settingsRes.json(),
        heroRes.json(),
        colorRes.json(),
        blogRes.json(),
        productsRes.json(),
        servicesRes.json(),
        portfolioRes.json(),
        featuredRes.json(),
        promotedRes.ok ? promotedRes.json() : [],
      ]);

      // Ensure section_order exists
      if (!settingsData.section_order) {
        settingsData.section_order = ["services", "products", "blog", "portfolio", "testimonials", "cta"];
      }

      setSettings(settingsData);
      setHeroVariants(heroData);
      setColorSchemes(colorData);
      setBlogPosts(blogData);
      setProducts(productsData);
      setServices(servicesData);
      setPortfolioItems(portfolioData);
      setPromotedSections(Array.isArray(promotedData) ? promotedData : []);
      
      setFeaturedBlog(featuredData.filter(f => f.item_type === "blog").map(f => f.item_id));
      setFeaturedProducts(featuredData.filter(f => f.item_type === "product").map(f => f.item_id));
      setFeaturedServices(featuredData.filter(f => f.item_type === "service").map(f => f.item_id));
      setFeaturedPortfolio(featuredData.filter(f => f.item_type === "portfolio").map(f => f.item_id));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load homepage settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/homepage/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      toast.success("Settings saved!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const saveHeroVariant = async (variant) => {
    try {
      if (variant.variant_id && !variant.variant_id.startsWith("new_")) {
        await fetch(`${API_URL}/api/homepage/hero-variants/${variant.variant_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(variant),
        });
      } else {
        const { variant_id, ...newVariant } = variant;
        await fetch(`${API_URL}/api/homepage/hero-variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(newVariant),
        });
      }
      toast.success("Hero variant saved!");
      fetchData();
    } catch (error) {
      toast.error("Failed to save hero variant");
    }
  };

  const deleteHeroVariant = async (variantId) => {
    if (!confirm("Delete this hero variant?")) return;
    try {
      await fetch(`${API_URL}/api/homepage/hero-variants/${variantId}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast.success("Hero variant deleted!");
      setHeroVariants(heroVariants.filter(v => v.variant_id !== variantId));
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const addNewHeroVariant = () => {
    setHeroVariants([...heroVariants, {
      variant_id: `new_${Date.now()}`,
      badge_text: "Digital Excellence for Modern Business",
      title_line1: "Your AI-Powered",
      title_line2: "Growing Partner",
      subtitle: "From small business websites to enterprise-grade systems - we build solutions that scale your business",
      primary_cta_text: "Get Started",
      primary_cta_link: "/contact",
      primary_cta_new_tab: false,
      secondary_cta_text: "View Services",
      secondary_cta_link: "/services",
      secondary_cta_new_tab: false,
      hero_image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      accent_color: "violet",
      is_active: true,
      order: heroVariants.length,
    }]);
  };

  const moveHeroVariant = async (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= heroVariants.length) return;
    
    const updated = [...heroVariants];
    const temp = updated[index];
    updated[index] = { ...updated[newIndex], order: index };
    updated[newIndex] = { ...temp, order: newIndex };
    setHeroVariants(updated);
    
    // Save both variants with new order
    try {
      await Promise.all([
        saveHeroVariant(updated[index]),
        saveHeroVariant(updated[newIndex]),
      ]);
    } catch (error) {
      toast.error("Failed to reorder");
    }
  };

  const updateHeroVariant = (index, field, value) => {
    const updated = [...heroVariants];
    updated[index] = { ...updated[index], [field]: value };
    setHeroVariants(updated);
  };

  const toggleColorScheme = async (schemeId, isActive) => {
    try {
      await fetch(`${API_URL}/api/homepage/color-schemes/${schemeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: isActive }),
      });
      setColorSchemes(colorSchemes.map(s => 
        s.scheme_id === schemeId ? { ...s, is_active: isActive } : s
      ));
    } catch (error) {
      toast.error("Failed to update color scheme");
    }
  };

  const saveFeaturedItems = async () => {
    setSaving(true);
    try {
      const items = [
        ...featuredBlog.map((id, i) => ({ item_type: "blog", item_id: id, order: i })),
        ...featuredProducts.map((id, i) => ({ item_type: "product", item_id: id, order: i })),
        ...featuredServices.map((id, i) => ({ item_type: "service", item_id: id, order: i })),
        ...featuredPortfolio.map((id, i) => ({ item_type: "portfolio", item_id: id, order: i })),
      ];
      await fetch(`${API_URL}/api/homepage/featured-items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(items),
      });
      toast.success("Featured items saved!");
    } catch (error) {
      toast.error("Failed to save featured items");
    } finally {
      setSaving(false);
    }
  };

  const toggleFeaturedBlog = (postId) => {
    if (featuredBlog.includes(postId)) {
      setFeaturedBlog(featuredBlog.filter(id => id !== postId));
    } else if (featuredBlog.length < (settings?.featured_blog_count || 3)) {
      setFeaturedBlog([...featuredBlog, postId]);
    } else {
      toast.error(`Maximum ${settings?.featured_blog_count || 3} blog posts can be featured`);
    }
  };

  const toggleFeaturedProduct = (productId) => {
    if (featuredProducts.includes(productId)) {
      setFeaturedProducts(featuredProducts.filter(id => id !== productId));
    } else if (featuredProducts.length < (settings?.featured_products_count || 3)) {
      setFeaturedProducts([...featuredProducts, productId]);
    } else {
      toast.error(`Maximum ${settings?.featured_products_count || 3} products can be featured`);
    }
  };

  const toggleFeaturedService = (serviceId) => {
    if (featuredServices.includes(serviceId)) {
      setFeaturedServices(featuredServices.filter(id => id !== serviceId));
    } else if (featuredServices.length < (settings?.featured_services_count || 6)) {
      setFeaturedServices([...featuredServices, serviceId]);
    } else {
      toast.error(`Maximum ${settings?.featured_services_count || 6} services can be featured`);
    }
  };

  const toggleFeaturedPortfolio = (portfolioId) => {
    if (featuredPortfolio.includes(portfolioId)) {
      setFeaturedPortfolio(featuredPortfolio.filter(id => id !== portfolioId));
    } else if (featuredPortfolio.length < (settings?.featured_portfolio_count || 6)) {
      setFeaturedPortfolio([...featuredPortfolio, portfolioId]);
    } else {
      toast.error(`Maximum ${settings?.featured_portfolio_count || 6} portfolio items can be featured`);
    }
  };

  const updateStat = (index, field, value) => {
    const newStats = [...(settings?.stats || [])];
    newStats[index] = { ...newStats[index], [field]: value };
    setSettings({ ...settings, stats: newStats });
  };

  // Section ordering
  const moveSectionUp = (index) => {
    if (index === 0) return;
    const newOrder = [...(settings?.section_order || [])];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setSettings({ ...settings, section_order: newOrder });
  };

  const moveSectionDown = (index) => {
    const order = settings?.section_order || [];
    if (index === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setSettings({ ...settings, section_order: newOrder });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-slate-200 h-48 rounded-lg" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">Homepage Manager</h1>
            <p className="text-muted-foreground">Customize your homepage content and appearance</p>
          </div>
          <Button onClick={saveSettings} disabled={saving} className="rounded-full" data-testid="save-homepage-settings">
            <Save className="mr-2" size={18} />
            {saving ? "Saving..." : "Save All Settings"}
          </Button>
        </div>

        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="hero" className="flex items-center gap-2">
              <Layout size={16} /> Hero
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette size={16} /> Colors
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-2">
              <BookOpen size={16} /> Featured
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 size={16} /> Stats
            </TabsTrigger>
            <TabsTrigger value="sections" className="flex items-center gap-2">
              <Eye size={16} /> Sections
            </TabsTrigger>
            <TabsTrigger value="order" className="flex items-center gap-2">
              <GripVertical size={16} /> Order
            </TabsTrigger>
          </TabsList>

          {/* Hero Variants Tab */}
          <TabsContent value="hero" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section Settings</CardTitle>
                <CardDescription>Configure how hero content (text + image) rotates on your homepage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Hero Rotation</Label>
                    <p className="text-sm text-muted-foreground">Show different hero content (text + image) each time</p>
                  </div>
                  <Switch
                    checked={settings?.enable_hero_rotation}
                    onCheckedChange={(v) => setSettings({ ...settings, enable_hero_rotation: v })}
                    data-testid="hero-rotation-toggle"
                  />
                </div>
                {settings?.enable_hero_rotation && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rotation Type</Label>
                      <select
                        value={settings?.hero_rotation_type || "refresh"}
                        onChange={(e) => setSettings({ ...settings, hero_rotation_type: e.target.value })}
                        className="w-full h-10 rounded-md border px-3"
                      >
                        <option value="refresh">Change on page refresh</option>
                        <option value="auto">Auto-rotate (carousel)</option>
                      </select>
                    </div>
                    {settings?.hero_rotation_type === "auto" && (
                      <div className="space-y-2">
                        <Label>Rotation Interval (seconds)</Label>
                        <Input
                          type="number"
                          min="3"
                          max="30"
                          value={settings?.hero_rotation_interval || 10}
                          onChange={(e) => setSettings({ ...settings, hero_rotation_interval: parseInt(e.target.value) })}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-lg">Hero Variants (Text + Image)</h3>
              <Button onClick={addNewHeroVariant} variant="outline" size="sm">
                <Plus size={16} className="mr-2" /> Add Variant
              </Button>
            </div>

            {heroVariants.map((variant, index) => (
              <Card key={variant.variant_id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => moveHeroVariant(index, "up")}
                          disabled={index === 0}
                          title="Move up"
                        >
                          <ArrowUp size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => moveHeroVariant(index, "down")}
                          disabled={index === heroVariants.length - 1}
                          title="Move down"
                        >
                          <ArrowDown size={14} />
                        </Button>
                      </div>
                      <CardTitle className="text-base">Variant {index + 1}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={variant.is_active}
                        onCheckedChange={(v) => updateHeroVariant(index, "is_active", v)}
                      />
                      <span className="text-sm text-muted-foreground mr-4">
                        {variant.is_active ? "Active" : "Inactive"}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => saveHeroVariant(variant)} data-testid={`save-hero-${index}`}>
                        <Save size={16} />
                      </Button>
                      {heroVariants.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => deleteHeroVariant(variant.variant_id)} className="text-red-500">
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Badge Text</Label>
                      <Input
                        value={variant.badge_text || ""}
                        onChange={(e) => updateHeroVariant(index, "badge_text", e.target.value)}
                        placeholder="Digital Excellence for Modern Business"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <select
                        value={variant.accent_color || "violet"}
                        onChange={(e) => updateHeroVariant(index, "accent_color", e.target.value)}
                        className="w-full h-10 rounded-md border px-3"
                      >
                        {colorOptions.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title Line 1</Label>
                      <Input
                        value={variant.title_line1 || ""}
                        onChange={(e) => updateHeroVariant(index, "title_line1", e.target.value)}
                        placeholder="Your AI-Powered"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title Line 2 (highlighted)</Label>
                      <Input
                        value={variant.title_line2 || ""}
                        onChange={(e) => updateHeroVariant(index, "title_line2", e.target.value)}
                        placeholder="Growing Partner"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Textarea
                      value={variant.subtitle || ""}
                      onChange={(e) => updateHeroVariant(index, "subtitle", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Image size={16} /> Hero Image URL</Label>
                    <Input
                      value={variant.hero_image || ""}
                      onChange={(e) => updateHeroVariant(index, "hero_image", e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                    />
                    {variant.hero_image && (
                      <img src={variant.hero_image} alt="Hero preview" className="w-48 h-32 object-cover rounded mt-2" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary CTA Text</Label>
                      <Input
                        value={variant.primary_cta_text || ""}
                        onChange={(e) => updateHeroVariant(index, "primary_cta_text", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Primary CTA Link</Label>
                      <Input
                        value={variant.primary_cta_link || ""}
                        onChange={(e) => updateHeroVariant(index, "primary_cta_link", e.target.value)}
                      />
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={variant.primary_cta_new_tab || false}
                          onChange={(e) => updateHeroVariant(index, "primary_cta_new_tab", e.target.checked)}
                          className="rounded"
                        />
                        Open in new tab
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Secondary CTA Text</Label>
                      <Input
                        value={variant.secondary_cta_text || ""}
                        onChange={(e) => updateHeroVariant(index, "secondary_cta_text", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary CTA Link</Label>
                      <Input
                        value={variant.secondary_cta_link || ""}
                        onChange={(e) => updateHeroVariant(index, "secondary_cta_link", e.target.value)}
                      />
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={variant.secondary_cta_new_tab || false}
                          onChange={(e) => updateHeroVariant(index, "secondary_cta_new_tab", e.target.checked)}
                          className="rounded"
                        />
                        Open in new tab
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Color Schemes Tab */}
          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Color Accent Settings</CardTitle>
                <CardDescription>Control which accent colors can appear on the homepage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Color Rotation</Label>
                    <p className="text-sm text-muted-foreground">Show different accent colors on page refresh</p>
                  </div>
                  <Switch
                    checked={settings?.enable_color_rotation}
                    onCheckedChange={(v) => setSettings({ ...settings, enable_color_rotation: v })}
                    data-testid="color-rotation-toggle"
                  />
                </div>
              </CardContent>
            </Card>

            <h3 className="font-heading font-semibold text-lg">Available Color Schemes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {colorSchemes.map((scheme) => (
                <Card key={scheme.scheme_id} className={`cursor-pointer transition-all ${scheme.is_active ? "ring-2 ring-primary" : "opacity-60"}`}>
                  <CardContent className="p-4 text-center">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-3 ${colorOptions.find(c => c.value === scheme.name.toLowerCase())?.preview || "bg-violet-600"}`} />
                    <p className="font-medium">{scheme.name}</p>
                    <Switch
                      checked={scheme.is_active}
                      onCheckedChange={(v) => toggleColorScheme(scheme.scheme_id, v)}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Featured Items Tab */}
          <TabsContent value="featured" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Featured Sections Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Show Featured Blog Posts</Label>
                      <Switch
                        checked={settings?.show_blog !== false}
                        onCheckedChange={(v) => setSettings({ ...settings, show_blog: v })}
                      />
                    </div>
                    {settings?.show_blog !== false && (
                      <div className="space-y-2">
                        <Label>Number of posts to show</Label>
                        <Input
                          type="number"
                          min="1"
                          max="6"
                          value={settings?.featured_blog_count || 3}
                          onChange={(e) => setSettings({ ...settings, featured_blog_count: parseInt(e.target.value) })}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Show Featured Products</Label>
                      <Switch
                        checked={settings?.show_featured_products}
                        onCheckedChange={(v) => setSettings({ ...settings, show_featured_products: v })}
                      />
                    </div>
                    {settings?.show_featured_products && (
                      <div className="space-y-2">
                        <Label>Number of products to show</Label>
                        <Input
                          type="number"
                          min="1"
                          max="6"
                          value={settings?.featured_products_count || 3}
                          onChange={(e) => setSettings({ ...settings, featured_products_count: parseInt(e.target.value) })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {settings?.show_blog !== false && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen size={20} /> Select Featured Blog Posts
                  </CardTitle>
                  <CardDescription>
                    Selected: {featuredBlog.length} / {settings?.featured_blog_count || 3}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {blogPosts.map((post) => (
                      <div
                        key={post.post_id}
                        onClick={() => toggleFeaturedBlog(post.post_id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          featuredBlog.includes(post.post_id) ? "border-primary bg-primary/5" : "hover:border-primary/50"
                        }`}
                      >
                        {post.featured_image && (
                          <img src={post.featured_image} alt={post.title} className="w-full h-24 object-cover rounded mb-2" />
                        )}
                        <p className="font-medium text-sm line-clamp-2">{post.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{post.category}</p>
                      </div>
                    ))}
                  </div>
                  <Button onClick={saveFeaturedItems} className="mt-4" disabled={saving}>
                    <Save size={16} className="mr-2" /> Save Featured Items
                  </Button>
                </CardContent>
              </Card>
            )}

            {settings?.show_featured_products && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag size={20} /> Select Featured Products
                  </CardTitle>
                  <CardDescription>
                    Selected: {featuredProducts.length} / {settings?.featured_products_count || 3}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div
                        key={product.product_id}
                        onClick={() => toggleFeaturedProduct(product.product_id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          featuredProducts.includes(product.product_id) ? "border-primary bg-primary/5" : "hover:border-primary/50"
                        }`}
                      >
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-muted-foreground">{product.short_description}</p>
                        {product.price && (
                          <p className="text-primary font-semibold mt-2">€{product.price}/{product.price_unit}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button onClick={saveFeaturedItems} className="mt-4" disabled={saving}>
                    <Save size={16} className="mr-2" /> Save Featured Items
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Featured Services Selector */}
            {settings?.show_services !== false && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout size={20} /> Select Featured Services
                  </CardTitle>
                  <CardDescription>
                    Selected: {featuredServices.length} / {settings?.featured_services_count || 6}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => (
                      <div
                        key={service.service_id}
                        onClick={() => toggleFeaturedService(service.service_id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          featuredServices.includes(service.service_id) ? "border-primary bg-primary/5" : "hover:border-primary/50"
                        }`}
                      >
                        {service.icon && <span className="text-2xl mb-2 block">{service.icon}</span>}
                        <p className="font-medium">{service.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{service.short_description}</p>
                      </div>
                    ))}
                  </div>
                  {services.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No services found. Add services first.</p>
                  )}
                  <Button onClick={saveFeaturedItems} className="mt-4" disabled={saving}>
                    <Save size={16} className="mr-2" /> Save Featured Items
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Featured Portfolio Selector */}
            {settings?.show_portfolio !== false && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image size={20} /> Select Featured Portfolio
                  </CardTitle>
                  <CardDescription>
                    Selected: {featuredPortfolio.length} / {settings?.featured_portfolio_count || 6}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portfolioItems.map((item) => (
                      <div
                        key={item.portfolio_id}
                        onClick={() => toggleFeaturedPortfolio(item.portfolio_id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          featuredPortfolio.includes(item.portfolio_id) ? "border-primary bg-primary/5" : "hover:border-primary/50"
                        }`}
                      >
                        {item.image_url && (
                          <img src={item.image_url} alt={item.title} className="w-full h-24 object-cover rounded mb-2" />
                        )}
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    ))}
                  </div>
                  {portfolioItems.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No portfolio items found. Add portfolio items first.</p>
                  )}
                  <Button onClick={saveFeaturedItems} className="mt-4" disabled={saving}>
                    <Save size={16} className="mr-2" /> Save Featured Items
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistics Section</CardTitle>
                <CardDescription>Display impressive numbers in the hero section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Label>Show Stats Section</Label>
                  <Switch
                    checked={settings?.show_stats}
                    onCheckedChange={(v) => setSettings({ ...settings, show_stats: v })}
                  />
                </div>
                {settings?.show_stats && (
                  <div className="grid grid-cols-2 gap-4">
                    {(settings?.stats || []).map((stat, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={stat.value}
                          onChange={(e) => updateStat(index, "value", e.target.value)}
                          placeholder="500+"
                          className="w-24"
                        />
                        <Input
                          value={stat.label}
                          onChange={(e) => updateStat(index, "label", e.target.value)}
                          placeholder="Projects Completed"
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sections Visibility Tab */}
          <TabsContent value="sections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section Visibility</CardTitle>
                <CardDescription>Control which sections appear on the homepage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "show_services", label: "Services Section", desc: "Display your services" },
                  { key: "show_products", label: "Products Section", desc: "Display your products" },
                  { key: "show_blog", label: "Blog Section", desc: "Display featured blog posts" },
                  { key: "show_portfolio", label: "Portfolio Section", desc: "Display featured projects" },
                  { key: "show_testimonials", label: "Testimonials Section", desc: "Display client reviews" },
                  { key: "show_cta", label: "Call to Action Section", desc: "Display bottom CTA banner" },
                ].map((section) => (
                  <div key={section.key} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <Label>{section.label}</Label>
                      <p className="text-sm text-muted-foreground">{section.desc}</p>
                    </div>
                    <Switch
                      checked={settings?.[section.key] !== false}
                      onCheckedChange={(v) => setSettings({ ...settings, [section.key]: v })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section Order Tab */}
          <TabsContent value="order" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section Order</CardTitle>
                <CardDescription>Drag and drop to reorder sections on the homepage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(settings?.section_order || []).map((sectionId, index) => (
                  <div
                    key={sectionId}
                    className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="text-muted-foreground" size={20} />
                      <span className="font-medium">{sectionLabels[sectionId] || sectionId}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSectionUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSectionDown(index)}
                        disabled={index === (settings?.section_order?.length || 0) - 1}
                      >
                        <ArrowDown size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                <p className="text-sm text-muted-foreground mt-4">
                  Use the arrows to reorder sections, then click "Save All Settings" to apply changes.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminHomepage;
