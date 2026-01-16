"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  MapPin,
  FileCheck,
  Target,
  Map,
  BarChart3,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

type HomeClientProps = {
  initialIsSignedIn?: boolean;
};

const HomeClient: React.FC<HomeClientProps> = ({
  initialIsSignedIn = false,
}) => {
  const router = useRouter();
  const [typedText, setTypedText] = useState("");
  const fullText = "Your Dreams Deserve a Clear Vision";
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
        setTimeout(() => setShowCursor(false), 500);
      }
    }, 80);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.05),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.05),transparent_50%)]" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content - Static with Typing Animation */}
            <div className="text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="block text-gray-900">
                  {typedText.substring(0, 21)}
                  {typedText.length < 21 && showCursor && (
                    <span className="animate-pulse">|</span>
                  )}
                </span>
                <span className="block">
                  {typedText.length > 21 && (
                    <>
                      <span className="text-gray-900">a </span>
                      <span className="text-cyan-500">
                        {typedText.substring(23)}
                      </span>
                      {!isTypingComplete && showCursor && (
                        <span className="animate-pulse text-cyan-500">|</span>
                      )}
                    </>
                  )}
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl">
                The study abroad{" "}
                <span className="relative inline-block font-bold text-gray-900 px-1">
                  co-pilot
                  <svg
                    className="absolute left-0 right-0 -bottom-[2px] w-full rotate-[-1deg]"
                    viewBox="0 0 120 10"
                    preserveAspectRatio="none"
                  >
                    {/* Main pen stroke */}
                    <path
                      d="
        M3 6
        C12 5.2, 22 6.4, 32 6
        S52 5.6, 62 6
        S82 6.6, 92 6
        S108 5.4, 117 6
      "
                      stroke="currentColor"
                      strokeWidth="2.2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Soft ink bleed */}
                    <path
                      d="
        M3 6.6
        C14 6, 24 7, 34 6.6
        S54 6.4, 64 6.6
        S84 7.2, 94 6.6
        S108 6.2, 117 6.6
      "
                      stroke="currentColor"
                      strokeWidth="1"
                      opacity="0.25"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                that digitizes and synchronizes your entire multi-year journey —
                from today until admission.
              </p>

              <button
                onClick={() =>
                  router.push(initialIsSignedIn ? "/dashboard" : "/signup")
                }
                className="group bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                {initialIsSignedIn ? "Go to Dashboard" : "Start Your Journey"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="mt-6 flex items-center gap-2 text-sm text-teal-600">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span className="font-medium">
                  Early Access · Free to Start
                </span>
              </div>
            </div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <motion.div
                className="relative w-full h-[500px]"
                animate={{ 
                  y: [0, -20, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Image
                  src="/images/hero-student.png"
                  alt="Study Abroad Journey"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section - "The study abroad journey feels chaotic" */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              The study abroad journey feels{" "}
              <span className="text-cyan-500">chaotic</span>
            </h2>
            <p className="text-lg text-gray-600">
              Study-abroad recruitment evolved, yet the student journey stayed
              fragmented.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: "❗",
                percentage: "63%",
                title: "Information Chaos",
                description:
                  'say "unclear or missing information" would prevent them from applying',
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
              },
              {
                icon: "📋",
                percentage: "16%",
                title: "Scattered Workflow",
                description:
                  "apply to a single program — most juggle multiple applications, deadlines, and document versions",
                bgColor: "bg-cyan-50",
                borderColor: "border-cyan-200",
              },
              {
                icon: "❓",
                percentage: "63%",
                title: "Who to Ask?",
                description:
                  "want to talk to current international students before applying",
                bgColor: "bg-teal-50",
                borderColor: "border-teal-200",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`${item.bgColor} ${item.borderColor} border-2 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow`}
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {item.percentage}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Sources: ICEF Monitor, Educations.com survey
          </p>
        </div>
      </section>

      {/* Solution Section - "Your co-pilot from today until admission" */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your co-pilot from{" "}
              <span className="text-cyan-500">today until admission</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Instead of jumping between random sites and videos, see exactly
              where you stand, what&apos;s realistic, and what to do next.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Eye,
                badge: "NOW",
                badgeColor: "bg-gray-100 text-gray-700",
                title: "Clear picture",
                description:
                  "My profile today, my strengths, gaps, and what is actually possible",
                borderColor: "border-gray-200",
              },
              {
                icon: Map,
                badge: "WHILE PREPARING",
                badgeColor: "bg-cyan-100 text-cyan-700",
                title: "Living roadmap",
                description:
                  "Adjusts with every step • Scores • Skills • Activities",
                borderColor: "border-cyan-200",
              },
              {
                icon: FileCheck,
                badge: "WHEN APPLYING",
                badgeColor: "bg-green-100 text-green-700",
                title: "One profile adapts",
                description:
                  "Auto-fills for each university. Just review and submit",
                borderColor: "border-green-200",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`border-2 ${item.borderColor} rounded-2xl p-8 hover:shadow-lg transition-shadow bg-white`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`${item.badgeColor} px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide`}
                  >
                    {item.badge}
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-gray-700" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-xl font-semibold text-gray-700 italic">
              &quot;No guessing. No scattered tools. No missed steps.&quot;
            </p>
          </div>
        </div>
      </section>

      {/* Features Section - "Everything synced. Everything personalized." */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything synced.{" "}
              <span className="text-cyan-500">Everything personalized.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Target,
                title: "Smart Profile",
                description:
                  "Know where you stand today — your strengths, gaps, and what's actually possible for YOU.",
                gradient: "from-blue-50 to-indigo-50 border-blue-200",
              },
              {
                icon: Map,
                title: "Living Roadmap",
                description:
                  "A personalized plan that adjusts as you grow. Tests, skills, activities — all synced and updated.",
                gradient: "from-cyan-50 to-blue-50 border-cyan-200",
              },
              {
                icon: FileText,
                title: "Smart Document Builder",
                description:
                  "One profile, many apps. AI-powered SOPs, Resumes, CVs that adapt for each university.",
                gradient: "from-green-50 to-emerald-50 border-green-200",
              },
              {
                icon: BarChart3,
                title: "Dual Tracker",
                description:
                  "Track YOUR progress + Monitor universities, professors, deadlines & opportunities.",
                gradient: "from-purple-50 to-pink-50 border-purple-200",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`bg-gradient-to-br ${item.gradient} border-2 rounded-2xl p-8 hover:shadow-lg transition-shadow`}
              >
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <item.icon className="w-7 h-7 text-gray-700" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Phases Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your Journey, <span className="text-orange-500">Your Pace</span>
            </h2>
            <p className="text-lg text-gray-600">
              Whether you&apos;re just starting to dream or ready to hit submit,
              EduLens meets you where you are.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-orange-300 via-blue-300 to-green-300 hidden md:block" />

            <div className="space-y-16">
              {[
                {
                  phase: "NOW",
                  bgColor: "bg-orange-50",
                  borderColor: "border-orange-300",
                  badgeBg: "bg-orange-500",
                  ringColor: "ring-orange-500",
                  title: "Dream & Discover",
                  description:
                    "Explore possibilities, understand requirements, and start building your academic profile. No pressure, just exploration.",
                  position: "left",
                },
                {
                  phase: "WHILE PREPARING",
                  bgColor: "bg-blue-50",
                  borderColor: "border-blue-300",
                  badgeBg: "bg-blue-500",
                  ringColor: "ring-blue-500",
                  title: "Plan & Prepare",
                  description:
                    "Build your roadmap, gather documents, prepare for tests, and strengthen your profile — with AI guiding every step.",
                  position: "right",
                },
                {
                  phase: "WHEN APPLYING",
                  bgColor: "bg-green-50",
                  borderColor: "border-green-300",
                  badgeBg: "bg-green-500",
                  ringColor: "ring-green-500",
                  title: "Execute & Apply",
                  description:
                    "Submit applications with confidence. Track every deadline, document, and status in one unified dashboard.",
                  position: "left",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{
                    opacity: 0,
                    x: item.position === "left" ? -50 : 50,
                  }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className={`relative md:w-1/2 ${item.position === "right" ? "md:ml-auto md:pl-12" : "md:pr-12"}`}
                >
                  <div
                    className={`border-2 ${item.borderColor} ${item.bgColor} rounded-2xl p-8 relative`}
                  >
                    <div
                      className={`absolute top-8 ${item.position === "right" ? "-left-6" : "-right-6"} w-12 h-12 ${item.badgeBg} rounded-full hidden md:flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white`}
                    >
                      {index + 1}
                    </div>
                    <div
                      className={`inline-block ${item.badgeBg} text-white px-4 py-2 rounded-full text-xs font-bold uppercase mb-4`}
                    >
                      {item.phase}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Early Access Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              We&apos;re just getting started
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Join early. Shape the future of study abroad.
            </h2>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8"
            >
              <div className="flex items-center gap-2 text-green-600 font-bold text-lg mb-6">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Available NOW
              </div>

              <div className="space-y-4">
                {[
                  "Smart Profile",
                  "Living Roadmap",
                  "Document Builder",
                  "Dual Tracker",
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span className="text-gray-800 font-medium">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <p className="text-xl text-gray-600 italic max-w-3xl mx-auto mb-12">
              &quot;Be among the first to build your study abroad journey on the
              platform that grows with you.&quot;
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  icon: (
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  ),
                  title: "First access to new features",
                },
                {
                  icon: (
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ),
                  title: "Priority support",
                },
                {
                  icon: (
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  ),
                  title: "Shape what we build",
                },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="text-gray-600 mb-3">{benefit.icon}</div>
                  <p className="text-gray-700 font-medium">{benefit.title}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Journey?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of students who are already using EduLens to
              navigate their study abroad journey with confidence.
            </p>
            <button
              onClick={() =>
                router.push(initialIsSignedIn ? "/dashboard" : "/signup")
              }
              className="group bg-white text-blue-600 hover:bg-gray-100 px-10 py-4 rounded-lg text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomeClient;
