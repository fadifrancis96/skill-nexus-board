
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

export default function Landing() {
  const { currentUser } = useAuth();

  const features = [
    "Find skilled contractors for your projects",
    "Get competitive bids from qualified professionals",
    "Browse and apply to open job opportunities",
    "Secure payment system and clear communication",
    "Rating system to ensure quality work",
    "Easy project management tools",
  ];

  const howItWorks = [
    {
      title: "For Job Posters",
      steps: [
        "Create an account and verify your identity",
        "Post your job with detailed requirements",
        "Review offers from interested contractors",
        "Select the best contractor for your needs",
        "Manage your project through completion",
      ],
    },
    {
      title: "For Contractors",
      steps: [
        "Sign up and build your professional profile",
        "Browse available jobs in your expertise",
        "Submit competitive offers to clients",
        "Get hired and complete quality work",
        "Build your reputation through ratings and reviews",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link to="/" className="text-2xl font-bold text-primary">
                JobNexus
              </Link>
            </div>
            <nav className="hidden md:flex space-x-4">
              <Link
                to="/#features"
                className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
              >
                Features
              </Link>
              <Link
                to="/#how-it-works"
                className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
              >
                How It Works
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <Button asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register">Register</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white to-gray-50 py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Connect with Top Talent and Find Great Projects
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8">
                JobNexus brings together skilled contractors and job posters in 
                a seamless marketplace designed to make hiring and finding work simple.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" className="text-lg">
                  <Link to="/register">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg">
                  <Link to="/jobs">Browse Jobs</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Why Choose JobNexus?
              </h2>
              <p className="text-gray-600">
                Our platform provides all the tools you need to successfully connect
                job posters with skilled contractors.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 bg-primary bg-opacity-10 p-2 rounded-full">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-lg">{feature}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-gray-600">
                Simple steps to start hiring or finding work on our platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {howItWorks.map((category, idx) => (
                <div key={idx}>
                  <h3 className="text-xl font-semibold mb-6 text-center">
                    {category.title}
                  </h3>
                  <div className="space-y-6">
                    {category.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex">
                        <div className="mr-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold">
                            {stepIdx + 1}
                          </div>
                        </div>
                        <div>
                          <p className="text-lg">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <Button asChild size="lg">
                <Link to="/register">Join JobNexus Today</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <Link to="/" className="text-2xl font-bold text-white">
                JobNexus
              </Link>
              <p className="mt-2 text-gray-400">
                Connecting talent with opportunity
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/jobs" className="text-gray-400 hover:text-white">
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-white">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-white">
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">
                Have questions? Contact our support team.
              </p>
              <p className="text-gray-400 mt-2">
                support@jobnexus.com
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>© {new Date().getFullYear()} JobNexus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
