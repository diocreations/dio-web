import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, Phone, Calendar, Eye, Trash2, CheckCircle } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminContacts = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchSubmissions = () => {
    fetch(`${API_URL}/api/contact`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { setSubmissions(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await fetch(`${API_URL}/api/contact/${id}/read`, { method: "PUT", credentials: "include" });
      fetchSubmissions();
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this submission?")) return;
    try {
      await fetch(`${API_URL}/api/contact/${id}`, { method: "DELETE", credentials: "include" });
      toast.success("Deleted!");
      fetchSubmissions();
      setSelectedSubmission(null);
    } catch { toast.error("Failed to delete"); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const viewSubmission = (submission) => {
    setSelectedSubmission(submission);
    if (!submission.is_read) handleMarkRead(submission.submission_id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Contact Submissions</h1>
          <p className="text-muted-foreground">View and manage contact form submissions</p>
        </div>

        {loading ? (<div className="space-y-4">{[1, 2, 3].map((i) => (<div key={i} className="animate-pulse bg-slate-200 h-20 rounded-lg" />))}</div>)
          : submissions.length === 0 ? (<Card><CardContent className="py-12 text-center text-muted-foreground">No contact submissions yet.</CardContent></Card>)
          : (<div className="space-y-4">
            {submissions.map((sub) => (
              <Card key={sub.submission_id} className={`hover:shadow-md transition-shadow cursor-pointer ${!sub.is_read ? "border-l-4 border-l-primary" : ""}`} onClick={() => viewSubmission(sub)}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${sub.is_read ? "bg-slate-100" : "bg-primary/10"}`}>
                    <span className={`font-medium ${sub.is_read ? "text-muted-foreground" : "text-primary"}`}>{sub.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{sub.name}</h3>
                      {!sub.is_read && (<span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs">New</span>)}
                    </div>
                    <p className="text-sm font-medium text-foreground mt-0.5">{sub.subject}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{sub.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail size={12} />{sub.email}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(sub.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => viewSubmission(sub)}><Eye size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(sub.submission_id)}><Trash2 size={16} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>)}

        <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Contact Submission</DialogTitle></DialogHeader>
            {selectedSubmission && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">{selectedSubmission.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedSubmission.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedSubmission.email}</p>
                  </div>
                </div>
                {selectedSubmission.phone && (<div className="flex items-center gap-2 text-sm"><Phone size={14} className="text-muted-foreground" /><span>{selectedSubmission.phone}</span></div>)}
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="font-medium text-foreground mb-2">{selectedSubmission.subject}</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedSubmission.message}</p>
                </div>
                <p className="text-xs text-muted-foreground">Received: {formatDate(selectedSubmission.created_at)}</p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => window.location.href = `mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`}>
                    <Mail size={16} className="mr-2" />Reply via Email
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(selectedSubmission.submission_id)}><Trash2 size={16} /></Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminContacts;
