import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, Trash2, Calendar, Loader2, AlertTriangle, User, Briefcase, Building } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminCoverLetter = () => {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const fetchLetters = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/cover-letters`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setLetters(Array.isArray(data) ? data : []);
      } else {
        toast.error("Failed to load cover letters");
      }
    } catch {
      toast.error("Failed to load cover letters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLetters(); }, []);

  const handleDelete = async (letterId) => {
    if (!window.confirm("Delete this cover letter? This cannot be undone.")) return;
    setDeleting(letterId);
    try {
      const res = await fetch(`${API_URL}/api/admin/cover-letters/${letterId}`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) {
        toast.success("Cover letter deleted");
        setLetters(letters.filter(l => l.letter_id !== letterId));
      } else {
        toast.error("Failed to delete");
      }
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(null); }
  };

  const handleDeleteAll = async () => {
    if (letters.length === 0) {
      toast.info("No cover letters to delete");
      return;
    }
    const confirmed = window.confirm(`⚠️ DELETE ALL ${letters.length} COVER LETTERS?\n\nThis action CANNOT be undone!`);
    if (!confirmed) return;
    
    const doubleConfirm = window.confirm(`Are you ABSOLUTELY sure? ${letters.length} cover letters will be deleted forever.`);
    if (!doubleConfirm) return;
    
    setDeletingAll(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/cover-letters/delete-all`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Deleted ${data.deleted_count || letters.length} cover letters`);
        setLetters([]);
      } else {
        toast.error("Failed to delete all cover letters");
      }
    } catch { toast.error("Failed to delete all cover letters"); }
    finally { setDeletingAll(false); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map((i) => <div key={i} className="bg-slate-200 h-24 rounded-lg" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl" data-testid="admin-cover-letters-title">Cover Letters</h1>
            <p className="text-muted-foreground">Manage AI-generated cover letters ({letters.length} total)</p>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-xl font-bold">{letters.length}</p>
                <p className="text-xs text-muted-foreground">Total Letters</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <User className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xl font-bold">{new Set(letters.map(l => l.user_id || 'anonymous')).size}</p>
                <p className="text-xs text-muted-foreground">Unique Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Building className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-xl font-bold">{new Set(letters.map(l => l.company).filter(Boolean)).size}</p>
                <p className="text-xs text-muted-foreground">Companies</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cover Letters List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><FileText size={18} /> All Cover Letters</CardTitle>
                <CardDescription>View and manage generated cover letters</CardDescription>
              </div>
              {letters.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                  className="gap-2"
                  data-testid="delete-all-letters-btn"
                >
                  {deletingAll ? (
                    <><Loader2 size={14} className="animate-spin" /> Deleting...</>
                  ) : (
                    <><AlertTriangle size={14} /> Delete All ({letters.length})</>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {letters.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No cover letters generated yet.</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {letters.map((letter) => (
                  <div key={letter.letter_id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-purple-100 mt-1">
                        <FileText size={16} className="text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{letter.job_title || "Unknown Position"}</span>
                          {letter.company && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building size={10} /> {letter.company}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(letter.created_at)}</span>
                          {letter.tone && <span className="px-1.5 py-0.5 bg-slate-100 rounded">{letter.tone}</span>}
                        </div>
                        {letter.cover_letter && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                            {letter.cover_letter.substring(0, 200)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 ml-2"
                      onClick={() => handleDelete(letter.letter_id)}
                      disabled={deleting === letter.letter_id}
                      data-testid={`delete-letter-${letter.letter_id}`}
                    >
                      {deleting === letter.letter_id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCoverLetter;
