import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "sonner";
import { Route, Switch, useLocation } from "wouter";
import { AgeGate } from "@/components/AgeGate";
import { CartDrawer } from "@/components/Cart";
import { Cursor } from "@/components/Cursor";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CartProvider, FlavorProvider } from "@/lib/store";
import Home from "@/pages/Home";

const About = lazy(() => import("@/pages/About"));
const Products = lazy(() => import("@/pages/Products"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const LabReports = lazy(() => import("@/pages/LabReports"));
const Contact = lazy(() => import("@/pages/Contact"));
const Wholesale = lazy(() => import("@/pages/Wholesale"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const OrderPage = lazy(() => import("@/pages/Order"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminApp = lazy(() => import("@/pages/admin/AdminApp"));

function ScrollTop() {
  const [loc] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [loc]);
  return null;
}

function PageFallback() {
  return <div className="min-h-[100dvh] wall" />;
}

function PublicSite() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/products" component={Products} />
            <Route path="/products/:slug" component={ProductDetail} />
            <Route path="/lab-reports" component={LabReports} />
            <Route path="/contact" component={Contact} />
            <Route path="/wholesale" component={Wholesale} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/order/:number" component={OrderPage} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <AgeGate />
      <Cursor />
    </div>
  );
}

export default function App() {
  const [loc] = useLocation();
  const admin = loc.startsWith("/admin");
  return (
    <FlavorProvider>
      <CartProvider>
        <ScrollTop />
        {admin ? (
          <Suspense fallback={<div className="min-h-screen bg-ink" />}>
            <AdminApp />
          </Suspense>
        ) : (
          <PublicSite />
        )}
        <Toaster theme="dark" position="top-center" toastOptions={{ style: { borderRadius: 0, border: "2px solid var(--flavor)", background: "#0d0d0d" } }} />
      </CartProvider>
    </FlavorProvider>
  );
}
