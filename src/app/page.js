"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Shield, Smartphone, Star, Users, CheckCircle, ArrowRight, Sparkles, Heart } from 'lucide-react'

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(true)

  const features = [
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Agenda Inteligente",
      description: "Gestiona tus citas de forma simple e intuitiva con validación automática de horarios."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Seguridad Médica",
      description: "Validación automática de restricciones médicas para garantizar tu seguridad."
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "App Móvil",
      description: "Accede desde cualquier dispositivo. Instala la app para una experiencia completa."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Para Profesionales",
      description: "Interfaz diseñada especialmente para profesionales no técnicos."
    }
  ]

  const treatments = [
    { name: "Tratamientos Faciales", price: "Desde $8,000", duration: "60-90 min" },
    { name: "Tratamientos Corporales", price: "Desde $12,000", duration: "90-120 min" },
    { name: "Depilación Láser", price: "Desde $6,000", duration: "30-60 min" },
    { name: "Rejuvenecimiento", price: "Desde $15,000", duration: "120 min" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">DHérmica</h1>
              <p className="text-xs text-muted-foreground">Estética</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-secondary/10"></div>
        <div className="container mx-auto text-center relative z-10">
          <div className="mb-6">
            <Badge className="mb-4 bg-accent/20 text-accent-foreground border-accent/30">
              <Sparkles className="h-4 w-4 mr-1" />
              Nueva Plataforma Digital
            </Badge>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Tu Belleza, <br />
            Nuestra Tecnología
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            La plataforma más avanzada para gestionar tus tratamientos estéticos. 
            Agenda, consulta y vive una experiencia única e innovadora.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg transform transition-all hover:scale-105">
                <Calendar className="mr-2 h-5 w-5" />
                Agendar Cita
              </Button>
            </Link>
            <Link href="/treatments">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 hover:bg-muted/50">
                Ver Tratamientos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-1">500+</div>
              <div className="text-sm text-muted-foreground">Clientes Felices</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-1">24/7</div>
              <div className="text-sm text-muted-foreground">Acceso Online</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">15+</div>
              <div className="text-sm text-muted-foreground">Tratamientos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-1">5★</div>
              <div className="text-sm text-muted-foreground">Valoración</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Tecnología que <span className="text-accent">Transforma</span>
            </h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Descubre cómo nuestra plataforma revoluciona la experiencia en tratamientos estéticos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-accent/20 bg-background/60 backdrop-blur-sm">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 text-accent">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Treatments Preview */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Nuestros <span className="text-secondary">Tratamientos</span>
            </h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explora nuestra gama completa de tratamientos diseñados para realzar tu belleza natural
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {treatments.map((treatment, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border border-border hover:border-accent/30">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h4 className="font-semibold mb-2 text-foreground">{treatment.name}</h4>
                    <div className="text-accent font-bold text-lg mb-1">{treatment.price}</div>
                    <div className="flex items-center justify-center text-muted-foreground text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      {treatment.duration}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/treatments">
              <Button size="lg" variant="outline" className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                Ver Todos los Tratamientos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary via-secondary to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto text-center relative z-10">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Lista para Transformar tu Rutina de Belleza?
          </h3>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Únete a cientos de clientes que ya disfrutan de una experiencia estética completamente digitalizada
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
                <Calendar className="mr-2 h-5 w-5" />
                Agendar Mi Primera Cita
              </Button>
            </Link>
            <Link href="/treatments">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary">
                Conocer Más
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">DHérmica Estética</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                La plataforma digital que revoluciona la experiencia en tratamientos estéticos. 
                Tecnología al servicio de tu belleza.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-1 text-accent" />
                  Seguro y Confiable
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Star className="h-4 w-4 mr-1 text-accent" />
                  5★ Valoración
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/treatments?category=facial" className="hover:text-accent transition-colors">Tratamientos Faciales</Link></li>
                <li><Link href="/treatments?category=corporal" className="hover:text-accent transition-colors">Tratamientos Corporales</Link></li>
                <li><Link href="/treatments?category=depilacion" className="hover:text-accent transition-colors">Depilación Láser</Link></li>
                <li><Link href="/treatments?category=rejuvenecimiento" className="hover:text-accent transition-colors">Rejuvenecimiento</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-accent transition-colors">Centro de Ayuda</Link></li>
                <li><Link href="/contact" className="hover:text-accent transition-colors">Contacto</Link></li>
                <li><Link href="/terms" className="hover:text-accent transition-colors">Términos de Uso</Link></li>
                <li><Link href="/privacy" className="hover:text-accent transition-colors">Política de Privacidad</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 DHérmica Estética. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}