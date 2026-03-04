import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, Star } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CURRENCY_SYMBOLS = { EUR: "\u20ac", USD: "$", GBP: "\u00a3", INR: "\u20b9", AED: "\u062f.\u0625", AUD: "A$", CAD: "C$", SGD: "S$", CHF: "CHF" };
const CURRENCY_OPTIONS = Object.keys(CURRENCY_SYMBOLS);

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: "", slug: "", short_description: "", description: "", icon: "Globe",
    price: "", price_unit: "per month", currency: "EUR", features: "", is_popular: false,
    cta_text: "Get Started", cta_link: "", order: 0, is_active: true,
  });

  const fetchProducts = () => {
    fetch(`${API_URL}/api/products`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev, [name]: value,
      ...(name === "title" && !editingProduct
        ? { slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const features = formData.features.split("\n").filter((f) => f.trim());
    try {
      const body = { ...formData, features };
      const url = editingProduct ? `${API_URL}/api/products/${editingProduct.product_id}` : `${API_URL}/api/products`;
      const response = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(body),
      });
      if (response.ok) {
        toast.success(editingProduct ? "Product updated!" : "Product created!");
        setDialogOpen(false); resetForm(); fetchProducts();
      } else throw new Error("Failed");
    } catch { toast.error("Failed to save product"); }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title, slug: product.slug, short_description: product.short_description,
      description: product.description, icon: product.icon, price: product.price || "",
      price_unit: product.price_unit || "month", pricing_type: product.pricing_type || "one_time",
      billing_period: product.billing_period || "", currency: product.currency || "EUR",
      features: product.features?.join("\n") || "",
      is_popular: product.is_popular, cta_text: product.cta_text, cta_link: product.cta_link || "",
      order: product.order, is_active: product.is_active, is_purchasable: product.is_purchasable !== false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await fetch(`${API_URL}/api/products/${productId}`, { method: "DELETE", credentials: "include" });
      toast.success("Product deleted!"); fetchProducts();
    } catch { toast.error("Failed to delete"); }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      title: "", slug: "", short_description: "", description: "", icon: "Globe",
      price: "", price_unit: "month", pricing_type: "one_time", billing_period: "",
      currency: "EUR", features: "", is_popular: false, cta_text: "Get Started", cta_link: "", 
      order: 0, is_active: true, is_purchasable: true,
    });
  };

  const iconOptions = [
    // General
    { value: "Globe", label: "🌐 Globe - Domain/Web" },
    { value: "Server", label: "🖥️ Server - Hosting" },
    { value: "Shield", label: "🛡️ Shield - SSL/Security" },
    { value: "Cloud", label: "☁️ Cloud - Cloud Services" },
    { value: "CloudCog", label: "⚙️ CloudCog - Cloud Config" },
    { value: "Database", label: "🗄️ Database" },
    { value: "Lock", label: "🔒 Lock - Security" },
    // Design & Development
    { value: "Monitor", label: "🖥️ Monitor - Web Design" },
    { value: "Smartphone", label: "📱 Smartphone - Mobile App" },
    { value: "Palette", label: "🎨 Palette - Design" },
    { value: "Code", label: "💻 Code - Development" },
    { value: "Layout", label: "📐 Layout - UI/UX" },
    // E-commerce & Business
    { value: "ShoppingBag", label: "🛍️ ShoppingBag - E-commerce" },
    { value: "BarChart", label: "📊 BarChart - Analytics" },
    { value: "Mail", label: "📧 Mail - Email" },
    { value: "Headphones", label: "🎧 Headphones - Support" },
    { value: "Zap", label: "⚡ Zap - Performance" },
    { value: "Settings", label: "⚙️ Settings - Config" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">Products</h1>
            <p className="text-muted-foreground">Manage your products</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="rounded-full" data-testid="add-product-btn"><Plus className="mr-2" size={18} /> Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="title">Title *</Label><Input id="title" name="title" value={formData.title} onChange={handleChange} required data-testid="product-title" /></div>
                  <div className="space-y-2"><Label htmlFor="slug">Slug *</Label><Input id="slug" name="slug" value={formData.slug} onChange={handleChange} required data-testid="product-slug" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="short_description">Short Description *</Label><Input id="short_description" name="short_description" value={formData.short_description} onChange={handleChange} required /></div>
                <div className="space-y-2"><Label htmlFor="description">Full Description *</Label><Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} required /></div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2"><Label htmlFor="price">Price</Label><Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} placeholder="9.99" /></div>
                  <div className="space-y-2"><Label htmlFor="currency">Currency</Label>
                    <select id="currency" name="currency" value={formData.currency} onChange={handleChange} className="w-full h-10 rounded-md border px-3">
                      {CURRENCY_OPTIONS.map((c) => (<option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>))}
                    </select>
                  </div>
                  <div className="space-y-2"><Label htmlFor="price_unit">Price Unit</Label><Input id="price_unit" name="price_unit" value={formData.price_unit} onChange={handleChange} placeholder="month, year, one-time" /></div>
                  <div className="space-y-2"><Label htmlFor="pricing_type">Pricing Type</Label>
                    <select id="pricing_type" name="pricing_type" value={formData.pricing_type} onChange={handleChange} className="w-full h-10 rounded-md border px-3">
                      <option value="one_time">One-time</option>
                      <option value="subscription">Subscription</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {formData.pricing_type === "subscription" && (
                    <div className="space-y-2"><Label htmlFor="billing_period">Billing Period</Label>
                      <select id="billing_period" name="billing_period" value={formData.billing_period} onChange={handleChange} className="w-full h-10 rounded-md border px-3">
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  )}
                  <div className="space-y-2"><Label htmlFor="icon">Icon</Label>
                    <select id="icon" name="icon" value={formData.icon} onChange={handleChange} className="w-full h-10 rounded-md border px-3">{iconOptions.map((i) => (<option key={i.value} value={i.value}>{i.label}</option>))}</select>
                  </div>
                </div>
                <div className="space-y-2"><Label htmlFor="features">Features (one per line)</Label><Textarea id="features" name="features" value={formData.features} onChange={handleChange} rows={4} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="cta_text">CTA Text</Label><Input id="cta_text" name="cta_text" value={formData.cta_text} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label htmlFor="order">Order</Label><Input id="order" name="order" type="number" value={formData.order} onChange={handleChange} /></div>
                </div>
                {/* External Link Section */}
                <div className="border rounded-lg p-4 space-y-4 bg-slate-50">
                  <h4 className="font-medium text-sm text-foreground">External Link (Optional)</h4>
                  <p className="text-xs text-muted-foreground">Add an external URL to redirect users instead of the checkout flow</p>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="external_url">External URL</Label>
                      <Input id="external_url" name="external_url" value={formData.external_url || ""} onChange={handleChange} placeholder="https://your-external-site.com/product" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="open_in_new_tab" checked={formData.open_in_new_tab || false} onCheckedChange={(c) => setFormData((p) => ({ ...p, open_in_new_tab: c }))} />
                    <Label htmlFor="open_in_new_tab" className="text-sm">Open in new tab</Label>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2"><Switch id="is_popular" checked={formData.is_popular} onCheckedChange={(c) => setFormData((p) => ({ ...p, is_popular: c }))} /><Label htmlFor="is_popular">Popular</Label></div>
                  <div className="flex items-center gap-2"><Switch id="is_active" checked={formData.is_active} onCheckedChange={(c) => setFormData((p) => ({ ...p, is_active: c }))} /><Label htmlFor="is_active">Active</Label></div>
                  <div className="flex items-center gap-2"><Switch id="is_purchasable" checked={formData.is_purchasable} onCheckedChange={(c) => setFormData((p) => ({ ...p, is_purchasable: c }))} /><Label htmlFor="is_purchasable">Purchasable Online</Label></div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit" data-testid="save-product-btn">{editingProduct ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (<div className="space-y-4">{[1, 2, 3].map((i) => (<div key={i} className="animate-pulse bg-slate-200 h-20 rounded-lg" />))}</div>)
          : products.length === 0 ? (<Card><CardContent className="py-12 text-center text-muted-foreground">No products yet.</CardContent></Card>)
          : (<div className="space-y-4">
            {products.map((product) => (
              <Card key={product.product_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <GripVertical className="text-muted-foreground cursor-grab" size={20} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{product.title}</h3>
                      {product.is_popular && (<span className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs"><Star size={12} />Popular</span>)}
                      {!product.is_active && (<span className="px-2 py-0.5 rounded bg-slate-200 text-xs">Inactive</span>)}
                    </div>
                    <p className="text-sm text-muted-foreground">{product.price ? `${CURRENCY_SYMBOLS[product.currency] || CURRENCY_SYMBOLS.EUR}${product.price}/${product.price_unit}` : "Contact for pricing"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(product.product_id)}><Trash2 size={16} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>)}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
