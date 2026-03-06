import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send, Clock, CheckCircle, MessageSquare, Zap, Shield, Users } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEFAULT_SERVICES = [
  "Web Development",
  "Mobile App Development",
  "SEO Services",
  "AI Solutions",
  "E-commerce Development",
  "Digital Marketing",
  "Resume Services",
  "Other"
];

const DEFAULT_BUDGET_RANGES = [
  "Under $1,000",
  "$1,000 - $5,000",
  "$5,000 - $10,000",
  "$10,000 - $25,000",
  "$25,000 - $50,000",
  "$50,000+",
  "Not Sure Yet"
];

const ContactPage = () => {
  const [settings, setSettings] = useState(null);
  const [contactSettings, setContactSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service_interest: "",
    budget_range: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    // Fetch site settings
    fetch(`${API_URL}/api/settings`)
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(console.error);
    
    // Fetch contact form settings
    fetch(`${API_URL}/api/contact-settings`)
      .then((res) => res.json())
      .then((data) => setContactSettings(data))
      .catch(console.error);
  }, []);

  const serviceOptions = contactSettings?.service_options?.length > 0 
    ? contactSettings.service_options 
    : DEFAULT_SERVICES;
  
  const budgetRanges = contactSettings?.budget_ranges?.length > 0 
    ? contactSettings.budget_ranges 
    : DEFAULT_BUDGET_RANGES;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
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
        toast.success("Message sent successfully! We'll get back to you within 24 hours.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          service_interest: "",
          budget_range: "",
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

  const trustIndicators = [
    { icon: Zap, title: "Fast Response", description: "We respond within 24 hours" },
    { icon: Shield, title: "100% Confidential", description: "Your information is secure" },
    { icon: Users, title: "Expert Team", description: "10+ years of experience" },
  ];

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
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                Let's Connect
              </span>
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-6">
                Let's Start a
                <br />
                <span className="text-gradient">Conversation</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Have a project in mind? We'd love to hear about it. Share your vision 
                and let's create something amazing together.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trustIndicators.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 justify-center md:justify-start"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <item.icon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
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
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
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
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
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
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
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
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
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

              {/* Quick Response Card */}
              <Card className="bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="text-green-600" size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Quick Response Guarantee</p>
                      <p className="text-sm text-muted-foreground">
                        We typically respond to all inquiries within 24 hours during business days. 
                        For urgent matters, please call us directly.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg"
                data-testid="contact-form"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="text-primary" size={20} />
                  </div>
                  <h3 className="font-heading font-bold text-xl text-foreground">
                    Send Us a Message
                  </h3>
                </div>

                <div className="space-y-5">
                  {/* Name & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {/* Phone & Company */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Your Company"
                        className="h-12 rounded-lg"
                        data-testid="contact-company"
                      />
                    </div>
                  </div>

                  {/* Service Interest & Budget */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Service Interest</Label>
                      <Select
                        value={formData.service_interest}
                        onValueChange={(value) => handleSelectChange("service_interest", value)}
                      >
                        <SelectTrigger className="h-12 rounded-lg" data-testid="contact-service">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceOptions.map((service) => (
                            <SelectItem key={service} value={service}>
                              {service}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Budget Range</Label>
                      <Select
                        value={formData.budget_range}
                        onValueChange={(value) => handleSelectChange("budget_range", value)}
                      >
                        <SelectTrigger className="h-12 rounded-lg" data-testid="contact-budget">
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          {budgetRanges.map((range) => (
                            <SelectItem key={range} value={range}>
                              {range}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      required
                      className="h-12 rounded-lg"
                      data-testid="contact-subject"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your project, goals, and timeline..."
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

                  <p className="text-xs text-center text-muted-foreground">
                    By submitting this form, you agree to our{" "}
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                  </p>
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
