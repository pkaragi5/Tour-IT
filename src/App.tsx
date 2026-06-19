import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ChatInterface from './components/ChatInterface';
import PlanResult from './components/PlanResult';

export default function App() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number, area?: string } | null>(null);

  const handlePlanGenerated = (plan: string) => {
    setCurrentPlan(plan);
    setSelectedActivityIndex(null); // Reset selection on new plan
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink flex flex-col font-sans selection:bg-brand-accent/10 selection:text-brand-accent">
      
      {/* Top Header */}
      <header className="h-16 md:h-20 border-b border-brand-ink/[0.06] px-4 md:px-10 flex items-center justify-between sticky top-0 bg-brand-bg/80 backdrop-blur-md z-50">
        <div className="font-serif text-xl md:text-2xl font-bold tracking-tight select-none cursor-pointer" onClick={() => {
          setCurrentPlan(null);
          setIsGenerating(false);
        }}>
          TOUR IT<span className="text-brand-accent"> AI</span>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden sm:block text-[9px] md:text-[10px] uppercase tracking-[3px] text-brand-muted font-bold">
            ELITE INDIA CONCIERGE v3.0
          </div>
          <div className="hidden sm:block h-3.5 w-[1px] bg-brand-ink/10"></div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-brand-muted">Active</span>
          </div>
        </div>
      </header>

      {/* Main Column */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col space-y-16 md:space-y-24">
        
        {/* Section 1: Hero Intro & Interactive Input */}
        <section className="space-y-8 text-center sm:text-left">
          <div className="space-y-3">
            <span className="text-[10px] md:text-xs uppercase tracking-[4px] text-brand-accent font-black block">
              Your Personal Concierge
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] text-brand-ink">
              Your Elite India <br className="hidden sm:inline" /> Experience
            </h1>
            <p className="text-brand-muted text-sm md:text-base leading-relaxed max-w-xl mx-auto sm:mx-0 font-medium pt-1">
              Describe your destination, budget, and vibe. Our elite curator will craft a practical, real-world journey for any corner of India.
            </p>
          </div>

          <div className="w-full">
            <ChatInterface 
              onPlanGenerated={handlePlanGenerated} 
              onLoadingChange={setIsGenerating}
              onLocationUpdate={setUserLocation}
            />
          </div>
        </section>

        {/* Section 3: Trust Indicators */}
        <section className="border-t border-brand-ink/[0.06] pt-8 md:pt-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-xs md:text-sm text-brand-muted font-bold tracking-tight text-center">
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-600 text-sm md:text-base">✓</span>
              <span>Real-world locations only, verified across India</span>
            </div>
            <div className="hidden sm:block h-3 w-[1px] bg-brand-ink/10"></div>
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-600 text-sm md:text-base">✓</span>
              <span>Personalized flow based on distance and vibe</span>
            </div>
          </div>
        </section>

        {/* Section 4: Results Placeholder or Live Interactive Experience */}
        <section className="border-t border-brand-ink/[0.06] pt-12 md:pt-16">
          <AnimatePresence mode="wait">
            {currentPlan || isGenerating ? (
              <motion.div 
                key="plan-active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="w-full"
              >
                {/* Expand the centered container slightly to support premium map visuals and side elements in PlanResult */}
                <div className="w-full max-w-4xl mx-auto">
                  <PlanResult 
                    planText={currentPlan} 
                    isLoading={isGenerating} 
                    onActivityClick={setSelectedActivityIndex}
                    selectedActivityIndex={selectedActivityIndex}
                    userLocation={userLocation}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center text-center space-y-8 md:space-y-10"
              >
                <div className="space-y-3">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight">
                    ✨ Your Curated Journey Starts Here
                  </h2>
                  <p className="text-brand-muted text-xs md:text-sm leading-relaxed max-w-md mx-auto font-medium">
                    Once you share your preferences, your itinerary and route map will appear here.
                  </p>
                </div>

                {/* Example Trail card built like a luxurious physical print detail */}
                <div className="relative bg-white border border-brand-ink/[0.05] p-8 md:p-10 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 max-w-xs sm:max-w-md w-full">
                  <span className="text-[9px] uppercase tracking-[3px] text-brand-muted/70 font-bold block mb-6">Example Curated Trail</span>
                  
                  {/* Elegant premium connected chronological layout */}
                  <div className="flex flex-col items-center space-y-4 relative">
                    <div className="absolute top-6 bottom-6 w-[1.5px] bg-brand-ink/[0.06] left-1/2 -translate-x-1/2"></div>
                    
                    {[
                      { icon: "☕", title: "Third Wave", category: "Premium Roasters" },
                      { icon: "🌳", title: "Cubbon Park", category: "Lush Botanic Trails" },
                      { icon: "🍻", title: "Toit", category: "Artisanal Brewpub" }
                    ].map((step, idx) => (
                      <div key={idx} className="relative flex flex-col items-center bg-white border border-brand-ink/[0.03] px-5 py-3 rounded-xl shadow-none hover:shadow-sm transition-all duration-300 w-48 sm:w-56 z-10">
                        <div className="text-xl mb-1">{step.icon}</div>
                        <div className="text-xs sm:text-sm font-bold text-brand-ink">{step.title}</div>
                        <div className="text-[9px] text-brand-muted font-bold uppercase tracking-wider">{step.category}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </main>

      {/* Minimal footer */}
      <footer className="py-8 border-t border-brand-ink/[0.04] text-center text-[10px] font-bold text-brand-muted uppercase tracking-[2px] mt-auto">
        TOUR IT AI • Made for curious eyes • {new Date().getFullYear()}
      </footer>
    </div>
  );
}
