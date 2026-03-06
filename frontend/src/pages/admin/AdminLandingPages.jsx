import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, Image, Link as LinkIcon, FileText, Sparkles, Search, PenTool } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LANDING_PAGES = [
  { slug: "resume-builder-landing", label: "Resume Builder", icon: FileText, path: "/resume-builder-info" },
  { slug: "resume-analyzer-landing", label: "Resume Analyzer & LinkedIn", icon: Search, path: "/resume-analyzer-info" },
  { slug: "cover-letter-landing", label: "Cover Letter Generator", icon: PenTool, path: "/cover-letter-info" }
];

const AdminLandingPages = () => {
  const [pages, setPages] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    fetchAllPages();
  }, []);

  const fetchAllPages = async () => {
    try {
      const results = {};
      for (const page of LANDING_PAGES) {
        try {
          const res = await fetch(`${API_URL}/api/pages/${page.slug}`);
          if (res.ok) {
            const data = await res.json();
            results[page.slug] = data.content || {};
          } else {
            results[page.slug] = {};
          }
        } catch {
          results[page.slug] = {};
        }
      }
      setPages(results);
    } catch (error) {
      console.error("Error fetching pages:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePageField = (pageSlug, section, field, value) => {
    setPages(prev => ({
      ...prev,
      [pageSlug]: {
        ...prev[pageSlug],
        [section]: {
          ...(prev[pageSlug]?.[section] || {}),
          [field]: value
        }
      }
    }));
  };

  const updateFeature = (pageSlug, index, field, value) => {
    setPages(prev => {
      const features = [...(prev[pageSlug]?.features || [])];
      features[index] = { ...features[index], [field]: value };
      return {
        ...prev,
        [pageSlug]: {
          ...prev[pageSlug],
          features
        }
      };
    });
  };

  const addFeature = (pageSlug) => {
    setPages(prev => ({
      ...prev,
      [pageSlug]: {
        ...prev[pageSlug],
        features: [...(prev[pageSlug]?.features || []), { icon: "Sparkles", title: "", description: "" }]
      }
    }));
  };

  const removeFeature = (pageSlug, index) => {
    setPages(prev => ({
      ...prev,
      [pageSlug]: {
        ...prev[pageSlug],
        features: (prev[pageSlug]?.features || []).filter((_, i) => i !== index)
      }
    }));
  };

  const updateStat = (pageSlug, index, field, value) => {
    setPages(prev => {
      const stats = [...(prev[pageSlug]?.stats || [])];
      stats[index] = { ...stats[index], [field]: value };
      return {
        ...prev,
        [pageSlug]: {
          ...prev[pageSlug],
          stats
        }
      };
    });
  };

  const addStat = (pageSlug) => {
    setPages(prev => ({
      ...prev,
      [pageSlug]: {
        ...prev[pageSlug],
        stats: [...(prev[pageSlug]?.stats || []), { value: "", label: "" }]
      }
    }));
  };

  const removeStat = (pageSlug, index) => {
    setPages(prev => ({
      ...prev,
      [pageSlug]: {
        ...prev[pageSlug],
        stats: (prev[pageSlug]?.stats || []).filter((_, i) => i !== index)
      }
    }));
  };

  const updateTestimonial = (pageSlug, index, field, value) => {
    setPages(prev => {
      const testimonials = [...(prev[pageSlug]?.testimonials || [])];
      testimonials[index] = { ...testimonials[index], [field]: value };
      return {
        ...prev,
        [pageSlug]: {
          ...prev[pageSlug],
          testimonials
        }
      };
    });
  };

  const addTestimonial = (pageSlug) => {
    setPages(prev => ({
      ...prev,
      [pageSlug]: {
        ...prev[pageSlug],
        testimonials: [...(prev[pageSlug]?.testimonials || []), { name: "", role: "", text: "", rating: 5 }]
      }
    }));
  };

  const removeTestimonial = (pageSlug, index) => {
    setPages(prev => ({
      ...prev,
      [pageSlug]: {
        ...prev[pageSlug],
        testimonials: (prev[pageSlug]?.testimonials || []).filter((_, i) => i !== index)
      }
    }));
  };

  const savePage = async (pageSlug) => {
    setSaving(prev => ({ ...prev, [pageSlug]: true }));
    try {
      const res = await fetch(`${API_URL}/api/pages/${pageSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: pages[pageSlug] })
      });
      if (res.ok) {
        toast.success("Landing page saved successfully!");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save landing page");
    } finally {
      setSaving(prev => ({ ...prev, [pageSlug]: false }));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="admin-landing-pages-title">Landing Pages</h1>
          <p className="text-muted-foreground">Manage content for your tool landing pages</p>
        </div>

        <Tabs defaultValue="resume-builder-landing">
          <TabsList className="grid w-full grid-cols-3">
            {LANDING_PAGES.map(page => (
              <TabsTrigger key={page.slug} value={page.slug} className="flex items-center gap-2">
                <page.icon size={16} />
                <span className="hidden sm:inline">{page.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {LANDING_PAGES.map(page => (
            <TabsContent key={page.slug} value={page.slug} className="space-y-6 mt-6">
              {/* Hero Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles size={18} /> Hero Section
                  </CardTitle>
                  <CardDescription>Main banner content at the top of the page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Badge Text</Label>
                      <Input
                        value={pages[page.slug]?.hero?.badge || ""}
                        onChange={(e) => updatePageField(page.slug, "hero", "badge", e.target.value)}
                        placeholder="AI-Powered Tool"
                        data-testid={`${page.slug}-hero-badge`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hero Image URL</Label>
                      <Input
                        value={pages[page.slug]?.hero?.image || ""}
                        onChange={(e) => updatePageField(page.slug, "hero", "image", e.target.value)}
                        placeholder="https://..."
                        data-testid={`${page.slug}-hero-image`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={pages[page.slug]?.hero?.title || ""}
                        onChange={(e) => updatePageField(page.slug, "hero", "title", e.target.value)}
                        placeholder="Main headline"
                        data-testid={`${page.slug}-hero-title`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Highlighted Text</Label>
                      <Input
                        value={pages[page.slug]?.hero?.highlight || ""}
                        onChange={(e) => updatePageField(page.slug, "hero", "highlight", e.target.value)}
                        placeholder="Gradient text"
                        data-testid={`${page.slug}-hero-highlight`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={pages[page.slug]?.hero?.description || ""}
                      onChange={(e) => updatePageField(page.slug, "hero", "description", e.target.value)}
                      placeholder="Brief description..."
                      rows={3}
                      data-testid={`${page.slug}-hero-description`}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CTA Button Text</Label>
                      <Input
                        value={pages[page.slug]?.hero?.cta_text || ""}
                        onChange={(e) => updatePageField(page.slug, "hero", "cta_text", e.target.value)}
                        placeholder="Get Started"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Button Link</Label>
                      <Input
                        value={pages[page.slug]?.hero?.cta_link || ""}
                        onChange={(e) => updatePageField(page.slug, "hero", "cta_link", e.target.value)}
                        placeholder="/resume-builder"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stats Section</CardTitle>
                  <CardDescription>Key numbers displayed in the dark bar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(pages[page.slug]?.stats || []).map((stat, index) => (
                    <div key={index} className="flex gap-4 items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Value</Label>
                        <Input
                          value={stat.value || ""}
                          onChange={(e) => updateStat(page.slug, index, "value", e.target.value)}
                          placeholder="50K+"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={stat.label || ""}
                          onChange={(e) => updateStat(page.slug, index, "label", e.target.value)}
                          placeholder="Users"
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeStat(page.slug, index)}>
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addStat(page.slug)}>
                    <Plus size={14} className="mr-1" /> Add Stat
                  </Button>
                </CardContent>
              </Card>

              {/* Features Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Features</CardTitle>
                  <CardDescription>Feature cards displayed in the grid</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(pages[page.slug]?.features || []).map((feature, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">Feature {index + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeFeature(page.slug, index)}>
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Icon</Label>
                          <Input
                            value={feature.icon || ""}
                            onChange={(e) => updateFeature(page.slug, index, "icon", e.target.value)}
                            placeholder="Sparkles"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={feature.title || ""}
                            onChange={(e) => updateFeature(page.slug, index, "title", e.target.value)}
                            placeholder="Feature title"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={feature.description || ""}
                          onChange={(e) => updateFeature(page.slug, index, "description", e.target.value)}
                          placeholder="Feature description..."
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addFeature(page.slug)}>
                    <Plus size={14} className="mr-1" /> Add Feature
                  </Button>
                </CardContent>
              </Card>

              {/* Testimonials Section (for Resume Builder) */}
              {page.slug === "resume-builder-landing" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Testimonials</CardTitle>
                    <CardDescription>User reviews and testimonials</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(pages[page.slug]?.testimonials || []).map((testimonial, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">Testimonial {index + 1}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeTestimonial(page.slug, index)}>
                            <Trash2 size={14} className="text-red-500" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={testimonial.name || ""}
                              onChange={(e) => updateTestimonial(page.slug, index, "name", e.target.value)}
                              placeholder="John D."
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Role</Label>
                            <Input
                              value={testimonial.role || ""}
                              onChange={(e) => updateTestimonial(page.slug, index, "role", e.target.value)}
                              placeholder="Software Engineer"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rating (1-5)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              value={testimonial.rating || 5}
                              onChange={(e) => updateTestimonial(page.slug, index, "rating", parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Quote</Label>
                          <Textarea
                            value={testimonial.text || ""}
                            onChange={(e) => updateTestimonial(page.slug, index, "text", e.target.value)}
                            placeholder="What they said..."
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addTestimonial(page.slug)}>
                      <Plus size={14} className="mr-1" /> Add Testimonial
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* CTA Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bottom CTA Section</CardTitle>
                  <CardDescription>Call to action at the bottom of the page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={pages[page.slug]?.cta?.title || ""}
                      onChange={(e) => updatePageField(page.slug, "cta", "title", e.target.value)}
                      placeholder="Ready to get started?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={pages[page.slug]?.cta?.description || ""}
                      onChange={(e) => updatePageField(page.slug, "cta", "description", e.target.value)}
                      placeholder="Compelling description..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Button Text</Label>
                      <Input
                        value={pages[page.slug]?.cta?.button_text || ""}
                        onChange={(e) => updatePageField(page.slug, "cta", "button_text", e.target.value)}
                        placeholder="Get Started"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Button Link</Label>
                      <Input
                        value={pages[page.slug]?.cta?.button_link || ""}
                        onChange={(e) => updatePageField(page.slug, "cta", "button_link", e.target.value)}
                        placeholder="/resume-builder"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => savePage(page.slug)}
                  disabled={saving[page.slug]}
                  className="rounded-full"
                  data-testid={`save-${page.slug}`}
                >
                  {saving[page.slug] ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save {page.label}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminLandingPages;
