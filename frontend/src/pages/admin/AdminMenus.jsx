import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminMenus = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("nav");

  useEffect(() => { fetchMenus(); }, []);

  const fetchMenus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/menus`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please login to manage menus");
        } else {
          toast.error("Failed to load menus");
        }
        setMenus([]);
        return;
      }
      const data = await res.json();
      setMenus(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error("Fetch menus error:", err);
      toast.error("Failed to load menus"); 
      setMenus([]);
    }
    finally { setLoading(false); }
  };

  const seedDefaultMenus = async () => {
    if (!window.confirm("This will add default menu items. Existing items will be kept. Continue?")) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/menus/seed-defaults`, {
        method: "POST", credentials: "include",
      });
      if (res.ok) {
        toast.success("Default menus added!");
        fetchMenus();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to seed menus");
      }
    } catch { toast.error("Failed to seed menus"); }
    finally { setSaving(false); }
  };

  const filteredMenus = menus.filter(m => m.menu_type === tab && !m.parent_id).sort((a, b) => (a.order || 0) - (b.order || 0));
  const childMenus = (parentId) => menus.filter(m => m.parent_id === parentId).sort((a, b) => (a.order || 0) - (b.order || 0));

  const addItem = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/menus`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_type: tab, label: "New Item", path: "/", order: filteredMenus.length }),
      });
      const item = await res.json();
      setMenus(prev => [...prev, item]);
      toast.success("Item added");
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  const addSubItem = async (parentId) => {
    setSaving(true);
    try {
      const children = childMenus(parentId);
      const res = await fetch(`${API_URL}/api/admin/menus`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_type: tab, label: "Sub Item", path: "/", parent_id: parentId, order: children.length }),
      });
      const item = await res.json();
      setMenus(prev => [...prev, item]);
      toast.success("Sub-item added");
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  const saveItem = async (itemId, updates) => {
    try {
      await fetch(`${API_URL}/api/admin/menus/${itemId}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch { toast.error("Save failed"); }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      await fetch(`${API_URL}/api/admin/menus/${itemId}`, { method: "DELETE", credentials: "include" });
      setMenus(prev => prev.filter(m => m.item_id !== itemId && m.parent_id !== itemId));
      toast.success("Deleted");
    } catch { toast.error("Failed"); }
  };

  const moveItem = async (itemId, direction, isChild = false, parentId = null) => {
    const items = isChild ? childMenus(parentId) : filteredMenus;
    const currentIndex = items.findIndex(m => m.item_id === itemId);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= items.length) return;
    
    const currentItem = items[currentIndex];
    const swapItem = items[newIndex];
    
    // Update local state
    setMenus(prev => prev.map(m => {
      if (m.item_id === currentItem.item_id) return { ...m, order: newIndex };
      if (m.item_id === swapItem.item_id) return { ...m, order: currentIndex };
      return m;
    }));
    
    // Save to backend
    try {
      await Promise.all([
        saveItem(currentItem.item_id, { order: newIndex }),
        saveItem(swapItem.item_id, { order: currentIndex }),
      ]);
    } catch { toast.error("Failed to reorder"); }
  };

  // Individual menu item component with local state for inputs
  const MenuItem = ({ item, isChild = false, index, totalItems, parentId = null }) => {
    const [localLabel, setLocalLabel] = useState(item.label);
    const [localPath, setLocalPath] = useState(item.path);
    const children = childMenus(item.item_id);

    // Sync local state when item changes from parent
    useEffect(() => {
      setLocalLabel(item.label);
      setLocalPath(item.path);
    }, [item.label, item.path]);

    const handleLabelBlur = () => {
      if (localLabel !== item.label) {
        setMenus(prev => prev.map(m => m.item_id === item.item_id ? { ...m, label: localLabel } : m));
        saveItem(item.item_id, { label: localLabel });
      }
    };

    const handlePathBlur = () => {
      if (localPath !== item.path) {
        setMenus(prev => prev.map(m => m.item_id === item.item_id ? { ...m, path: localPath } : m));
        saveItem(item.item_id, { path: localPath });
      }
    };

    const handleActiveChange = (v) => {
      setMenus(prev => prev.map(m => m.item_id === item.item_id ? { ...m, is_active: v } : m));
      saveItem(item.item_id, { is_active: v });
    };

    return (
      <div className={`border rounded-lg p-3 ${isChild ? "ml-8 bg-slate-50" : "bg-white"}`} data-testid={`menu-item-${item.item_id}`}>
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-muted-foreground" />
          
          {/* Move Up/Down buttons */}
          <div className="flex flex-col gap-0.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5" 
              onClick={() => moveItem(item.item_id, "up", isChild, parentId)}
              disabled={index === 0}
              title="Move up"
            >
              <ChevronUp size={12} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5" 
              onClick={() => moveItem(item.item_id, "down", isChild, parentId)}
              disabled={index === totalItems - 1}
              title="Move down"
            >
              <ChevronDown size={12} />
            </Button>
          </div>
          
          <Input
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={handleLabelBlur}
            className="h-8 text-sm flex-1"
            placeholder="Label"
          />
          <Input
            value={localPath}
            onChange={(e) => setLocalPath(e.target.value)}
            onBlur={handlePathBlur}
            className="h-8 text-sm w-36"
            placeholder="/path"
          />
          <div className="flex items-center gap-1">
            <Switch
              checked={item.is_active !== false}
              onCheckedChange={handleActiveChange}
            />
          </div>
          {!isChild && (
            <Button variant="ghost" size="sm" onClick={() => addSubItem(item.item_id)} title="Add sub-item" data-testid={`add-sub-${item.item_id}`}>
              <Plus size={14} />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => deleteItem(item.item_id)} className="text-red-500 hover:text-red-700">
            <Trash2 size={14} />
          </Button>
        </div>
        {/* Children */}
        {children.map((child, childIndex) => (
          <MenuItem 
            key={child.item_id} 
            item={child} 
            isChild 
            index={childIndex} 
            totalItems={children.length}
            parentId={item.item_id}
          />
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="admin-menus-heading">Menu Editor</h1>
            <p className="text-sm text-muted-foreground">Manage navigation and footer menus. Use arrows to reorder items.</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="nav">Navigation Menu</TabsTrigger>
            <TabsTrigger value="footer">Footer Menu</TabsTrigger>
          </TabsList>

          {["nav", "footer"].map(menuType => (
            <TabsContent key={menuType} value={menuType}>
              <div className="space-y-2 mb-4">
                {loading ? (
                  <div className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></div>
                ) : filteredMenus.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground mb-4">No menu items found.</p>
                      <Button onClick={seedDefaultMenus} disabled={saving} variant="outline">
                        Load Default Menu Items
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredMenus.map((item, index) => (
                    <MenuItem 
                      key={item.item_id} 
                      item={item} 
                      index={index} 
                      totalItems={filteredMenus.length}
                    />
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={addItem} disabled={saving} data-testid="add-menu-item-btn">
                  <Plus size={16} className="mr-1" /> Add Item
                </Button>
                {filteredMenus.length < 3 && (
                  <Button onClick={seedDefaultMenus} disabled={saving} variant="outline" size="sm">
                    Load Defaults
                  </Button>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminMenus;
