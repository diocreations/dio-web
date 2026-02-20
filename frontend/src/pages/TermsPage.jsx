import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DioChat from "@/components/DioChat";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h1 className="text-4xl font-heading font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-6">Last updated: February 2025</p>
          
          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using the DIOCREATIONS website (www.diocreations.eu) and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">2. Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                DIOCREATIONS provides digital services including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Web and Mobile Application Development</li>
                <li>E-commerce Solutions</li>
                <li>Search Engine Optimization (SEO)</li>
                <li>Local SEO Services</li>
                <li>AI and Private LLM Solutions</li>
                <li>Marketing Automation</li>
                <li>Email Marketing</li>
                <li>Domain Registration and Hosting</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">3. User Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed">When using our services, you agree to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Provide accurate and complete information</li>
                <li>Maintain the confidentiality of any account credentials</li>
                <li>Not use our services for any illegal or unauthorized purpose</li>
                <li>Not interfere with the security or functionality of our website</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">4. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on this website, including text, graphics, logos, images, and software, is the property of DIOCREATIONS or its content suppliers and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">5. Project Terms</h2>
              <h3 className="text-xl font-semibold mt-6 mb-3">Proposals and Quotes</h3>
              <p className="text-muted-foreground leading-relaxed">
                All proposals and quotes are valid for 30 days unless otherwise stated. Prices are subject to change based on project scope modifications.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Payment Terms</h3>
              <p className="text-muted-foreground leading-relaxed">
                Payment terms will be specified in individual project agreements. Standard terms typically require an initial deposit before work begins, with remaining payments due upon project milestones or completion.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Project Timeline</h3>
              <p className="text-muted-foreground leading-relaxed">
                Project timelines are estimates and may vary based on client feedback, scope changes, and other factors. We will communicate any significant delays promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                DIOCREATIONS shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services. Our total liability shall not exceed the amount paid by you for the specific service in question.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">7. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our services are provided "as is" without warranties of any kind, either express or implied. We do not guarantee that our services will be uninterrupted, error-free, or completely secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">8. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to terminate or suspend access to our services at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">9. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the European Union and applicable local jurisdictions, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of our services constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">11. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms of Service, please contact us at:
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

export default TermsPage;
