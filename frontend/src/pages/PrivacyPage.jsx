import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DioChat from "@/components/DioChat";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h1 className="text-4xl font-heading font-bold mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-6">Last updated: February 2025</p>
          
          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                DIOCREATIONS ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website www.diocreations.eu and use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold mt-6 mb-3">Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Fill out our contact form (name, email, phone number, message)</li>
                <li>Interact with our Dio chatbot assistant</li>
                <li>Subscribe to our newsletter</li>
                <li>Request a quote or consultation</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Automatically Collected Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you visit our website, we may automatically collect certain information including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>IP address and browser type</li>
                <li>Device information</li>
                <li>Pages visited and time spent</li>
                <li>Referring website addresses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">We use the collected information to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Respond to your inquiries and provide customer support</li>
                <li>Send you relevant information about our services</li>
                <li>Improve our website and services</li>
                <li>Analyze usage patterns and trends</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>With service providers who assist in our operations</li>
                <li>To comply with legal requirements</li>
                <li>To protect our rights and safety</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">6. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website uses cookies to enhance your browsing experience. You can choose to disable cookies through your browser settings, though this may affect certain functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">You have the right to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-muted-foreground mt-3">
                <strong>Email:</strong> info@diocreations.eu<br />
                <strong>Website:</strong> www.diocreations.eu
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <DioChat />
    </div>
  );
};

export default PrivacyPage;
