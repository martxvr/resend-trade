import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Room from "./pages/Room";
import Embed from "./pages/Embed";
import Profile from "./pages/Profile";
import ChecklistBuilder from "./pages/ChecklistBuilder";
import CreatorWaitlist from "./pages/CreatorWaitlist";
import NotFound from "./pages/NotFound";
import { DemoOne } from "./demo";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="/embed/:roomId" element={<Embed />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/checklist" element={<ChecklistBuilder />} />
            <Route path="/creator-studio" element={<CreatorWaitlist />} />
            <Route path="/demo-sign-in" element={<DemoOne />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
