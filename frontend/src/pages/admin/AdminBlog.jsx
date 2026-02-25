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
import { Plus, Pencil, Trash2, Eye, EyeOff, Calendar } from "lucide-react";
import { SortableList, SortableItem } from "@/components/SortableList";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminBlog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: "", slug: "", excerpt: "", content: "", featured_image: "",
    category: "", tags: "", author: "", is_published: false,
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
    const order = newPosts.map((p) => p.post_id);
    try {
      await fetch(`${API_URL}/api/blog/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ order }),
      });
      toast.success("Order saved!");
    } catch { toast.error("Failed to save order"); }
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({ title: "", slug: "", excerpt: "", content: "", featured_image: "", category: "", tags: "", author: "", is_published: false });
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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="title">Title *</Label><Input id="title" name="title" value={formData.title} onChange={handleChange} required /></div>
                  <div className="space-y-2"><Label htmlFor="slug">Slug *</Label><Input id="slug" name="slug" value={formData.slug} onChange={handleChange} required /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="excerpt">Excerpt *</Label><Textarea id="excerpt" name="excerpt" value={formData.excerpt} onChange={handleChange} rows={2} required /></div>
                <div className="space-y-2"><Label htmlFor="content">Content *</Label><Textarea id="content" name="content" value={formData.content} onChange={handleChange} rows={12} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="category">Category *</Label><Input id="category" name="category" value={formData.category} onChange={handleChange} required /></div>
                  <div className="space-y-2"><Label htmlFor="author">Author *</Label><Input id="author" name="author" value={formData.author} onChange={handleChange} required /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="tags">Tags (comma separated)</Label><Input id="tags" name="tags" value={formData.tags} onChange={handleChange} /></div>
                <div className="space-y-2"><Label htmlFor="featured_image">Featured Image URL</Label><Input id="featured_image" name="featured_image" value={formData.featured_image} onChange={handleChange} /></div>
                <div className="flex items-center gap-2"><Switch id="is_published" checked={formData.is_published} onCheckedChange={(c) => setFormData((p) => ({ ...p, is_published: c }))} /><Label htmlFor="is_published">Publish immediately</Label></div>
                <div className="flex justify-end gap-2 pt-4">
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
            <div className="space-y-3">
              {posts.map((post) => (
                <SortableItem key={post.post_id} id={post.post_id}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-start gap-4">
                      {post.featured_image && (<img src={post.featured_image} alt={post.title} className="w-24 h-16 rounded object-cover flex-shrink-0" />)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground truncate">{post.title}</h3>
                          {post.is_published ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs"><Eye size={12} />Published</span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-xs"><EyeOff size={12} />Draft</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{post.excerpt}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{post.category}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(post.published_at || post.created_at)}</span>
                          <span>by {post.author}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(post.post_id)}><Trash2 size={16} /></Button>
                      </div>
                    </CardContent>
                  </Card>
                </SortableItem>
              ))}
            </div>
          </SortableList>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBlog;
