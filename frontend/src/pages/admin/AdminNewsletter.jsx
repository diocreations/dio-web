import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Mail, Users, Send, Calendar, Trash2, Loader2, AlertTriangle, 
  Plus, Eye, Clock, CheckCircle, Link as LinkIcon, Image, FileText,
  RefreshCw, Download
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0 });
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [tab, setTab] = useState("subscribers");
  
  // Newsletter form state
  const [creating, setCreating] = useState(false);
  const [fetchingBlog, setFetchingBlog] = useState(false);
  const [sending, setSending] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  
  const [form, setForm] = useState({
    subject: "",
    preview_text: "",
    blog_url: "",
    blog_title: "",
    blog_excerpt: "",
    blog_image: "",
    custom_message: "",
    scheduled_for: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, nlRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/newsletter/subscribers`, { credentials: "include" }),
        fetch(`${API_URL}/api/admin/newsletter/list`, { credentials: "include" }),
      ]);
      
      if (subsRes.ok) {
        const data = await subsRes.json();
        setSubscribers(data.subscribers || []);
        setStats(data.stats || { total: 0, active: 0, unsubscribed: 0 });
      }
      
      if (nlRes.ok) {
        setNewsletters(await nlRes.json());
      }
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscriber = async (subscriberId) => {
    if (!window.confirm("Delete this subscriber?")) return;
    setDeleting(subscriberId);
    try {
      const res = await fetch(`${API_URL}/api/admin/newsletter/subscribers/${subscriberId}`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) {
        toast.success("Subscriber deleted");
        setSubscribers(subscribers.filter(s => s.subscriber_id !== subscriberId));
        setStats(prev => ({ ...prev, total: prev.total - 1, active: prev.active - 1 }));
      }
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(null); }
  };

  const deleteAllSubscribers = async () => {
    if (!window.confirm(`Delete ALL ${stats.total} subscribers? This cannot be undone!`)) return;
    if (!window.confirm("Are you ABSOLUTELY sure?")) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/newsletter/subscribers/delete-all`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) {
        toast.success("All subscribers deleted");
        setSubscribers([]);
        setStats({ total: 0, active: 0, unsubscribed: 0 });
      }
    } catch { toast.error("Failed to delete"); }
  };

  const exportSubscribers = () => {
    const csv = "Email,Status,Subscribed At\n" + 
      subscribers.map(s => `${s.email},${s.status},${s.subscribed_at}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
  };

  const fetchBlogContent = async () => {
    if (!form.blog_url) {
      toast.error("Enter a blog URL first");
      return;
    }
    setFetchingBlog(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/newsletter/fetch-blog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: form.blog_url }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({
          ...prev,
          blog_title: data.title || prev.blog_title,
          blog_excerpt: data.excerpt || data.content?.substring(0, 300) || prev.blog_excerpt,
          blog_image: data.image || prev.blog_image,
        }));
        toast.success("Blog content fetched!");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to fetch blog");
      }
    } catch { toast.error("Failed to fetch blog content"); }
    finally { setFetchingBlog(false); }
  };

  const createNewsletter = async (sendNow = false) => {
    if (!form.subject) {
      toast.error("Subject is required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/newsletter/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          status: sendNow ? "sending" : (form.scheduled_for ? "scheduled" : "draft"),
        }),
      });
      if (res.ok) {
        const nl = await res.json();
        toast.success(sendNow ? "Newsletter created!" : "Newsletter saved as draft");
        
        if (sendNow) {
          // Send immediately
          const sendRes = await fetch(`${API_URL}/api/admin/newsletter/${nl.newsletter_id}/send`, {
            method: "POST", credentials: "include",
          });
          if (sendRes.ok) {
            toast.success("Newsletter is being sent!");
          }
        } else if (form.scheduled_for) {
          // Schedule
          await fetch(`${API_URL}/api/admin/newsletter/${nl.newsletter_id}/schedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ scheduled_for: form.scheduled_for }),
          });
          toast.success(`Newsletter scheduled for ${new Date(form.scheduled_for).toLocaleString()}`);
        }
        
        // Reset form and refresh
        setForm({
          subject: "", preview_text: "", blog_url: "", blog_title: "",
          blog_excerpt: "", blog_image: "", custom_message: "", scheduled_for: "",
        });
        fetchData();
      } else {
        toast.error("Failed to create newsletter");
      }
    } catch { toast.error("Failed to create newsletter"); }
    finally { setCreating(false); }
  };

  const sendNewsletter = async (newsletterId) => {
    if (!window.confirm(`Send this newsletter to ${stats.active} active subscribers?`)) return;
    setSending(newsletterId);
    try {
      const res = await fetch(`${API_URL}/api/admin/newsletter/${newsletterId}/send`, {
        method: "POST", credentials: "include",
      });
      if (res.ok) {
        toast.success("Newsletter is being sent!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to send");
      }
    } catch { toast.error("Failed to send"); }
    finally { setSending(null); }
  };

  const deleteNewsletter = async (newsletterId) => {
    if (!window.confirm("Delete this newsletter?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/newsletter/${newsletterId}`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) {
        toast.success("Newsletter deleted");
        setNewsletters(newsletters.filter(n => n.newsletter_id !== newsletterId));
      }
    } catch { toast.error("Failed to delete"); }
  };

  const previewNewsletter = async (newsletterId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/newsletter/${newsletterId}/preview`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewHtml(data.html);
        setShowPreview(true);
      }
    } catch { toast.error("Failed to load preview"); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { 
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" 
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: "bg-slate-100 text-slate-700",
      scheduled: "bg-blue-100 text-blue-700",
      sending: "bg-amber-100 text-amber-700",
      sent: "bg-green-100 text-green-700",
    };
    return <Badge className={styles[status] || styles.draft}>{status}</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map((i) => <div key={i} className="bg-slate-200 h-32 rounded-lg" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl" data-testid="admin-newsletter-title">Newsletter</h1>
            <p className="text-muted-foreground">Manage subscribers and send newsletters</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Subscribers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Mail className="text-slate-600" size={20} />
              </div>
              <div>
                <p className="text-xl font-bold">{newsletters.length}</p>
                <p className="text-xs text-muted-foreground">Newsletters</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Send className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-xl font-bold">{newsletters.filter(n => n.status === "sent").reduce((a, n) => a + (n.sent_count || 0), 0)}</p>
                <p className="text-xs text-muted-foreground">Emails Sent</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="subscribers" className="gap-2"><Users size={14} /> Subscribers</TabsTrigger>
            <TabsTrigger value="create" className="gap-2"><Plus size={14} /> Create Newsletter</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><Mail size={14} /> History</TabsTrigger>
          </TabsList>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Email Subscribers</CardTitle>
                    <CardDescription>Manage your newsletter subscriber list</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportSubscribers} className="gap-2">
                      <Download size={14} /> Export CSV
                    </Button>
                    {subscribers.length > 0 && (
                      <Button variant="destructive" size="sm" onClick={deleteAllSubscribers} className="gap-2">
                        <AlertTriangle size={14} /> Delete All
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {subscribers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No subscribers yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {subscribers.map((sub) => (
                      <div key={sub.subscriber_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <Mail size={16} className={sub.status === "active" ? "text-green-600" : "text-slate-400"} />
                          <div>
                            <p className="font-medium text-sm">{sub.email}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(sub.subscribed_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={sub.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}>
                            {sub.status}
                          </Badge>
                          <Button variant="ghost" size="icon" onClick={() => deleteSubscriber(sub.subscriber_id)} 
                            disabled={deleting === sub.subscriber_id} className="text-destructive">
                            {deleting === sub.subscriber_id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Newsletter Tab */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create Newsletter</CardTitle>
                <CardDescription>Compose and send a newsletter to your subscribers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject */}
                <div className="space-y-2">
                  <Label>Email Subject *</Label>
                  <Input 
                    value={form.subject} 
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g., New Blog Post: How to Optimize Your Resume"
                    data-testid="newsletter-subject"
                  />
                </div>

                {/* Preview Text */}
                <div className="space-y-2">
                  <Label>Preview Text (appears in inbox preview)</Label>
                  <Input 
                    value={form.preview_text} 
                    onChange={(e) => setForm({ ...form, preview_text: e.target.value })}
                    placeholder="A brief teaser that shows in the inbox"
                  />
                </div>

                {/* Blog URL Auto-fetch */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><LinkIcon size={14} /> Blog URL (auto-fetch content)</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={form.blog_url} 
                      onChange={(e) => setForm({ ...form, blog_url: e.target.value })}
                      placeholder="https://diocreations.eu/blog/your-post-slug"
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={fetchBlogContent} disabled={fetchingBlog} className="gap-2">
                      {fetchingBlog ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      Fetch
                    </Button>
                  </div>
                </div>

                {/* Blog Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Blog Title</Label>
                    <Input 
                      value={form.blog_title} 
                      onChange={(e) => setForm({ ...form, blog_title: e.target.value })}
                      placeholder="Article title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Image size={14} /> Featured Image URL</Label>
                    <Input 
                      value={form.blog_image} 
                      onChange={(e) => setForm({ ...form, blog_image: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Blog Excerpt</Label>
                  <Textarea 
                    value={form.blog_excerpt} 
                    onChange={(e) => setForm({ ...form, blog_excerpt: e.target.value })}
                    rows={3}
                    placeholder="A brief summary of the blog post..."
                  />
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <Label>Custom Message (optional intro)</Label>
                  <Textarea 
                    value={form.custom_message} 
                    onChange={(e) => setForm({ ...form, custom_message: e.target.value })}
                    rows={3}
                    placeholder="Hi there! We've got some exciting news to share..."
                  />
                </div>

                {/* Schedule */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Calendar size={14} /> Schedule (optional)</Label>
                  <Input 
                    type="datetime-local" 
                    value={form.scheduled_for} 
                    onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to send immediately or save as draft</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={() => createNewsletter(false)} disabled={creating} variant="outline" className="gap-2">
                    <FileText size={16} />
                    {form.scheduled_for ? "Schedule" : "Save Draft"}
                  </Button>
                  <Button onClick={() => createNewsletter(true)} disabled={creating || stats.active === 0} className="gap-2">
                    {creating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Send Now ({stats.active} subscribers)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Newsletter History</CardTitle>
                <CardDescription>View and manage past newsletters</CardDescription>
              </CardHeader>
              <CardContent>
                {newsletters.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No newsletters created yet.</p>
                ) : (
                  <div className="space-y-3">
                    {newsletters.map((nl) => (
                      <div key={nl.newsletter_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{nl.subject}</p>
                            {getStatusBadge(nl.status)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar size={10} /> {formatDate(nl.created_at)}
                            </span>
                            {nl.status === "scheduled" && nl.scheduled_for && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <Clock size={10} /> Scheduled: {formatDate(nl.scheduled_for)}
                              </span>
                            )}
                            {nl.status === "sent" && (
                              <span className="flex items-center gap-1 text-green-600">
                                <Send size={10} /> Sent to {nl.sent_count} subscribers
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="ghost" size="sm" onClick={() => previewNewsletter(nl.newsletter_id)} className="gap-1">
                            <Eye size={14} /> Preview
                          </Button>
                          {(nl.status === "draft" || nl.status === "scheduled") && (
                            <Button variant="outline" size="sm" onClick={() => sendNewsletter(nl.newsletter_id)} 
                              disabled={sending === nl.newsletter_id} className="gap-1">
                              {sending === nl.newsletter_id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                              Send
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => deleteNewsletter(nl.newsletter_id)} className="text-destructive">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h3 className="font-semibold">Email Preview</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>Close</Button>
              </div>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletter;
