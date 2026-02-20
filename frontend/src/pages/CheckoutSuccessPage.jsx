import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [paymentData, setPaymentData] = useState(null);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    const pollPaymentStatus = async (attempts = 0) => {
      const maxAttempts = 10;
      const pollInterval = 2000;

      if (attempts >= maxAttempts) {
        setStatus("timeout");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/checkout/status/${sessionId}`);
        if (!response.ok) throw new Error("Failed to check status");
        
        const data = await response.json();
        setPaymentData(data);

        if (data.payment_status === "paid") {
          setStatus("success");
          return;
        } else if (data.status === "expired") {
          setStatus("expired");
          return;
        }

        // Continue polling
        setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
      } catch (error) {
        console.error("Error:", error);
        if (attempts < maxAttempts - 1) {
          setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
        } else {
          setStatus("error");
        }
      }
    };

    pollPaymentStatus();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              {status === "loading" && (
                <>
                  <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-6" />
                  <h1 className="text-2xl font-heading font-bold mb-4">Processing Payment...</h1>
                  <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
                </>
              )}

              {status === "success" && (
                <>
                  <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-6" />
                  <h1 className="text-3xl font-heading font-bold mb-4 text-green-600">Payment Successful!</h1>
                  <p className="text-muted-foreground mb-6">
                    Thank you for your purchase. Your order has been confirmed.
                  </p>
                  {paymentData && (
                    <div className="bg-slate-50 rounded-lg p-6 mb-6 text-left">
                      <h3 className="font-semibold mb-3">Order Details:</h3>
                      <p><span className="text-muted-foreground">Product:</span> {paymentData.metadata?.product_title}</p>
                      <p><span className="text-muted-foreground">Amount:</span> {paymentData.currency} {paymentData.amount?.toFixed(2)}</p>
                      <p><span className="text-muted-foreground">Status:</span> <span className="text-green-600 font-medium">Paid</span></p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mb-6">
                    A confirmation email will be sent to you shortly. Our team will contact you within 24 hours.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Link to="/products">
                      <Button variant="outline">View More Products</Button>
                    </Link>
                    <Link to="/">
                      <Button>Back to Home</Button>
                    </Link>
                  </div>
                </>
              )}

              {(status === "error" || status === "expired" || status === "timeout") && (
                <>
                  <XCircle className="w-20 h-20 mx-auto text-red-500 mb-6" />
                  <h1 className="text-3xl font-heading font-bold mb-4 text-red-600">
                    {status === "expired" ? "Session Expired" : "Payment Issue"}
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    {status === "expired" 
                      ? "Your payment session has expired. Please try again."
                      : "We couldn't confirm your payment. If you were charged, please contact support."}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Link to="/products">
                      <Button>Try Again</Button>
                    </Link>
                    <Link to="/contact">
                      <Button variant="outline">Contact Support</Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutSuccessPage;
