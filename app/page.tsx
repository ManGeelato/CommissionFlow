import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  DollarSign, 
  Users, 
  BarChart3, 
  Clock, 
  Shield, 
  Zap,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">CommissionFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Button asChild size="sm">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </nav>
          <Button asChild size="sm" className="md:hidden">
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Zap className="w-4 h-4" />
              <span>Smart commission tracking for service businesses</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance mb-6">
              Track commissions.
              <br />
              <span className="text-primary">Grow your team.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
              CommissionFlow makes it easy to track staff commissions, approve entries, 
              and manage payouts for salons, spas, and service businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/auth/sign-up">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#features">See How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to manage commissions
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From entry logging to payout reports, CommissionFlow handles it all.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Quick Entry Logging"
              description="Staff can log services in seconds with pre-set service options and automatic commission calculations."
            />
            <FeatureCard
              icon={<DollarSign className="w-6 h-6" />}
              title="Flexible Commission Rates"
              description="Support for percentage, flat-rate, and tiered commission structures per staff member."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Team Management"
              description="Easily onboard staff, set individual rates, and track performance across your team."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Real-Time Analytics"
              description="Get instant insights into revenue, commissions, and team performance with visual dashboards."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Approval Workflow"
              description="Review and approve entries before finalizing payouts with a simple approval process."
            />
            <FeatureCard
              icon={<CheckCircle2 className="w-6 h-6" />}
              title="Payout Tracking"
              description="Mark entries as paid and keep accurate records of all commission payments."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple workflow, powerful results
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get started in minutes and streamline your commission tracking today.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              step="1"
              title="Set Up Your Business"
              description="Create your account, add your services, and invite your team members."
            />
            <StepCard
              step="2"
              title="Staff Logs Services"
              description="Team members log completed services with automatic commission calculations."
            />
            <StepCard
              step="3"
              title="Approve & Pay"
              description="Review entries, approve commissions, and track payouts all in one place."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to simplify commission tracking?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Join hundreds of service businesses using CommissionFlow to manage their team commissions.
          </p>
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link href="/auth/sign-up">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-medium">CommissionFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for service businesses. Made simple.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function StepCard({
  step,
  title,
  description
}: {
  step: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
        {step}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
