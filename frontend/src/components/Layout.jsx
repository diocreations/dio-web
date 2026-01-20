import Navbar from "./Navbar";
import Footer from "./Footer";
import DioChat from "./DioChat";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
      <DioChat />
    </div>
  );
};

export default Layout;
