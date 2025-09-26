
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Apartments from "./pages/Apartments";
import BookingPage from "./pages/BookingPage";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Amenities from "./pages/Amenities";
import NotFound from "./pages/NotFound";
import AdminAuth from "./components/admin/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./components/auth/AuthProvider";

// Create a react-query client
const queryClient = new QueryClient();

const App = () => {
  console.log("App component rendering");
  
  return (
    <div style={{ padding: '20px', background: 'white', color: 'black' }}>
      <h1>Test - App is working!</h1>
      <p>If you see this, React is working.</p>
    </div>
  );
};

export default App;
