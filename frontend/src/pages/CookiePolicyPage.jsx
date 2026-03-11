import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DioChat from "@/components/DioChat";
import { Helmet } from "react-helmet-async";

const CookiePolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Cookie Policy | DIOCREATIONS</title>
        <meta name="description" content="Learn about how DIOCREATIONS uses cookies and similar technologies on our website." />
        <link rel="canonical" href="https://www.diocreations.eu/cookies" />
      </Helmet>
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h1 className="text-4xl font-heading font-bold mb-8">Cookie Policy</h1>
          <p className="text-muted-foreground mb-6">Last updated: March 2025</p>
          
          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">1. What Are Cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the website owners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">2. How We Use Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                DIOCREATIONS uses cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our website</li>
                <li>Improve your browsing experience</li>
                <li>Analyze website traffic and performance</li>
                <li>Deliver relevant advertisements (where applicable)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">3. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Essential Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                These cookies are necessary for the website to function properly. They enable basic functions like page navigation, secure access to protected areas, and remembering your cookie consent preferences.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">Analytics Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use analytics cookies (such as PostHog) to understand how visitors interact with our website. This helps us improve the user experience and website performance. These cookies collect information anonymously.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">Functional Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                These cookies allow the website to remember choices you make (such as your color scheme preference) and provide enhanced, personalized features.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">Advertising Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may use advertising cookies (such as Google AdSense) to deliver relevant advertisements to you. These cookies track your browsing habits across websites to build a profile of your interests.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">4. Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Some cookies on our website are set by third-party services. These include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li><strong>Google Analytics/AdSense:</strong> For website analytics and advertising</li>
                <li><strong>PostHog:</strong> For user behavior analytics and session recording</li>
                <li><strong>Stripe:</strong> For secure payment processing</li>
                <li><strong>Google Authentication:</strong> For secure sign-in functionality</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We do not control these third-party cookies. Please refer to the respective third-party privacy policies for more information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">5. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can control and manage cookies in several ways:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li><strong>Browser Settings:</strong> Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies or delete certain cookies.</li>
                <li><strong>Opt-Out Links:</strong> Some third-party services provide opt-out mechanisms:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics Opt-Out</a></li>
                    <li><a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ads Settings</a></li>
                  </ul>
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Please note that blocking some cookies may impact your experience on our website and the services we are able to offer.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">6. Cookie Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                The length of time a cookie remains on your device depends on the type:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li><strong>Session Cookies:</strong> These are temporary and are deleted when you close your browser.</li>
                <li><strong>Persistent Cookies:</strong> These remain on your device for a set period or until you delete them manually. Our persistent cookies typically expire within 1-2 years.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">7. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We encourage you to review this page periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about our use of cookies, please contact us at:
              </p>
              <ul className="list-none mt-3 text-muted-foreground space-y-2">
                <li><strong>Email:</strong> info@diocreations.eu</li>
                <li><strong>Website:</strong> <a href="/contact" className="text-primary hover:underline">Contact Form</a></li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <DioChat />
    </div>
  );
};

export default CookiePolicyPage;
