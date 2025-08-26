import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { Bot, User, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<"login" | "register">("login");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleAuthClick = (type: "login" | "register") => {
    setAuthType(type);
    setShowAuthModal(true);
    setMobileMenuOpen(false);
  };

  const handleChatBotClick = () => {
    navigate("/chat-bot");
    setMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-card">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                CalorEase
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={handleChatBotClick}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bot size={18} />
                <span>Chat-Bot</span>
              </button>
              
              <button
                onClick={() => scrollToSection("about")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sobre nosotros
              </button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAuthClick("login")}
                className="flex items-center space-x-2"
              >
                <User size={18} />
                <span>Iniciar sesión</span>
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => handleAuthClick("register")}
                className="bg-gradient-accent hover:bg-accent/90"
              >
                Crear cuenta
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden animate-fade-up">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-card border-t border-border">
                <button
                  onClick={handleChatBotClick}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-left text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                >
                  <Bot size={18} />
                  <span>Chat-Bot</span>
                </button>
                
                <button
                  onClick={() => scrollToSection("about")}
                  className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted w-full text-left"
                >
                  Sobre nosotros
                </button>
                
                <div className="pt-2 border-t border-border space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAuthClick("login")}
                    className="w-full justify-start"
                  >
                    <User size={18} className="mr-2" />
                    Iniciar sesión
                  </Button>
                  
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAuthClick("register")}
                    className="w-full bg-gradient-accent hover:bg-accent/90"
                  >
                    Crear cuenta
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        type={authType}
      />
    </>
  );
};