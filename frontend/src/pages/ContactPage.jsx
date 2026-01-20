import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send, Clock } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ContactPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-violet-subtle" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-6">
                Contact Us
              </span>
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-6">
                Let's Start a
                <br />
                <span className="text-gradient">Conversation</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Have a project in mind? We'd love to hear about it. Drop us a message 
                and we'll get back to you as soon as possible.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div>
                <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-4">
                  Get in Touch
                </h2>
                <p className="text-muted-foreground">
                  We're here to help and answer any question you might have. We look 
                  forward to hearing from you.
                </p>
              </div>

              <div className="space-y-6">
                {settings?.contact_email && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="text-primary" size={24} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Email Us</p>
                      <a
                        href={`mailto:${settings.contact_email}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {settings.contact_email}
                      </a>
                    </div>
                  </div>
                )}

                {settings?.contact_phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="text-primary" size={24} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Call Us</p>
                      <a
                        href={`tel:${settings.contact_phone}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {settings.contact_phone}
                      </a>
                    </div>
                  </div>
                )}

                {settings?.contact_address && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="text-primary" size={24} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Visit Us</p>
                      <p className="text-muted-foreground">
                        {settings.contact_address}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="text-primary" size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Business Hours</p>
                    <p className="text-muted-foreground">
                      Mon - Fri: 9:00 AM - 6:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm"
                data-testid="contact-form"
              >
                <h3 className="font-heading font-bold text-xl text-foreground mb-6">
                  Send Us a Message
                </h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        className="h-12 rounded-lg"
                        data-testid="contact-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                        className="h-12 rounded-lg"
                        data-testid="contact-email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 234 567 8900"
                        className="h-12 rounded-lg"
                        data-testid="contact-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Project Inquiry"
                        required
                        className="h-12 rounded-lg"
                        data-testid="contact-subject"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your project..."
                      required
                      rows={5}
                      className="rounded-lg resize-none"
                      data-testid="contact-message"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary text-primary-foreground rounded-full h-12"
                    disabled={loading}
                    data-testid="contact-submit"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send Message
                        <Send size={18} />
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ContactPage;
