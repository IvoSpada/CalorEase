import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { AddFoodModal } from "@/components/AddFoodModal";
import { Target, Heart, Zap, Users, TrendingUp, Shield, Plus } from "lucide-react";
import heroImage from "@/assets/hero-nutrition.jpg";
const Index = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<"login" | "register">("register");
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const handleAuthClick = (type: "login" | "register") => {
    setAuthType(type);
    setShowAuthModal(true);
  };
  const features = [{
    icon: Target,
    title: "Seguimiento Preciso",
    description: "Monitorea calorías y nutrientes con precisión usando IA avanzada"
  }, {
    icon: Heart,
    title: "Salud Personalizada",
    description: "Recomendaciones adaptadas a tu estilo de vida y objetivos"
  }, {
    icon: Zap,
    title: "Análisis Inteligente",
    description: "IA que aprende de tus hábitos para mejorar tus resultados"
  }];
  const stats = [{
    number: "10K+",
    label: "Usuarios activos"
  }, {
    number: "50K+",
    label: "Comidas analizadas"
  }, {
    number: "95%",
    label: "Precisión en análisis"
  }, {
    number: "4.9★",
    label: "Calificación promedio"
  }];
  return <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-10"></div>
        <div className="relative max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
            {/* Content */}
            <div className="space-y-8 animate-fade-up">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    CalorEase
                  </span>
                  <br />
                  <span className="text-foreground">
                    Tu nutrición
                  </span>
                  <br />
                  <span className="bg-gradient-accent bg-clip-text text-transparent">
                    inteligente
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-lg">
                  Revoluciona tu alimentación con IA. Seguimiento nutricional personalizado, 
                  análisis inteligente y recomendaciones que se adaptan a tu estilo de vida.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" size="xl" onClick={() => handleAuthClick("register")} className="hover-scale">
                  Crear cuenta gratis
                </Button>
                
                <Button variant="premium" size="xl" onClick={() => handleAuthClick("login")} className="hover-scale">
                  Iniciar sesión
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => <div key={index} className="text-center animate-fade-up" style={{
                animationDelay: `${index * 0.1}s`
              }}>
                    <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>)}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative animate-float">
              <div className="relative rounded-2xl overflow-hidden shadow-elegant">
                <img src={heroImage} alt="CalorEase - Plataforma de seguimiento nutricional" className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
              </div>
              
              {/* Floating Action Button */}
              <div className="absolute bottom-4 right-4">
                
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Por qué elegir <span className="bg-gradient-accent bg-clip-text text-transparent">CalorEase?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Combinamos inteligencia artificial con ciencia nutricional para ofrecerte 
              la mejor experiencia de seguimiento alimentario
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => <Card key={index} className="group hover:shadow-card transition-all duration-300 hover:scale-105">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-accent rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon size={32} className="text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Sobre <span className="bg-gradient-primary bg-clip-text text-transparent">CalorEase</span>
              </h2>
              
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  CalorEase nació de la necesidad de democratizar el acceso a una nutrición 
                  inteligente y personalizada. Utilizamos tecnología de vanguardia para hacer 
                  que el seguimiento nutricional sea simple, preciso y motivador.
                </p>
                
                <p>
                  Nuestra plataforma combina inteligencia artificial, ciencia nutricional 
                  y diseño centrado en el usuario para crear una experiencia única que 
                  se adapta a tu estilo de vida.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Users className="text-accent" size={20} />
                  <span className="font-medium">Comunidad activa</span>
                </div>
                <div className="flex items-center space-x-3">
                  <TrendingUp className="text-accent" size={20} />
                  <span className="font-medium">Resultados medibles</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="text-accent" size={20} />
                  <span className="font-medium">Datos seguros</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="text-accent" size={20} />
                  <span className="font-medium">IA avanzada</span>
                </div>
              </div>
            </div>

            <Card className="shadow-card">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 bg-gradient-accent bg-clip-text text-transparent">
                  Nuestro Objetivo
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-accent-foreground font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Educación Nutricional</h4>
                      <p className="text-muted-foreground">
                        Empoderarte con conocimiento para tomar decisiones alimentarias informadas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-accent-foreground font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Hábitos Saludables</h4>
                      <p className="text-muted-foreground">
                        Facilitar la creación de rutinas alimentarias sostenibles y saludables
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-accent-foreground font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Bienestar Integral</h4>
                      <p className="text-muted-foreground">
                        Mejorar tu calidad de vida a través de una alimentación consciente
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-center text-muted-foreground italic">
                    "Transformamos la ciencia nutricional en herramientas accesibles para todos"
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} type={authType} />
      
      <AddFoodModal isOpen={showAddFoodModal} onClose={() => setShowAddFoodModal(false)} />
    </div>;
};
export default Index;