import React, { useState } from 'react';
import { motion } from 'motion/react';
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
    <div className="min-h-screen bg-brand-bg text-brand-ink flex flex-col">
      {/* Top Header */}
      <header className="h-16 md:h-20 border-b editorial-border px-4 md:px-10 flex items-center justify-between sticky top-0 bg-brand-bg/80 backdrop-blur-md z-50">
        <div className="font-serif text-xl md:text-2xl font-bold tracking-tight">
          TOUR IT<span className="text-brand-accent"> AI</span>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden sm:block text-[9px] md:text-[10px] uppercase tracking-[2px] md:tracking-[4px] text-brand-muted font-medium">
            ELITE INDIA CONCIERGE v3.0
          </div>
          <div className="hidden sm:block h-4 w-[1px] bg-brand-ink/10"></div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-brand-muted">Active</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 h-full">
          
          {/* Left Column: The Concierge */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-8">
            <div className="overflow-hidden whitespace-nowrap border-y editorial-border py-2.5 -mx-4">
              <div className="marquee-track flex gap-8 items-center">
                {['MUMBAI', 'DELHI', 'BANGALORE', 'HYDERABAD', 'CHENNAI', 'KOLKATA', 'JAIPUR', 'GOA', 'VARANASI', 'KOCHI'].map((city, i) => (
                  <span key={i} className="text-[9px] font-bold tracking-[4px] text-brand-muted/40 whitespace-nowrap">
                    {city} <span className="text-brand-accent/20 ml-4">•</span>
                  </span>
                ))}
                {/* Duplicate for seamless loop */}
                {['MUMBAI', 'DELHI', 'BANGALORE', 'HYDERABAD', 'CHENNAI', 'KOLKATA', 'JAIPUR', 'GOA', 'VARANASI', 'KOCHI'].map((city, i) => (
                  <span key={`dup-${i}`} className="text-[9px] font-bold tracking-[4px] text-brand-muted/40 whitespace-nowrap">
                    {city} <span className="text-brand-accent/20 ml-4">•</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4 px-2 lg:px-0">
              <span className="text-[10px] md:text-[11px] uppercase tracking-[3px] text-brand-accent font-bold">
                Your Personal Concierge
              </span>
              <h1 className="font-serif text-3xl md:text-4xl leading-tight">
                Your Elite <br /> India Experience
              </h1>
              <p className="text-brand-muted text-xs md:text-sm leading-relaxed max-w-sm">
                Describe your destination, budget, and vibe. Our elite curator will craft a practical, real-world journey for any corner of India.
              </p>
            </div>

            <div className="bg-white border editorial-border rounded-2xl md:rounded-3xl premium-shadow p-4 md:p-8">
              <ChatInterface 
                onPlanGenerated={handlePlanGenerated} 
                onLoadingChange={setIsGenerating}
                onLocationUpdate={setUserLocation}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6 pt-4 px-2 lg:px-0">
              <div className="space-y-2">
                <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-brand-muted font-bold">Accuracy</span>
                <p className="text-[10px] md:text-[11px] font-medium leading-relaxed">Real-world locations only, verified across India.</p>
              </div>
              <div className="space-y-2">
                <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-brand-muted font-bold">Logic</span>
                <p className="text-[10px] md:text-[11px] font-medium leading-relaxed">Personalized flow based on distance and vibe.</p>
              </div>
            </div>
          </div>

          {/* Right Column: The Journey */}
          <div className="lg:col-span-7 xl:col-span-8 min-h-[500px]">
            {currentPlan || isGenerating ? (
              <div className="h-full">
                <PlanResult 
                  planText={currentPlan} 
                  isLoading={isGenerating} 
                  onActivityClick={setSelectedActivityIndex}
                  selectedActivityIndex={selectedActivityIndex}
                  userLocation={userLocation}
                />
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-8 md:space-y-12 bg-brand-muted/5 rounded-2xl md:rounded-[40px] border border-dashed border-brand-ink/10 p-6 md:p-12"
              >
                <div className="space-y-4 md:space-y-6">
                  <h2 className="font-serif text-3xl md:text-5xl leading-[1.1] tracking-tight">
                    ✨ Your Curated Journey <br /> Starts Here
                  </h2>
                  <p className="text-brand-muted text-base md:text-lg leading-relaxed max-w-md mx-auto">
                    Once you share your preferences with the concierge, your interactive itinerary and route map will appear here.
                  </p>
                </div>

                {/* Live Preview Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="bg-white/50 backdrop-blur-sm border editorial-border p-6 rounded-2xl premium-shadow max-w-md w-full group hover:shadow-xl hover:shadow-brand-ink/5 transition-all duration-500"
                >
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-[10px] uppercase tracking-[3px] text-brand-muted font-bold">Example Trail</span>
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <span className="hover:text-brand-accent transition-colors cursor-default">☕ Third Wave</span>
                      <span className="text-brand-muted/30">→</span>
                      <span className="hover:text-brand-accent transition-colors cursor-default">🌳 Cubbon Park</span>
                      <span className="text-brand-muted/30">→</span>
                      <span className="hover:text-brand-accent transition-colors cursor-default">🍻 Toit</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
