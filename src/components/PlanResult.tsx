import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MapDisplay from './MapDisplay';
import { Activity } from '@/src/types';
import { Map as MapIcon, Navigation } from 'lucide-react';

interface PlanResultProps {
  planText: string | null;
  isLoading?: boolean;
  onActivityClick?: (index: number) => void;
  selectedActivityIndex?: number | null;
  userLocation?: { lat: number, lng: number, area?: string } | null;
}

export default function PlanResult({ planText, isLoading, onActivityClick, selectedActivityIndex, userLocation }: PlanResultProps) {
  const [selectedDay, setSelectedDay] = useState<string>('All');

  if (!planText && !isLoading) return null;

  // Robust parsing logic for the elite concierge format
  const activities: Activity[] = [];
  let overview = { destination: '', duration: '', budget: '', vibe: '' };
  let costSummary = '';
  let localTips = '';
  let smartFlow = '';

  if (planText) {
    // 1. Extract Sections
    const overviewMatch = planText.match(/### 🧳 Trip([\s\S]*?)(?=---|$)/i);
    if (overviewMatch) {
      const content = overviewMatch[1];
      overview.destination = content.match(/\* Location:\s*(.*)/i)?.[1].trim() || '';
      overview.duration = content.match(/\* Duration:\s*(.*)/i)?.[1].trim() || '';
      overview.budget = content.match(/\* Budget:\s*(.*)/i)?.[1].trim() || '';
      overview.vibe = content.match(/\* Vibe:\s*(.*)/i)?.[1].trim() || '';
    }

    const costMatch = planText.match(/### 💰 Budget([\s\S]*?)(?=---|$)/i);
    if (costMatch) costSummary = costMatch[1].trim();

    const tipsMatch = planText.match(/### (?:⚡ Smart Tips|💡 Quick Tips)([\s\S]*?)(?=---|$)/i);
    if (tipsMatch) localTips = tipsMatch[1].trim();

    const flowMatch = planText.match(/### ⚡ Smart Flow([\s\S]*?)(?=---|$)/i);
    if (flowMatch) smartFlow = flowMatch[1].trim();

    // 2. Extract Activities from Plan or Near You
    const itineraryMatch = planText.match(/(?:### 📅 Plan|### 📍 Near You)([\s\S]*?)(?=---|$)/i);
    if (itineraryMatch) {
      const itineraryContent = itineraryMatch[1];
      const itineraryLines = itineraryContent.split('\n');
      let currentDay = '';
      let currentActivityBlock: string[] = [];
      let isCapturing = false;

      const processActivityBlock = (blockLines: string[], day: string) => {
        if (blockLines.length === 0) return;
        const firstLine = blockLines[0].replace(/^[\d+*.]\s+/, '');
        
        // Standard: Time – Name 📍 Location (Coords: [Lat, Lng])
        // Near Me: Name 📍 Location (Coords: [Lat, Lng])
        const timeMatch = firstLine.match(/^(.*?) –/);
        
        let nameMatch = firstLine.match(/– (.*?) 📍/); // Standard
        if (!nameMatch) nameMatch = firstLine.match(/^(.*?) 📍/); // Near Me

        const locationMatch = firstLine.match(/📍 (.*?) \(Coords/);
        const coordsMatch = firstLine.match(/\(Coords: \[(.*?)\]\)/);

        const detailLine = blockLines.find(l => l.includes('Detail:'));
        const spendLine = blockLines.find(l => l.includes('Spend:'));
        const travelLine = blockLines.find(l => l.includes('Travel:'));

        if (nameMatch) {
          let coordinates = { lat: 12.9716, lng: 77.5946 };
          if (coordsMatch) {
            const [lat, lng] = coordsMatch[1].split(',').map(c => parseFloat(c.trim()));
            if (!isNaN(lat) && !isNaN(lng)) coordinates = { lat, lng };
          }

          const description = detailLine ? detailLine.replace(/^[ \t]*[*+-]?\s*Detail:\s*/i, '').trim() : '';
          const travelInfo = travelLine ? travelLine.replace(/^[ \t]*[*+-]?\s*Travel:\s*/i, '').trim() : '';

          activities.push({
            name: nameMatch[1].trim(),
            description: travelInfo ? `${description} (${travelInfo})` : description,
            location: locationMatch ? locationMatch[1].trim() : '',
            coordinates,
            cost: spendLine ? spendLine.replace(/^[ \t]*[*+-]?\s*Spend:\s*/i, '').trim() : '',
            timeNeeded: day ? `${day} | ${timeMatch ? timeMatch[1].trim() : ''}` : (timeMatch ? timeMatch[1].trim() : ''),
            distance: '',
            travelTime: ''
          });
        }
      };

      itineraryLines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const dayMatch = trimmed.match(/^#{1,4}\s*(Day \d+)/i);
        if (dayMatch) {
          currentDay = dayMatch[1];
          return;
        }

        // Standard activity start
        const activityStartMatch = trimmed.match(/^[*+\d.]+\s+\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\s*–/);
        // Near Me activity start (e.g., "1. Place Name 📍")
        const nearMeStartMatch = trimmed.match(/^\d+\.\s+.*?📍/);

        if (activityStartMatch || nearMeStartMatch) {
          if (currentActivityBlock.length > 0) {
            processActivityBlock(currentActivityBlock, currentDay);
          }
          currentActivityBlock = [trimmed];
          isCapturing = true;
        } else if (isCapturing) {
          currentActivityBlock.push(trimmed);
        }
      });

      if (currentActivityBlock.length > 0) {
        processActivityBlock(currentActivityBlock, currentDay);
      }
    }
  }

  const closingSignature = "Have a blast. India is best explored when you know the local secrets.";
  const hasClosingSignature = planText?.includes(closingSignature);

  const days = useMemo(() => {
    const uniqueDays = Array.from(new Set(activities.map(a => a.timeNeeded.split('|')[0].trim()).filter(Boolean)));
    return uniqueDays.length > 1 ? ['All', ...uniqueDays] : [];
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (selectedDay === 'All') return activities;
    return activities.filter(a => a.timeNeeded.startsWith(selectedDay));
  }, [activities, selectedDay]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="space-y-12 max-w-4xl"
    >
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b editorial-border pb-6 mb-8 md:mb-12"
      >
        <div className="space-y-3 max-w-2xl px-2 sm:px-0">
          <div className="space-y-1">
            <h2 className="font-serif text-xl md:text-2xl font-bold tracking-tight">
              {planText?.includes('### 📍 Near You') ? '📍 Near You (0–10 km)' : `🧳 ${overview.destination || 'Your Curated Experience'}`}
            </h2>
            <p className="text-[9px] md:text-[10px] uppercase tracking-[2px] md:tracking-[3px] text-brand-muted font-bold">
              {overview.duration || 'Hyper-Local'} • {overview.vibe || 'Real-time'} • {overview.budget || 'Current'}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-start gap-4 pt-2">
          <div className="h-10 w-[1px] bg-brand-ink/10"></div>
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-widest text-brand-muted block font-bold">Status</span>
            <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Minimalist Optimized</span>
          </div>
        </div>
      </motion.header>

      {/* Map Integration */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-brand-accent" />
            <h3 className="text-xs uppercase tracking-widest font-bold text-brand-muted">Optimized Route</h3>
          </div>
          <span className="text-[10px] text-brand-muted italic">Click markers for details</span>
        </div>
        <MapDisplay 
          activities={activities} 
          isLoading={isLoading} 
          selectedActivityIndex={selectedActivityIndex} 
          userLocation={userLocation}
        />
      </motion.div>

      {/* Day Navigation Scroll Bar */}
      {days.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky top-20 z-40 bg-brand-bg/95 backdrop-blur-md -mx-10 px-10 py-4 border-b editorial-border overflow-x-auto scrollbar-hide flex items-center gap-3 no-scrollbar shadow-sm"
        >
          <div className="flex items-center gap-2 mr-4 border-r editorial-border pr-4">
            <span className="text-[10px] uppercase tracking-[2px] font-bold text-brand-muted">Timeline</span>
          </div>
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[2px] whitespace-nowrap transition-all duration-500 ease-out border ${
                selectedDay === day 
                  ? 'bg-brand-ink text-white border-brand-ink shadow-xl shadow-brand-ink/20 scale-105' 
                  : 'bg-white text-brand-muted border-brand-ink/5 hover:border-brand-ink/20 hover:text-brand-ink hover:bg-brand-muted/5'
              }`}
            >
              {day}
            </button>
          ))}
        </motion.div>
      )}

      <div className="space-y-0">
        {isLoading && activities.length === 0 && (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-[40px_1fr_auto_auto] items-center gap-8 py-8 border-b editorial-border animate-pulse">
                <div className="h-10 w-10 bg-brand-muted/10 rounded-full"></div>
                <div className="space-y-3">
                  <div className="h-5 w-64 bg-brand-muted/10 rounded-lg"></div>
                  <div className="h-3 w-80 bg-brand-muted/10 rounded-lg"></div>
                </div>
                <div className="h-4 w-20 bg-brand-muted/10 rounded-lg"></div>
                <div className="h-4 w-16 bg-brand-muted/10 rounded-lg"></div>
              </div>
            ))}
          </div>
        )}
        {filteredActivities.map((activity, i) => {
          // Find original index for map markers
          const originalIndex = activities.indexOf(activity);
          return (
            <motion.div
              key={originalIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onActivityClick?.(originalIndex)}
              transition={{ 
                duration: 0.6, 
                delay: 0.1 + (i * 0.1),
                ease: [0.215, 0.61, 0.355, 1]
              }}
              className={`grid grid-cols-1 md:grid-cols-[80px_1fr_auto_auto] items-start md:items-center gap-4 md:gap-8 py-6 md:py-8 px-4 md:px-6 -mx-2 md:-mx-6 border-b editorial-border group hover:bg-white hover:shadow-xl hover:shadow-brand-ink/5 md:hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer rounded-xl relative z-10 ${
                selectedActivityIndex === originalIndex ? 'bg-white shadow-xl shadow-brand-ink/5 md:-translate-y-1 ring-2 ring-brand-accent/20' : ''
              }`}
            >
              <div className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-colors ${
                selectedActivityIndex === originalIndex ? 'text-brand-accent' : 'text-brand-muted group-hover:text-brand-accent'
              }`}>
                {activity.timeNeeded.includes('|') ? activity.timeNeeded.split('|')[1].trim() : activity.timeNeeded}
              </div>
              
              <div className="space-y-1">
                <h3 className={`text-base md:text-lg font-bold transition-colors ${
                  selectedActivityIndex === originalIndex ? 'text-brand-accent' : 'group-hover:text-brand-accent'
                }`}>
                  {activity.name}
                </h3>
                <p className="text-xs md:text-sm text-brand-muted leading-relaxed max-w-md">
                  {activity.description}
                </p>
              </div>

              <div className="flex justify-between md:block md:text-right min-w-0 md:min-w-[100px] gap-4">
                <div className="md:mb-1">
                  <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-brand-muted block font-bold">Area</span>
                  <span className="text-[10px] md:text-xs font-bold">{activity.location}</span>
                </div>
                <div className="text-right md:text-left md:hidden">
                  <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-brand-muted block font-bold">Cost</span>
                  <span className="text-[10px] md:text-xs font-bold">{activity.cost}</span>
                </div>
              </div>

              <div className="hidden md:block text-right min-w-[80px]">
                <span className="text-[10px] uppercase tracking-wider text-brand-muted block font-bold">Cost</span>
                <span className="text-xs font-bold">{activity.cost}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 + (activities.length * 0.1) }}
        className="space-y-12 pt-8"
      >
        {smartFlow && (
          <div className="space-y-4 p-6 bg-brand-accent/[0.03] border border-brand-accent/20 rounded-xl">
             <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-brand-accent" />
              <h4 className="text-[11px] uppercase tracking-[1.5px] font-bold">⚡ Smart Flow</h4>
            </div>
            <p className="text-sm font-medium text-brand-ink leading-relaxed italic">
              {smartFlow}
            </p>
          </div>
        )}
        
        <div className="grid md:grid-cols-1 gap-12">
          {costSummary && (
            <div className="space-y-3 p-6 bg-brand-ink/[0.02] rounded-xl border editorial-border">
              <h4 className="text-[11px] uppercase tracking-[1.5px] font-bold">💰 Budget</h4>
              <div className="text-sm leading-relaxed text-brand-ink/80 whitespace-pre-wrap">
                {costSummary}
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-1 gap-12">
          {localTips && (
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-[1.5px] font-bold">⚡ Smart Tips</h4>
              <div className="text-sm leading-relaxed text-brand-ink/80 whitespace-pre-wrap">
                {localTips}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {hasClosingSignature && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="pt-12 border-t editorial-border text-center"
        >
          <p className="font-serif italic text-brand-muted text-sm">
            {closingSignature}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
