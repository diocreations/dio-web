import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Calendar, Code, FileText } from "lucide-react";
import { SortableList, SortableItem } from "@/components/SortableList";
import BlogEditor from "@/components/admin/BlogEditor";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminBlog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: "", slug: "", excerpt: "", content: "", featured_image: "",
    category: "", tags: "", author: "", is_published: false,
    adsense_code: "", adsense_position: "after_content",
  });

  const fetchPosts = () => {
    fetch(`${API_URL}/api/blog`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev, [name]: value,
      ...(name === "title" && !editingPost ? { slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") } : {}),
    }));
  };

  const handleContentChange = (content) => {
    setFormData((prev) => ({ ...prev, content }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tags = formData.tags.split(",").map((t) => t.trim()).filter((t) => t);
    try {
      const body = { ...formData, tags };
      const url = editingPost ? `${API_URL}/api/blog/${editingPost.post_id}` : `${API_URL}/api/blog`;
      const response = await fetch(url, {
        method: editingPost ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(body),
      });
      if (response.ok) {
        toast.success(editingPost ? "Post updated!" : "Post created!");
        setDialogOpen(false); resetForm(); fetchPosts();
      } else throw new Error("Failed");
    } catch { toast.error("Failed to save post"); }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content,
      featured_image: post.featured_image || "", category: post.category,
      tags: post.tags?.join(", ") || "", author: post.author, is_published: post.is_published,
      adsense_code: post.adsense_code || "", adsense_position: post.adsense_position || "after_content",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await fetch(`${API_URL}/api/blog/${id}`, { method: "DELETE", credentials: "include" });
      toast.success("Deleted!"); fetchPosts();
    } catch { toast.error("Failed to delete"); }
  };

  const handleReorder = async (newPosts) => {
    setPosts(newPosts);
    try {
      await fetch(`${API_URL}/api/blog/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ post_ids: newPosts.map((p) => p.post_id) }),
      });
    } catch { toast.error("Failed to save order"); }
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({
      title: "", slug: "", excerpt: "", content: "", featured_image: "",
      category: "", tags: "", author: "", is_published: false,
      adsense_code: "", adsense_position: "after_content",
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">Blog</h1>
            <p className="text-muted-foreground">Drag to reorder. Changes save automatically.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="rounded-full" data-testid="add-blog-btn"><Plus className="mr-2" size={18} /> New Post</Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="content" className="gap-2"><FileText size={14} /> Content</TabsTrigger>
                    <TabsTrigger value="adsense" className="gap-2"><Code size={14} /> AdSense</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="title">Title *</Label><Input id="title" name="title" value={formData.title} onChange={handleChange} required /></div>
                      <div className="space-y-2"><Label htmlFor="slug">Slug *</Label><Input id="slug" name="slug" value={formData.slug} onChange={handleChange} required /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="excerpt">Excerpt *</Label><Textarea id="excerpt" name="excerpt" value={formData.excerpt} onChange={handleChange} rows={2} required /></div>
                    
                    {/* Rich Text Editor for Content */}
                    <div className="space-y-2">
                      <Label>Content * <span className="text-xs text-muted-foreground ml-2">(Use toolbar to add images, links, formatting)</span></Label>
                      <BlogEditor value={formData.content} onChange={handleContentChange} placeholder="Write your blog post content. Use the toolbar to add images with links, format text, and more..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="category">Category *</Label><Input id="category" name="category" value={formData.category} onChange={handleChange} required /></div>
                      <div className="space-y-2"><Label htmlFor="author">Author *</Label><Input id="author" name="author" value={formData.author} onChange={handleChange} required /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="tags">Tags (comma separated)</Label><Input id="tags" name="tags" value={formData.tags} onChange={handleChange} /></div>
                    <div className="space-y-2">
                      <Label htmlFor="featured_image">Featured Image URL</Label>
                      <Input id="featured_image" name="featured_image" value={formData.featured_image} onChange={handleChange} />
                      {formData.featured_image && (
                        <img src={formData.featured_image} alt="Preview" className="mt-2 max-h-32 rounded object-cover" onError={(e) => e.target.style.display = 'none'} />
                      )}
                    </div>
                    <div className="flex items-center gap-2"><Switch id="is_published" checked={formData.is_published} onCheckedChange={(c) => setFormData((p) => ({ ...p, is_published: c }))} /><Label htmlFor="is_published">Publish immediately</Label></div>
                  </TabsContent>

                  <TabsContent value="adsense" className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                      <h4 className="font-medium text-amber-800 mb-2">💡 Google AdSense Integration</h4>
                      <p className="text-amber-700">Paste your AdSense code below to display ads in this blog post. The code will be inserted at the position you select.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="adsense_code">AdSense Code</Label>
                      <Textarea
                        id="adsense_code"
                        name="adsense_code"
                        value={formData.adsense_code}
                        onChange={handleChange}
                        rows={8}
                        placeholder={`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>\n<ins class="adsbygoogle"...></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adsense_position">Ad Position</Label>
                      <select
                        id="adsense_position"
                        name="adsense_position"
                        value={formData.adsense_position}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md bg-white"
                      >
                        <option value="before_content">Before Content (Top of post)</option>
                        <option value="after_first_paragraph">After First Paragraph</option>
                        <option value="middle_content">Middle of Content</option>
                        <option value="after_content">After Content (End of post)</option>
                        <option value="sidebar">Sidebar (if layout supports)</option>
                      </select>
                    </div>

                    <div className="bg-slate-50 border rounded-lg p-4 text-sm text-muted-foreground">
                      <h4 className="font-medium text-slate-700 mb-2">How to get AdSense code:</h4>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Go to <a href="https://www.google.com/adsense" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google AdSense</a></li>
                        <li>Navigate to Ads → By ad unit</li>
                        <li>Create or select an ad unit</li>
                        <li>Copy the entire code snippet</li>
                        <li>Paste it in the field above</li>
                      </ol>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit">{editingPost ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => (<div key={i} className="animate-pulse bg-slate-200 h-24 rounded-lg" />))}</div>
        ) : posts.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No blog posts yet.</CardContent></Card>
        ) : (
          <SortableList items={posts} idKey="post_id" onReorder={handleReorder}>
            {posts.map((post) => (
              <SortableItem key={post.post_id} id={post.post_id}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-start gap-4">
                    {post.featured_image && (
                      <img src={post.featured_image} alt={post.title} className="w-24 h-16 object-cover rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{post.title}</h3>
                        {post.is_published ? (
                          <Eye size={14} className="text-green-600 flex-shrink-0" />
                        ) : (
                          <EyeOff size={14} className="text-slate-400 flex-shrink-0" />
                        )}
                        {post.adsense_code && (
                          <Code size={14} className="text-amber-600 flex-shrink-0" title="Has AdSense" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{post.excerpt}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(post.created_at)}</span>
                        <span>{post.category}</span>
                        <span>{post.author}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(post)} data-testid={`edit-post-${post.post_id}`}><Pencil size={16} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(post.post_id)} className="text-destructive hover:text-destructive"><Trash2 size={16} /></Button>
                    </div>
                  </CardContent>
                </Card>
              </SortableItem>
            ))}
          </SortableList>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBlog;
