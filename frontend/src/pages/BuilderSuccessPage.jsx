import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Download, Mail, Loader2 } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BuilderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (orderId) {
      fetch(`${API_URL}/api/builder/order/${orderId}`)
        .then(r => r.json())
        .then(data => {
          setOrder(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-6">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-6" />
              <h1 className="text-3xl font-heading font-bold mb-4 text-green-600">
                Payment Successful!
              </h1>
              <p className="text-muted-foreground mb-8">
                Thank you for your order. Your website is being prepared.
              </p>

              {order && (
                <div className="bg-slate-50 rounded-lg p-6 mb-8 text-left">
                  <h3 className="font-semibold mb-4">Order Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Order ID:</span> {order.order_id}</p>
                    <p><span className="text-muted-foreground">Website:</span> {order.business_name}</p>
                    <p><span className="text-muted-foreground">Category:</span> {order.category}</p>
                    <p><span className="text-muted-foreground">Tier:</span> {order.tier}</p>
                    <p><span className="text-muted-foreground">Delivery:</span> {order.hosting_option === "auto" ? "We Host It" : "Code Download"}</p>
                  </div>
                </div>
              )}

              {order?.hosting_option === "download" ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <Download className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-sm text-blue-700">
                      Your website code will be emailed to you within 24 hours.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-primary/5 rounded-lg p-4">
                    <Mail className="w-8 h-8 mx-auto text-primary mb-2" />
                    <p className="text-sm text-primary">
                      We're setting up your website. You'll receive an email with your login credentials within 24-48 hours.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center mt-8">
                <Link to="/builder">
                  <Button variant="outline">Build Another Website</Button>
                </Link>
                <Link to="/">
                  <Button>Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default BuilderSuccessPage;
