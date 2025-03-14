
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Index from "./pages/Index";
import Predictions from "./pages/Predictions";
import PredictionsDetails from "./pages/PredictionsDetails";
import Interface from "./pages/Interface";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <div className="flex min-h-screen bg-gradient-custom">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 transition-all duration-300 ease-in-out">
            <div className="max-w-7xl mx-auto space-y-8">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/predictions" element={<Predictions />} />
                <Route path="/predictions-details" element={<PredictionsDetails />} />
                <Route path="/interface" element={<Interface />} />
              </Routes>
            </div>
          </main>
          <Toaster />
          <Sonner />
        </div>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
