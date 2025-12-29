"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, ArrowRight, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompletionModal({ isOpen, onClose }: CompletionModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Trigger confetti when modal opens
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const colors = ["#4F46E5", "#7C3AED", "#EC4899", "#F59E0B", "#10B981"];
      const createConfetti = () => {
        for (let i = 0; i < 50; i++) {
          const confetti = document.createElement("div");
          confetti.className = "confetti";
          confetti.style.left = Math.random() * 100 + "%";
          confetti.style.backgroundColor =
            colors[Math.floor(Math.random() * colors.length)];
          confetti.style.animationDelay = Math.random() * 3 + "s";
          confetti.style.animationDuration = Math.random() * 3 + 2 + "s";
          document.body.appendChild(confetti);

          setTimeout(() => confetti.remove(), 5000);
        }
      };

      createConfetti();
    }
  }, [isOpen]);

  const handleRealityMode = () => {
    if (user) {
      // User is authenticated, go directly to Reality mode
      router.push("/roadmap?mode=reality");
    } else {
      // Navigate to signup with dream flow
      router.push("/signup?from=dream");
    }
  };

  const handleSignUp = () => {
    router.push("/signup?from=dream");
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="p-0 max-w-2xl overflow-hidden bg-white border-none shadow-2xl [&>button:last-child]:hidden">
          <DialogTitle className="sr-only">Completion Celebration</DialogTitle>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-8 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4"
            >
              <Sparkles className="w-10 h-10" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold mb-2"
            >
              Congratulations! 🎉
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/90"
            >
              You&apos;ve completed the journey from Dream to Thrive
            </motion.p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Now You Know the Full Picture
              </h3>
              <p className="text-slate-600 leading-relaxed">
                You&apos;ve seen all 12 stages of the study abroad
                journey. From clarifying your dream to arriving at your
                university, you now understand what&apos;s involved at
                each step.
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
              <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Ready to Make It Real?
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                EduLens turns this roadmap into your personalized plan with 
                <span className="font-medium text-emerald-700"> 3 smart scenarios</span>: 
                Dream (ideal), Reality (based on your current situation), and 
                Future (best-case). Get AI-powered tracking, timelines, and guidance.
              </p>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <Button
                onClick={handleRealityMode}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group"
              >
                <span>Proceed to Reality ✨</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              {!user && (
                <Button
                  onClick={handleSignUp}
                  variant="outline"
                  className="w-full py-6 text-lg rounded-xl border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  <span>Sign Up to Save Progress</span>
                </Button>
              )}

              <button
                onClick={onClose}
                className="w-full text-slate-600 hover:text-slate-900 py-3 text-sm transition-colors"
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confetti Styles */}
      <style jsx global>{`
        .confetti {
          position: fixed;
          width: 10px;
          height: 10px;
          top: -10px;
          z-index: 9999;
          animation: confetti-fall linear forwards;
        }

        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}