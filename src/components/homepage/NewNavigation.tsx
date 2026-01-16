'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, User } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

const NewNavigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Product', href: '#product' },
    { label: 'Agents', href: '#agents' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Resources', href: '#resources' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-lg py-3'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 transition-transform hover:scale-105"
            aria-label="EduLens Home"
          >
            <Image
              src="/images/edulens-logo.png"
              alt="EduLens Logo"
              width={40}
              height={40}
              className="w-10 h-10"
              priority
            />
            <span className="text-2xl font-bold text-[#0F1724]">EduLens</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[#0F1724] hover:text-[#5C6BFF] transition-colors font-medium text-sm"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="#how-it-works"
              className="text-[#5C6BFF] hover:text-[#7C4DFF] transition-colors font-medium text-sm"
            >
              See How It Works
            </a>
            {session?.user ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-[#5C6BFF] to-[#7C4DFF] text-white px-6 py-2.5 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                aria-label="Go to Dashboard"
              >
                <User size={16} />
                {session.user.name?.split(' ')[0] || 'Dashboard'}
              </button>
            ) : (
              <button
                onClick={() => router.push('/signin')}
                className="bg-gradient-to-r from-[#5C6BFF] to-[#7C4DFF] text-white px-6 py-2.5 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                aria-label="Login"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#0F1724] hover:text-[#5C6BFF] transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[#0F1724] hover:text-[#5C6BFF] transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a
                href="#how-it-works"
                className="text-[#5C6BFF] hover:text-[#7C4DFF] transition-colors font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                See How It Works
              </a>
              {session?.user ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push('/dashboard');
                  }}
                  className="bg-gradient-to-r from-[#5C6BFF] to-[#7C4DFF] text-white px-6 py-3 rounded-full font-semibold shadow-lg w-full flex items-center justify-center gap-2"
                >
                  <User size={18} />
                  {session.user.name?.split(' ')[0] || 'Dashboard'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push('/signin');
                  }}
                  className="bg-gradient-to-r from-[#5C6BFF] to-[#7C4DFF] text-white px-6 py-3 rounded-full font-semibold shadow-lg w-full"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NewNavigation;
