// src/pages/Index.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { AddFoodModal } from "@/components/AddFoodModal";
import { Target, Heart, Zap } from "lucide-react";
import heroImage from "@/assets/hero-nutrition.jpg";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";

const Index = () => {
  // UI state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<"login" | "register">("login");
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);

  // Auth state from hook
  const { usuario, isLoggedIn, login, register, logout, refreshMe } = useAuth();

  const navigate = useNavigate();
  const { toast } = useToast();

  // Static UI content
  const features = [
    {
      icon: Target,
      title: "Seguimiento Preciso",
      description:
        "Monitorea calorías y nutrientes con precisión usando IA avanzada",
    },
    {
      icon: Heart,
      title: "Salud Personalizada",
      description: "Recomendaciones adaptadas a tu estilo de vida y objetivos",
    },
    {
      icon: Zap,
      title: "Análisis Inteligente",
      description: "IA que aprende de tus hábitos para mejorar tus resultados",
    },
  ];

  const stats = [
    { number: "10K+", label: "Usuarios activos" },
    { number: "50K+", label: "Comidas analizadas" },
    { number: "95%", label: "Precisión en análisis" },
    { number: "4.9★", label: "Calificación promedio" },
  ];

  // On mount: quick connectivity test and refresh user
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("usuarios");
        if (r.ok) console.log("Conexión backend OK - usuarios:", r.data);
      } catch (err) {
        console.error("Error probando /usuarios:", err);
      }
    })();

    (async () => {
      try {
        const r = await refreshMe();
        if (r.ok) console.log("Usuario restaurado:", r.data);
      } catch (err) {
        console.error("Error en refreshMe:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthClick = (type: "login" | "register") => {
    setAuthType(type);
    setShowAuthModal(true);
  };

  // Este handler se pasa a AuthModal; AuthModal ya valida cliente y construye payload correcto
  const handleAuthSubmit = async (payload: any) => {
    try {
      if (authType === "login") {
        const res = await login(payload);
        if (!res.ok) {
          const errMsg =
            (res.error && (res.error.message || JSON.stringify(res.error))) ||
            "Error al iniciar sesión";
          toast({ title: "Error", description: errMsg, variant: "destructive" });
          return;
        }
        toast({ title: "Sesión iniciada", description: "Bienvenido de nuevo" });
      } else {
        const res = await register(payload);
        if (!res.ok) {
          if (res.status === 422 && res.error?.errors) {
            const msgs = Object.values(res.error.errors).flat().join(", ");
            toast({
              title: "Errores de validación",
              description: msgs,
              variant: "destructive",
            });
          } else {
            const errMsg =
              (res.error && (res.error.message || JSON.stringify(res.error))) ||
              "Error al registrar";
            toast({ title: "Error", description: errMsg, variant: "destructive" });
          }
          return;
        }
        toast({ title: "Cuenta creada", description: "Bienvenido!" });
      }

      // ✅ redirigimos siempre al dashboard
      setShowAuthModal(false);
      navigate("/dashboard");
    } catch (err) {
      console.error("handleAuthSubmit error:", err);
      toast({
        title: "Error",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      const res = await logout();
      if (!res.ok) {
        toast({
          title: "Sesión cerrada (local)",
          description:
            "No se pudo invalidar token en servidor. Sesión local eliminada.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Sesión cerrada", description: "Hasta la próxima" });
      }
      navigate("/");
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const goToDashboard = () => navigate("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <Navbar>
        {/* Header dinámico según estado de sesión */}
        {isLoggedIn && usuario ? (
          <div className="ml-auto mr-4 font-semibold flex items-center gap-4">
            <span>Bienvenido, {usuario.nombre}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        ) : (
          <div className="ml-auto mr-4 flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAuthClick("register")}
            >
              Registrarse
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAuthClick("login")}
            >
              Iniciar sesión
            </Button>
          </div>
        )}
      </Navbar>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-10"></div>
        <div className="relative max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
            <div className="space-y-8 animate-fade-up">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    CalorEase
                  </span>
                  <br />
                  <span className="text-foreground">Tu nutrición</span>
                  <br />
                  <span className="bg-gradient-accent bg-clip-text text-transparent">
                    inteligente
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  {isLoggedIn && usuario
                    ? `Hola ${usuario.nombre}, disfruta de tu nutrición inteligente`
                    : "Revoluciona tu alimentación con IA. Seguimiento nutricional personalizado, análisis inteligente y recomendaciones que se adaptan a tu estilo de vida."}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {!isLoggedIn ? (
                  <>
                    <Button
                      variant="hero"
                      size="xl"
                      onClick={() => handleAuthClick("register")}
                    >
                      Crear cuenta gratis
                    </Button>
                    <Button
                      variant="premium"
                      size="xl"
                      onClick={() => handleAuthClick("login")}
                    >
                      Iniciar sesión
                    </Button>
                  </>
                ) : (
                  <Button variant="hero" size="xl" onClick={goToDashboard}>
                    Ir a mi dashboard
                  </Button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="text-center animate-fade-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-float">
              <div className="relative rounded-2xl overflow-hidden shadow-elegant">
                <img
                  src={heroImage}
                  alt="CalorEase - Plataforma de seguimiento nutricional"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
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
              ¿Por qué elegir{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                CalorEase?
              </span>
              ?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Combinamos inteligencia artificial con ciencia nutricional para
              ofrecerte la mejor experiencia de seguimiento alimentario
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-card transition-all duration-300 hover:scale-105"
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-accent rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon
                      size={32}
                      className="text-accent-foreground"
                    />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        type={authType}
        onSubmit={handleAuthSubmit}
      />

      <AddFoodModal
        isOpen={showAddFoodModal}
        onClose={() => setShowAddFoodModal(false)}
      />
    </div>
  );
};

export default Index;