import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Globe, Search, Tag, FileText, Code, Plus, X, Loader2, Upload, Image } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SITE_PAGES = [
  { slug: "home", label: "Homepage", path: "/" },
  { slug: "about", label: "About", path: "/about" },
  { slug: "services", label: "Services", path: "/services" },
  { slug: "products", label: "Products", path: "/products" },
  { slug: "portfolio", label: "Portfolio", path: "/portfolio" },
  { slug: "blog", label: "Blog", path: "/blog" },
  { slug: "contact", label: "Contact", path: "/contact" },
  { slug: "resume-optimizer", label: "Resume Optimizer", path: "/resume-optimizer" },
  { slug: "cover-letter", label: "Cover Letter", path: "/cover-letter" },
];

const PageSeoCard = ({ page, seo, saving, updatePageField, addPageKeyword, removePageKeyword, savePage, uploadPageOgImage, uploading }) => {
  const [pkw, setPkw] = useState("");
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2"><FileText size={16} /> {page.label} <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{page.path}</code></span>
          <Button size="sm" variant="outline" onClick={() => savePage(page.slug)} disabled={saving} className="rounded-full text-xs" data-testid={`save-page-seo-${page.slug}`}><Save size={12} className="mr-1" /> Save</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Page Title</Label>
            <Input value={seo.title || ""} onChange={(e) => updatePageField(page.slug, "title", e.target.value)} placeholder={`${page.label} - DioCreations`} className="text-sm" data-testid={`page-title-${page.slug}`} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Canonical URL</Label>
            <Input value={seo.canonical_url || ""} onChange={(e) => updatePageField(page.slug, "canonical_url", e.target.value)} placeholder={`https://diocreations.eu${page.path}`} className="text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Meta Description</Label>
          <Textarea value={seo.description || ""} onChange={(e) => updatePageField(page.slug, "description", e.target.value)} rows={2} className="text-sm" data-testid={`page-desc-${page.slug}`} placeholder="Page-specific description for search results..." />
          <p className="text-[10px] text-muted-foreground">{(seo.description || "").length}/160</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">OG Title (Social Share)</Label>
            <Input value={seo.og_title || ""} onChange={(e) => updatePageField(page.slug, "og_title", e.target.value)} className="text-sm" placeholder="Title for social media" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">OG Image URL</Label>
            <div className="flex gap-1.5">
              <Input value={seo.og_image || ""} onChange={(e) => updatePageField(page.slug, "og_image", e.target.value)} className="text-sm flex-1" placeholder="https://www.diocreations.eu/og-{page}.png" />
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPageOgImage(e, page.slug)} disabled={uploading} />
                <Button type="button" variant="outline" size="icon" disabled={uploading} asChild className="h-9 w-9">
                  <span>{uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}</span>
                </Button>
              </label>
            </div>
            <p className="text-[10px] text-muted-foreground">Upload saves as og-{page.slug}.png (1200×630px recommended)</p>
            {seo.og_image && (
              <div className="mt-1.5 border rounded p-1.5 bg-slate-50">
                <img src={seo.og_image} alt="OG Preview" className="max-h-20 rounded" onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Page Keywords</Label>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {(seo.keywords || []).map((kw, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                {kw}<button onClick={() => removePageKeyword(page.slug, i)}><X size={10} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Input value={pkw} onChange={(e) => setPkw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPageKeyword(page.slug, pkw); setPkw(""); } }} placeholder="Add keyword..." className="text-sm max-w-[200px]" />
            <Button type="button" variant="ghost" size="sm" onClick={() => { addPageKeyword(page.slug, pkw); setPkw(""); }} className="text-xs"><Plus size={12} /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminSeo = () => {
  const [globalSeo, setGlobalSeo] = useState(null);
  const [pageSeo, setPageSeo] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("global");
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    loadSeoData();
  }, []);

  const loadSeoData = async () => {
    try {
      const [globalRes, pagesRes] = await Promise.all([
        fetch(`${API_URL}/api/seo/global`, { credentials: "include" }),
        fetch(`${API_URL}/api/seo/pages`, { credentials: "include" }),
      ]);
      if (globalRes.ok) setGlobalSeo(await globalRes.json());
      if (pagesRes.ok) {
        const pages = await pagesRes.json();
        const map = {};
        pages.forEach((p) => { map[p.slug] = p; });
        setPageSeo(map);
      }
    } catch { toast.error("Failed to load SEO data"); }
    finally { setLoading(false); }
  };

  const saveGlobal = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/seo/global`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(globalSeo),
      });
      if (res.ok) toast.success("Global SEO saved!");
      else throw new Error();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const savePage = async (slug) => {
    setSaving(true);
    try {
      const data = pageSeo[slug] || {};
      const res = await fetch(`${API_URL}/api/seo/pages/${slug}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
      });
      if (res.ok) toast.success(`SEO for "${slug}" saved!`);
      else throw new Error();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const updatePageField = (slug, field, value) => {
    setPageSeo((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], slug, [field]: value },
    }));
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    setGlobalSeo((prev) => ({
      ...prev,
      default_keywords: [...(prev?.default_keywords || []), newKeyword.trim()],
    }));
    setNewKeyword("");
  };

  const removeKeyword = (idx) => {
    setGlobalSeo((prev) => ({
      ...prev,
      default_keywords: (prev?.default_keywords || []).filter((_, i) => i !== idx),
    }));
  };

  const addPageKeyword = (slug, keyword) => {
    if (!keyword.trim()) return;
    const current = pageSeo[slug]?.keywords || [];
    updatePageField(slug, "keywords", [...current, keyword.trim()]);
  };

  const removePageKeyword = (slug, idx) => {
    const current = pageSeo[slug]?.keywords || [];
    updatePageField(slug, "keywords", current.filter((_, i) => i !== idx));
  };

  const uploadOgImage = async (e, target = "global") => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    // Add page_slug query parameter for page-specific uploads
    const queryParam = target !== "global" ? `?page_slug=${target}` : "";
    
    try {
      const res = await fetch(`${API_URL}/api/seo/upload-og-image${queryParam}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        // Use production domain for OG image URL (social media crawlers need absolute production URL)
        const productionUrl = `https://www.diocreations.eu${data.url}`;
        
        if (target === "global") {
          setGlobalSeo({ ...globalSeo, default_og_image: productionUrl });
          toast.success("Image uploaded as og-default.png! Click 'Save Global SEO' to apply changes.");
        } else {
          updatePageField(target, "og_image", productionUrl);
          toast.success(`Image uploaded as og-${target}.png! Click 'Save' to apply changes.`);
        }
      } else {
        const err = await res.json();
        toast.error(err.detail || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  if (loading) {
    return (<AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" size={32} /></div></AdminLayout>);
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground" data-testid="seo-heading">SEO Manager</h1>
            <p className="text-muted-foreground">Manage meta tags, keywords, and search engine settings to boost Google ranking</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-fit">
            <TabsTrigger value="global" data-testid="seo-tab-global"><Globe size={14} className="mr-1.5" /> Global</TabsTrigger>
            <TabsTrigger value="pages" data-testid="seo-tab-pages"><FileText size={14} className="mr-1.5" /> Pages</TabsTrigger>
            <TabsTrigger value="advanced" data-testid="seo-tab-advanced"><Code size={14} className="mr-1.5" /> Advanced</TabsTrigger>
          </TabsList>

          {/* GLOBAL SEO */}
          <TabsContent value="global" className="space-y-6 mt-6">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe size={18} /> Site-Wide Defaults</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Site Title</Label>
                    <Input value={globalSeo?.site_title || ""} onChange={(e) => setGlobalSeo({ ...globalSeo, site_title: e.target.value })} data-testid="seo-site-title" placeholder="My Website - Tagline" />
                    <p className="text-xs text-muted-foreground">Appears in browser tab and search results</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Default OG Image URL</Label>
                    <div className="flex gap-2">
                      <Input value={globalSeo?.default_og_image || ""} onChange={(e) => setGlobalSeo({ ...globalSeo, default_og_image: e.target.value })} placeholder="https://www.diocreations.eu/og-default.png" className="flex-1" />
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadOgImage(e, "global")} disabled={uploading} />
                        <Button type="button" variant="outline" size="icon" disabled={uploading} asChild>
                          <span>{uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}</span>
                        </Button>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Upload recommended</strong> - Replaces og-default.png (1200×630px for best social media display)
                    </p>
                    {globalSeo?.default_og_image && (
                      <div className="mt-2 border rounded-lg p-2 bg-slate-50">
                        <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                        <img src={globalSeo.default_og_image} alt="OG Preview" className="max-h-32 rounded" onError={(e) => e.target.style.display = 'none'} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Default Meta Description</Label>
                  <Textarea value={globalSeo?.site_description || ""} onChange={(e) => setGlobalSeo({ ...globalSeo, site_description: e.target.value })} rows={3} data-testid="seo-site-description" placeholder="A brief description of your website..." />
                  <p className="text-xs text-muted-foreground">{(globalSeo?.site_description || "").length}/160 characters (recommended max)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Tag size={18} /> Default Keywords</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">These keywords apply site-wide and help Google understand your content</p>
                <div className="flex flex-wrap gap-2">
                  {(globalSeo?.default_keywords || []).map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {kw}
                      <button onClick={() => removeKeyword(i)} className="hover:text-red-500 ml-0.5" data-testid={`remove-keyword-${i}`}><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())} placeholder="Add a keyword..." data-testid="seo-add-keyword-input" className="max-w-xs" />
                  <Button type="button" variant="outline" size="sm" onClick={addKeyword} data-testid="seo-add-keyword-btn"><Plus size={14} className="mr-1" /> Add</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Search size={18} /> Search Engine Verification</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Google Search Console Verification</Label>
                    <Input value={globalSeo?.google_verification || ""} onChange={(e) => setGlobalSeo({ ...globalSeo, google_verification: e.target.value })} data-testid="seo-google-verification" placeholder="google-site-verification code" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bing Webmaster Verification</Label>
                    <Input value={globalSeo?.bing_verification || ""} onChange={(e) => setGlobalSeo({ ...globalSeo, bing_verification: e.target.value })} placeholder="Bing verification code" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={saveGlobal} disabled={saving} className="rounded-full" data-testid="save-global-seo"><Save size={16} className="mr-2" />{saving ? "Saving..." : "Save Global SEO"}</Button>
            </div>
          </TabsContent>

          {/* PER-PAGE SEO */}
          <TabsContent value="pages" className="space-y-4 mt-6">
            <p className="text-sm text-muted-foreground">Set unique meta tags, titles, and keywords for each page to maximize search visibility</p>
            {SITE_PAGES.map((page) => (
              <PageSeoCard key={page.slug} page={page} seo={pageSeo[page.slug] || {}} saving={saving} uploading={uploading}
                updatePageField={updatePageField} addPageKeyword={addPageKeyword} removePageKeyword={removePageKeyword} savePage={savePage} uploadPageOgImage={uploadOgImage} />
            ))}
          </TabsContent>

          {/* ADVANCED SEO */}
          <TabsContent value="advanced" className="space-y-6 mt-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Schema.org / Structured Data</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Configure JSON-LD structured data for rich search results</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    <Input value={globalSeo?.schema_org_name || ""} onChange={(e) => setGlobalSeo({ ...globalSeo, schema_org_name: e.target.value })} data-testid="schema-org-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Website URL</Label>
                    <Input value={globalSeo?.schema_org_url || ""} onChange={(e) => setGlobalSeo({ ...globalSeo, schema_org_url: e.target.value })} placeholder="https://diocreations.eu" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input value={globalSeo?.schema_org_logo || ""} onChange={(e) => setGlobalSeo({ ...globalSeo, schema_org_logo: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Schema Type</Label>
                    <select value={globalSeo?.schema_org_type || "Organization"} onChange={(e) => setGlobalSeo({ ...globalSeo, schema_org_type: e.target.value })} className="w-full h-10 rounded-md border px-3 text-sm">
                      <option value="Organization">Organization</option>
                      <option value="LocalBusiness">Local Business</option>
                      <option value="ProfessionalService">Professional Service</option>
                      <option value="WebApplication">Web Application</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Organization Description</Label>
                  <Textarea value={globalSeo?.schema_org_description || ""} onChange={(e) => setGlobalSeo({ ...globalSeo, schema_org_description: e.target.value })} rows={2} placeholder="Brief description for structured data..." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Robots.txt Custom Rules</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Add custom directives to robots.txt (default rules: Allow /, Disallow /admin/ and /api/)</p>
                <Textarea value={globalSeo?.robots_extra || ""} onChange={(e) => setGlobalSeo({ ...globalSeo, robots_extra: e.target.value })} rows={4} data-testid="robots-extra" placeholder="# Additional rules&#10;Disallow: /private/" className="font-mono text-sm" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Custom Head Tags</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Add custom HTML tags to the &lt;head&gt; section (e.g., additional verification, hreflang)</p>
                <Textarea value={globalSeo?.custom_head_tags || ""} onChange={(e) => setGlobalSeo({ ...globalSeo, custom_head_tags: e.target.value })} rows={4} data-testid="custom-head-tags" placeholder='<meta name="author" content="DioCreations" />' className="font-mono text-sm" />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={saveGlobal} disabled={saving} className="rounded-full" data-testid="save-advanced-seo"><Save size={16} className="mr-2" />{saving ? "Saving..." : "Save Advanced SEO"}</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSeo;
