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
import { Save, Plus, Trash2, GripVertical, Image, BarChart3, Heart, Clock, HelpCircle, Megaphone } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const iconOptions = [
  { value: "Target", label: "Target" },
  { value: "Lightbulb", label: "Lightbulb" },
  { value: "Award", label: "Award" },
  { value: "Users", label: "Users" },
  { value: "Heart", label: "Heart" },
  { value: "Shield", label: "Shield" },
  { value: "Zap", label: "Zap" },
  { value: "Globe", label: "Globe" },
];

const AdminAbout = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch(`${API_URL}/api/about/settings`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error("Error fetching about content:", error);
      toast.error("Failed to load about page content");
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/about/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(content),
      });
      if (response.ok) {
        toast.success("About page saved!");
      } else {
        toast.error("Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save about page");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setContent({ ...content, [field]: value });
  };

  const updateStat = (index, field, value) => {
    const newStats = [...(content?.stats || [])];
    newStats[index] = { ...newStats[index], [field]: value };
    setContent({ ...content, stats: newStats });
  };

  const addStat = () => {
    const newStats = [...(content?.stats || []), { value: "100+", label: "New Metric" }];
    setContent({ ...content, stats: newStats });
  };

  const removeStat = (index) => {
    const newStats = content.stats.filter((_, i) => i !== index);
    setContent({ ...content, stats: newStats });
  };

  const updateValue = (index, field, value) => {
    const newValues = [...(content?.values || [])];
    newValues[index] = { ...newValues[index], [field]: value };
    setContent({ ...content, values: newValues });
  };

  const addValue = () => {
    const newValues = [...(content?.values || []), { icon: "Target", title: "New Value", description: "Description here" }];
    setContent({ ...content, values: newValues });
  };

  const removeValue = (index) => {
    const newValues = content.values.filter((_, i) => i !== index);
    setContent({ ...content, values: newValues });
  };

  const updateMilestone = (index, field, value) => {
    const newMilestones = [...(content?.milestones || [])];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    setContent({ ...content, milestones: newMilestones });
  };

  const addMilestone = () => {
    const newMilestones = [...(content?.milestones || []), { year: "2025", title: "New Milestone", description: "Description" }];
    setContent({ ...content, milestones: newMilestones });
  };

  const removeMilestone = (index) => {
    const newMilestones = content.milestones.filter((_, i) => i !== index);
    setContent({ ...content, milestones: newMilestones });
  };

  const updateWhyUsPoint = (index, value) => {
    const newPoints = [...(content?.why_us_points || [])];
    newPoints[index] = value;
    setContent({ ...content, why_us_points: newPoints });
  };

  const addWhyUsPoint = () => {
    const newPoints = [...(content?.why_us_points || []), "New point here"];
    setContent({ ...content, why_us_points: newPoints });
  };

  const removeWhyUsPoint = (index) => {
    const newPoints = content.why_us_points.filter((_, i) => i !== index);
    setContent({ ...content, why_us_points: newPoints });
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
            <h1 className="font-heading font-bold text-2xl text-foreground">About Page Manager</h1>
            <p className="text-muted-foreground">Customize your About page content</p>
          </div>
          <Button onClick={saveContent} disabled={saving} className="rounded-full" data-testid="save-about-btn">
            <Save className="mr-2" size={18} />
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>

        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="hero" className="flex items-center gap-2">
              <Image size={16} /> Hero
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 size={16} /> Stats
            </TabsTrigger>
            <TabsTrigger value="values" className="flex items-center gap-2">
              <Heart size={16} /> Values
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock size={16} /> Timeline
            </TabsTrigger>
            <TabsTrigger value="whyus" className="flex items-center gap-2">
              <HelpCircle size={16} /> Why Us
            </TabsTrigger>
            <TabsTrigger value="cta" className="flex items-center gap-2">
              <Megaphone size={16} /> CTA
            </TabsTrigger>
          </TabsList>

          {/* Hero Section Tab */}
          <TabsContent value="hero" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Main banner at the top of the About page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Badge Text</Label>
                    <Input
                      value={content?.hero_badge || ""}
                      onChange={(e) => updateField("hero_badge", e.target.value)}
                      placeholder="About Us"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Button Text</Label>
                    <Input
                      value={content?.hero_cta_text || ""}
                      onChange={(e) => updateField("hero_cta_text", e.target.value)}
                      placeholder="Work With Us"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title Line 1</Label>
                    <Input
                      value={content?.hero_title_line1 || ""}
                      onChange={(e) => updateField("hero_title_line1", e.target.value)}
                      placeholder="Building Digital"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title Line 2 (highlighted)</Label>
                    <Input
                      value={content?.hero_title_line2 || ""}
                      onChange={(e) => updateField("hero_title_line2", e.target.value)}
                      placeholder="Excellence Since 2015"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={content?.hero_description || ""}
                    onChange={(e) => updateField("hero_description", e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hero Image URL</Label>
                    <Input
                      value={content?.hero_image || ""}
                      onChange={(e) => updateField("hero_image", e.target.value)}
                      placeholder="https://..."
                    />
                    {content?.hero_image && (
                      <img src={content.hero_image} alt="Hero preview" className="w-48 h-32 object-cover rounded mt-2" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Link</Label>
                    <Input
                      value={content?.hero_cta_link || ""}
                      onChange={(e) => updateField("hero_cta_link", e.target.value)}
                      placeholder="/contact"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Meta Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input
                    value={content?.meta_title || ""}
                    onChange={(e) => updateField("meta_title", e.target.value)}
                    placeholder="About Us | DIOCREATIONS"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea
                    value={content?.meta_description || ""}
                    onChange={(e) => updateField("meta_description", e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Section Tab */}
          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Statistics Section</CardTitle>
                    <CardDescription>Numbers that showcase your achievements</CardDescription>
                  </div>
                  <Switch
                    checked={content?.show_stats !== false}
                    onCheckedChange={(v) => updateField("show_stats", v)}
                  />
                </div>
              </CardHeader>
              {content?.show_stats !== false && (
                <CardContent className="space-y-4">
                  {(content?.stats || []).map((stat, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <GripVertical className="text-muted-foreground" size={20} />
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
                      <Button variant="ghost" size="sm" onClick={() => removeStat(index)} className="text-red-500">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addStat}>
                    <Plus size={16} className="mr-2" /> Add Stat
                  </Button>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Values Section Tab */}
          <TabsContent value="values" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Values Section</CardTitle>
                    <CardDescription>Core values that define your company</CardDescription>
                  </div>
                  <Switch
                    checked={content?.show_values !== false}
                    onCheckedChange={(v) => updateField("show_values", v)}
                  />
                </div>
              </CardHeader>
              {content?.show_values !== false && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Badge Text</Label>
                      <Input
                        value={content?.values_badge || ""}
                        onChange={(e) => updateField("values_badge", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={content?.values_title || ""}
                        onChange={(e) => updateField("values_title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtitle</Label>
                      <Input
                        value={content?.values_subtitle || ""}
                        onChange={(e) => updateField("values_subtitle", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3">Value Items</h4>
                    {(content?.values || []).map((value, index) => (
                      <div key={index} className="p-4 border rounded-lg mb-3 bg-slate-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">Value {index + 1}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeValue(index)} className="text-red-500">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Icon</Label>
                            <select
                              value={value.icon}
                              onChange={(e) => updateValue(index, "icon", e.target.value)}
                              className="w-full h-10 rounded-md border px-3"
                            >
                              {iconOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={value.title}
                              onChange={(e) => updateValue(index, "title", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2 mt-3">
                          <Label>Description</Label>
                          <Textarea
                            value={value.description}
                            onChange={(e) => updateValue(index, "description", e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addValue}>
                      <Plus size={16} className="mr-2" /> Add Value
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Timeline Section Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Timeline / Milestones</CardTitle>
                    <CardDescription>Your company's journey and achievements</CardDescription>
                  </div>
                  <Switch
                    checked={content?.show_timeline !== false}
                    onCheckedChange={(v) => updateField("show_timeline", v)}
                  />
                </div>
              </CardHeader>
              {content?.show_timeline !== false && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Badge Text</Label>
                      <Input
                        value={content?.timeline_badge || ""}
                        onChange={(e) => updateField("timeline_badge", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={content?.timeline_title || ""}
                        onChange={(e) => updateField("timeline_title", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3">Milestones</h4>
                    {(content?.milestones || []).map((milestone, index) => (
                      <div key={index} className="flex items-start gap-4 p-3 border rounded-lg mb-3">
                        <Input
                          value={milestone.year}
                          onChange={(e) => updateMilestone(index, "year", e.target.value)}
                          placeholder="2025"
                          className="w-24"
                        />
                        <Input
                          value={milestone.title}
                          onChange={(e) => updateMilestone(index, "title", e.target.value)}
                          placeholder="Title"
                          className="w-40"
                        />
                        <Input
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, "description", e.target.value)}
                          placeholder="Description"
                          className="flex-1"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeMilestone(index)} className="text-red-500">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addMilestone}>
                      <Plus size={16} className="mr-2" /> Add Milestone
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Why Us Section Tab */}
          <TabsContent value="whyus" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Why Choose Us Section</CardTitle>
                    <CardDescription>Reasons clients should work with you</CardDescription>
                  </div>
                  <Switch
                    checked={content?.show_why_us !== false}
                    onCheckedChange={(v) => updateField("show_why_us", v)}
                  />
                </div>
              </CardHeader>
              {content?.show_why_us !== false && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Badge Text</Label>
                      <Input
                        value={content?.why_us_badge || ""}
                        onChange={(e) => updateField("why_us_badge", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={content?.why_us_title || ""}
                        onChange={(e) => updateField("why_us_title", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={content?.why_us_description || ""}
                      onChange={(e) => updateField("why_us_description", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      value={content?.why_us_image || ""}
                      onChange={(e) => updateField("why_us_image", e.target.value)}
                    />
                    {content?.why_us_image && (
                      <img src={content.why_us_image} alt="Why us preview" className="w-48 h-32 object-cover rounded mt-2" />
                    )}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3">Bullet Points</h4>
                    {(content?.why_us_points || []).map((point, index) => (
                      <div key={index} className="flex items-center gap-4 mb-2">
                        <Input
                          value={point}
                          onChange={(e) => updateWhyUsPoint(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeWhyUsPoint(index)} className="text-red-500">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addWhyUsPoint}>
                      <Plus size={16} className="mr-2" /> Add Point
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* CTA Section Tab */}
          <TabsContent value="cta" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Call to Action Section</CardTitle>
                    <CardDescription>Bottom banner encouraging contact</CardDescription>
                  </div>
                  <Switch
                    checked={content?.show_cta !== false}
                    onCheckedChange={(v) => updateField("show_cta", v)}
                  />
                </div>
              </CardHeader>
              {content?.show_cta !== false && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={content?.cta_title || ""}
                      onChange={(e) => updateField("cta_title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Input
                      value={content?.cta_subtitle || ""}
                      onChange={(e) => updateField("cta_subtitle", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Button Text</Label>
                      <Input
                        value={content?.cta_button_text || ""}
                        onChange={(e) => updateField("cta_button_text", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Button Link</Label>
                      <Input
                        value={content?.cta_button_link || ""}
                        onChange={(e) => updateField("cta_button_link", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminAbout;
