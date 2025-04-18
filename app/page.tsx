import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Star, Activity, Heart, Dumbbell, Timer, Award } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b border-border/40 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent flex items-center">
            <Activity className="h-6 w-6 mr-2 text-primary" />
            FitChatly AI
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Login
            </Link>
            <Link href="/register">
              <Button size="sm" variant="fitness" className="rounded-xl shadow-md">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-block mb-4 px-4 py-1 bg-primary/10 rounded-full text-primary font-semibold text-sm">
            Your AI Fitness Companion
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Transform Your Fitness Journey with AI
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Get personalized workout plans, nutrition advice, and motivation from our advanced AI assistant to help you reach your fitness goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="fitness" className="rounded-xl shadow-md w-full sm:w-auto">
                Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="rounded-xl w-full sm:w-auto border-2">
                Try Demo
              </Button>
            </Link>
          </div>

          {/* Fitness stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md hover-lift">
              <div className="text-3xl font-bold text-primary">10k+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md hover-lift">
              <div className="text-3xl font-bold text-secondary">500+</div>
              <div className="text-sm text-muted-foreground">Workout Plans</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md hover-lift">
              <div className="text-3xl font-bold text-accent">98%</div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md hover-lift">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-white to-primary/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-1 bg-secondary/10 rounded-full text-secondary font-semibold text-sm">
              POWERFUL FEATURES
            </div>
            <h2 className="text-3xl font-extrabold mb-4">Elevate Your Fitness Experience</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform provides everything you need to reach your fitness goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover-lift fitness-card asymmetric-card">
              <CardHeader>
                <div className="fitness-icon mb-4">
                  <Dumbbell className="h-6 w-6" />
                </div>
                <CardTitle>Personalized Workouts</CardTitle>
                <CardDescription>Custom workout plans tailored to your goals and fitness level</CardDescription>
              </CardHeader>
              <CardContent>
                Our AI analyzes your fitness level, goals, and preferences to create personalized workout routines that
                evolve as you progress.
              </CardContent>
            </Card>

            <Card className="hover-lift fitness-card asymmetric-card">
              <CardHeader>
                <div className="fitness-icon mb-4">
                  <Heart className="h-6 w-6" />
                </div>
                <CardTitle>Nutrition Guidance</CardTitle>
                <CardDescription>Get meal plans and nutrition advice aligned with your fitness goals</CardDescription>
              </CardHeader>
              <CardContent>
                Receive customized nutrition recommendations, meal plans, and healthy recipes that complement your
                workout routine.
              </CardContent>
            </Card>

            <Card className="hover-lift fitness-card asymmetric-card">
              <CardHeader>
                <div className="fitness-icon mb-4">
                  <Timer className="h-6 w-6" />
                </div>
                <CardTitle>Real-time Coaching</CardTitle>
                <CardDescription>Get instant feedback and form corrections during your workouts</CardDescription>
              </CardHeader>
              <CardContent>
                Our AI coach provides real-time guidance, form corrections, and motivation to help you maximize your
                workout effectiveness.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-br from-accent/5 to-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-1 bg-accent/10 rounded-full text-accent font-semibold text-sm">
              SUCCESS STORIES
            </div>
            <h2 className="text-3xl font-extrabold mb-4">Transformations That Inspire</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how our AI fitness assistant has helped people achieve their goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass p-6 rounded-xl shadow-lg hover-lift">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold">
                  J
                </div>
                <div className="ml-3">
                  <p className="font-bold">Jessica K.</p>
                  <p className="text-sm text-muted-foreground">Lost 30 lbs in 3 months</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "The personalized workout plans and nutrition advice were game-changers for me. The AI knew exactly when
                to push me harder and when to suggest recovery."
              </p>
              <div className="flex mt-4">
                <Star className="h-4 w-4 text-accent" />
                <Star className="h-4 w-4 text-accent" />
                <Star className="h-4 w-4 text-accent" />
                <Star className="h-4 w-4 text-accent" />
                <Star className="h-4 w-4 text-accent" />
              </div>
            </div>

            <div className="glass p-6 rounded-xl shadow-lg hover-lift">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div className="ml-3">
                  <p className="font-bold">Michael T.</p>
                  <p className="text-sm text-muted-foreground">Marathon Runner</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "As a competitive runner, I needed specific training advice. The AI coach helped me improve my form and
                shave 15 minutes off my marathon time."
              </p>
              <div className="flex mt-4">
                <Star className="h-4 w-4 text-accent" />
                <Star className="h-4 w-4 text-accent" />
                <Star className="h-4 w-4 text-accent" />
                <Star className="h-4 w-4 text-accent" />
                <Star className="h-4 w-4 text-accent" />
              </div>
            </div>

            <div className="glass p-6 rounded-xl shadow-lg hover-lift">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div className="ml-3">
                  <p className="font-bold">Sarah L.</p>
                  <p className="text-sm text-muted-foreground">Fitness Beginner</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "I was intimidated by fitness, but the AI made it approachable. It started me with simple exercises and
                gradually increased intensity as I got stronger."
              </p>
              <div className="flex mt-4">
                <Star className="h-4 w-4 text-accent" />
                <Star className="h-4 w-4 text-accent" />
                <Star className="h-4 w-4 text-accent" />
                <Star className="h-4 w-4 text-accent" />
                <Star className="h-4 w-4 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="fitness-card mx-auto max-w-3xl p-10">
            <Award className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-extrabold mb-6">Ready to transform your fitness journey?</h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of users who are already achieving their fitness goals with our AI coach.
            </p>
            <Link href="/register">
              <Button size="lg" variant="fitness" className="rounded-xl shadow-md px-8 py-6 text-lg">
                Start Your Transformation
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-6">No credit card required. Free 14-day trial.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-white">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                AI Chat
              </div>
              <p className="text-sm text-muted-foreground mt-2">© 2025 AI Chat. All rights reserved.</p>
            </div>
            <div className="flex gap-8">
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

