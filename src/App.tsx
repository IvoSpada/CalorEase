import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// --- CORRECCIÓN AQUÍ ---
// Añadidas las extensiones .tsx explícitamente a las rutas de las páginas
import Index from "./pages/Index.tsx";
import { ChatBot } from "./pages/ChatBot.tsx";
import NotFound from "./pages/NotFound.tsx";
import Profile from './pages/Profile.tsx';
import Test from "./pages/test.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import  LiveChat from "./pages/LiveChat.tsx"; 

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/chat-bot" element={<ChatBot />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/test" element={<Test />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live-chat" element={<LiveChat />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;