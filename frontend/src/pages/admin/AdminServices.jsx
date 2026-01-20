import AdminLayout from "../../components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    short_description: "",
    description: "",
    icon: "Code",
    features: "",
    image_url: "",
    order: 0,
    is_active: true,
  });

  const fetchServices = () => {
    fetch(`${API_URL}/api/services`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "title" && !editingService
        ? { slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const features = formData.features.split("\n").filter((f) => f.trim());

    try {
      const body = { ...formData, features };
      const url = editingService
        ? `${API_URL}/api/services/${editingService.service_id}`
        : `${API_URL}/api/services`;
      const method = editingService ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingService ? "Service updated!" : "Service created!");
        setDialogOpen(false);
        resetForm();
        fetchServices();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save service");
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      slug: service.slug,
      short_description: service.short_description,
      description: service.description,
      icon: service.icon,
      features: service.features?.join("\n") || "",
      image_url: service.image_url || "",
      order: service.order,
      is_active: service.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await fetch(`${API_URL}/api/services/${serviceId}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast.success("Service deleted!");
      fetchServices();
    } catch (error) {
      toast.error("Failed to delete service");
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({
      title: "",
      slug: "",
      short_description: "",
      description: "",
      icon: "Code",
      features: "",
      image_url: "",
      order: 0,
      is_active: true,
    });
  };

  const iconOptions = ["Code", "Search", "MapPin", "Brain", "Zap", "Mail", "Globe", "Server", "Shield", "Layout"];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">Services</h1>
            <p className="text-muted-foreground">Manage your services</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="rounded-full" data-testid="add-service-btn">
                <Plus className="mr-2" size={18} /> Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleChange} required data-testid="service-title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input id="slug" name="slug" value={formData.slug} onChange={handleChange} required data-testid="service-slug" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description *</Label>
                  <Input id="short_description" name="short_description" value={formData.short_description} onChange={handleChange} required data-testid="service-short-desc" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Full Description *</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} required data-testid="service-desc" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <select id="icon" name="icon" value={formData.icon} onChange={handleChange} className="w-full h-10 rounded-md border px-3" data-testid="service-icon">
                      {iconOptions.map((icon) => (<option key={icon} value={icon}>{icon}</option>))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Order</Label>
                    <Input id="order" name="order" type="number" value={formData.order} onChange={handleChange} data-testid="service-order" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Features (one per line)</Label>
                  <Textarea id="features" name="features" value={formData.features} onChange={handleChange} rows={4} placeholder="Feature 1&#10;Feature 2&#10;Feature 3" data-testid="service-features" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input id="image_url" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://..." data-testid="service-image" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))} data-testid="service-active" />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit" data-testid="save-service-btn">{editingService ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (<div key={i} className="animate-pulse bg-slate-200 h-20 rounded-lg" />))}
          </div>
        ) : services.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No services yet. Add your first service!</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <Card key={service.service_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <GripVertical className="text-muted-foreground cursor-grab" size={20} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{service.title}</h3>
                      {!service.is_active && (<span className="px-2 py-0.5 rounded bg-slate-200 text-xs">Inactive</span>)}
                    </div>
                    <p className="text-sm text-muted-foreground">{service.short_description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(service)} data-testid={`edit-service-${service.slug}`}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(service.service_id)} data-testid={`delete-service-${service.slug}`}><Trash2 size={16} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminServices;
