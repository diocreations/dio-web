import AdminLayout from "../../components/AdminLayout";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Briefcase,
  Package,
  FolderKanban,
  FileText,
  Star,
  MessageSquare,
  TrendingUp,
  Eye,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentContacts, setRecentContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/stats`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API_URL}/api/contact`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([statsData, contactsData]) => {
        setStats(statsData);
        setRecentContacts(contactsData.slice(0, 5));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const statCards = [
    {
      title: "Services",
      value: stats?.services || 0,
      icon: Briefcase,
      link: "/admin/services",
      color: "bg-violet-500",
    },
    {
      title: "Products",
      value: stats?.products || 0,
      icon: Package,
      link: "/admin/products",
      color: "bg-purple-500",
    },
    {
      title: "Portfolio",
      value: stats?.portfolio || 0,
      icon: FolderKanban,
      link: "/admin/portfolio",
      color: "bg-indigo-500",
    },
    {
      title: "Blog Posts",
      value: stats?.blog_posts || 0,
      icon: FileText,
      link: "/admin/blog",
      color: "bg-fuchsia-500",
    },
    {
      title: "Testimonials",
      value: stats?.testimonials || 0,
      icon: Star,
      link: "/admin/testimonials",
      color: "bg-pink-500",
    },
    {
      title: "Unread Messages",
      value: stats?.unread_contacts || 0,
      icon: MessageSquare,
      link: "/admin/contacts",
      color: "bg-rose-500",
    },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome to your CMS dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link
                key={index}
                to={stat.link}
                data-testid={`stat-card-${stat.title.toLowerCase().replace(" ", "-")}`}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}
                      >
                        <Icon className="text-white" size={20} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {loading ? "-" : stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stat.title}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Recent Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading">Recent Contact Submissions</CardTitle>
            <Link
              to="/admin/contacts"
              className="text-primary text-sm hover:underline"
              data-testid="view-all-contacts"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/4 bg-slate-200 rounded" />
                      <div className="h-3 w-1/2 bg-slate-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentContacts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No contact submissions yet
              </p>
            ) : (
              <div className="space-y-4">
                {recentContacts.map((contact) => (
                  <div
                    key={contact.submission_id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-medium">
                        {contact.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">
                          {contact.name}
                        </p>
                        {!contact.is_read && (
                          <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(contact.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Add Service", link: "/admin/services", icon: Briefcase },
            { title: "Add Product", link: "/admin/products", icon: Package },
            { title: "Add Portfolio", link: "/admin/portfolio", icon: FolderKanban },
            { title: "Write Blog Post", link: "/admin/blog", icon: FileText },
          ].map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={action.link}>
                <Card className="hover:shadow-md hover:border-violet-200 transition-all cursor-pointer">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Icon className="text-primary" size={24} />
                    </div>
                    <span className="font-medium text-foreground">
                      {action.title}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
