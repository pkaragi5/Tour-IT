import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MapDisplay from './MapDisplay';
import WeatherWidget from './WeatherWidget';
import LiveConciergeFeed from './LiveConciergeFeed';
import { Activity, NluIntent } from '@/src/types';
import { 
  Map as MapIcon, 
  Navigation,
  Compass,
  Calendar,
  Users,
  Coins,
  MapPin,
  Clock,
  Sparkles,
  Luggage,
  Star,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Check,
  Wallet,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  TrendingUp,
  Info
} from 'lucide-react';

const SOCIAL_PROOF_SNIPPETS = [
  "Expertly curated. Highly recommend for the early peak hours.",
  "A gorgeous locale with rich cultural insight.",
  "Exceptional architecture with stunning scenery.",
  "Bustling vibe, outstanding local atmosphere.",
  "Excellent for authentic souvenirs and crafts.",
  "Charming space with high walkability and safe vibe.",
  "Outstanding local filter coffee nearby."
];

function getSocialProof(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const baseRating = 4.2;
  const ratingValue = (baseRating + (hash % 8) * 0.1).toFixed(1);
  const reviewCount = 200 + (hash % 91) * 75;
  const recommendation = 88 + (hash % 11);
  const saying = SOCIAL_PROOF_SNIPPETS[hash % SOCIAL_PROOF_SNIPPETS.length];

  return {
    rating: parseFloat(ratingValue),
    reviews: reviewCount.toLocaleString('en-IN'),
    recommendation,
    saying
  };
}

function parseCostToNumber(costStr: string): number {
  if (!costStr) return 0;
  const lower = costStr.toLowerCase();
  
  if (lower.includes('free') || lower.includes('₹0') || lower.includes('rs 0')) {
    return 0;
  }
  
  // Strip out any commas and non-numeric fluff
  const cleanStr = costStr.replace(/,/g, '');
  
  // Find numbers after ₹, rs, rupees, or INR
  const rupeeMatch = cleanStr.match(/(?:₹|rs\.?|inr|rupees)\s*(\d+(?:\.\d+)?)/i);
  if (rupeeMatch) {
    return parseFloat(rupeeMatch[1]);
  }
  
  // Look for any general numbers
  const numberMatch = cleanStr.match(/(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    return parseFloat(numberMatch[1]);
  }
  
  return 0;
}

const GRAPH_COLORS = [
  'bg-emerald-500',
  'bg-amber-500',
  'bg-indigo-500',
  'bg-brand-accent',
  'bg-sky-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-teal-500',
  'bg-orange-500'
];

const GRAPH_TEXT_COLORS = [
  'text-emerald-750 dark:text-emerald-300',
  'text-amber-750 dark:text-amber-300',
  'text-indigo-750 dark:text-indigo-300',
  'text-brand-accent',
  'text-sky-750 dark:text-sky-300',
  'text-rose-750 dark:text-rose-300',
  'text-violet-750 dark:text-violet-300',
  'text-teal-750 dark:text-teal-300',
  'text-orange-750 dark:text-orange-300'
];

const GRAPH_BORDER_COLORS = [
  'border-emerald-600/20',
  'border-amber-600/20',
  'border-indigo-600/20',
  'border-brand-accent/20',
  'border-sky-600/20',
  'border-rose-600/20',
  'border-violet-600/20',
  'border-teal-600/20',
  'border-orange-600/20'
];

interface PlanResultProps {
  planText: string | null;
  isLoading?: boolean;
  onActivityClick?: (index: number) => void;
  selectedActivityIndex?: number | null;
  userLocation?: { lat: number, lng: number, area?: string } | null;
}

export default function PlanResult({ planText, isLoading, onActivityClick, selectedActivityIndex, userLocation }: PlanResultProps) {
  const [selectedDay, setSelectedDay] = useState<string>('All');
  const [deselectedActivities, setDeselectedActivities] = useState<Set<string>>(new Set());
  const [customTravelers, setCustomTravelers] = useState<number | null>(null);
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState<boolean>(false);

  if (!planText && !isLoading) return null;

  // Robust parsing logic for the elite concierge format
  const parsedPlan = useMemo(() => {
    const activities: Activity[] = [];
    let costSummary = '';
    let localTips = '';
    let smartFlow = '';
    let whyFits = '';
    let modifyOptions: string[] = [];
    let shareSummary = '';
    let nluIntent: NluIntent | null = null;

    if (planText) {
      // Check if new format exists
      const hasNewFormat = planText.includes('🌍 YOUR PLAN');

      if (hasNewFormat) {
        // 1. Parse New Section Structure
        const nluMatch = planText.match(/(?:###\s*)?🧠 UNDERSTANDING INTENT([\s\S]*?)(?=(?:###\s*)?🌍 YOUR PLAN|$)/i);
        const planMatch = planText.match(/(?:###\s*)?🌍 YOUR PLAN([\s\S]*?)(?=(?:###\s*)?💰 ESTIMATED TRIP BUDGET BREAKDOWN|(?:###\s*)?🔄 FLOW OF THE PLAN|$)/i);
        const budgetMatch = planText.match(/(?:###\s*)?💰 ESTIMATED TRIP BUDGET BREAKDOWN([\s\S]*?)(?=(?:###\s*)?🔄 FLOW OF THE PLAN|$)/i);
        const flowMatch = planText.match(/(?:###\s*)?🔄 FLOW OF THE PLAN([\s\S]*?)(?=(?:###\s*)?🔥 WHY THIS FITS YOU|$)/i);
        const whyFitsMatch = planText.match(/(?:###\s*)?🔥 WHY THIS FITS YOU([\s\S]*?)(?=(?:###\s*)?💡 LOCAL INSIGHT|$)/i);
        const tipsMatch = planText.match(/(?:###\s*)?💡 LOCAL INSIGHT([\s\S]*?)(?=(?:###\s*)?⚡ MODIFY PLAN OPTIONS|$)/i);
        const modifyMatch = planText.match(/(?:###\s*)?⚡ MODIFY PLAN OPTIONS([\s\S]*?)(?=(?:###\s*)?💾 SHARE SUMMARY|$)/i);
        const shareMatch = planText.match(/(?:###\s*)?💾 SHARE SUMMARY([\s\S]*?)(?=(?:Namaste!|$))/i);

        if (nluMatch) {
          const content = nluMatch[1];
          nluIntent = {
            destination: content.match(/\* Destination:\s*(.*)/i)?.[1].trim() || '',
            startDate: content.match(/\* Start Date:\s*(.*)/i)?.[1].trim() || '',
            endDate: content.match(/\* End Date:\s*(.*)/i)?.[1].trim() || '',
            duration: content.match(/\* Duration:\s*(.*)/i)?.[1].trim() || '',
            groupSize: content.match(/\* Group Size:\s*(.*)/i)?.[1].trim() || '',
            groupType: content.match(/\* Group Type:\s*(.*)/i)?.[1].trim() || '',
            budget: content.match(/\* Budget:\s*(.*)/i)?.[1].trim() || '',
            mood: content.match(/\* Mood\/Vibe:\s*(.*)/i)?.[1].trim() || '',
            transport: content.match(/\* Transportation Mode:\s*(.*)/i)?.[1].trim() || '',
          };
        }

        if (budgetMatch) costSummary = budgetMatch[1].trim();
        if (flowMatch) smartFlow = flowMatch[1].trim();
        if (whyFitsMatch) whyFits = whyFitsMatch[1].trim();
        if (tipsMatch) localTips = tipsMatch[1].trim();
        if (shareMatch) shareSummary = shareMatch[1].replace(/^[\[\]"']+|[\[\]"']+$/g, '').trim();

        if (modifyMatch) {
           modifyOptions = modifyMatch[1]
             .split('\n')
             .map(line => line.trim())
             .filter(line => line.length > 0 && (line.startsWith('🔁') || line.startsWith('🍺') || line.startsWith('⚡') || line.startsWith('🧘') || line.match(/^[*+\-1-4.]/)));
        }

        if (planMatch) {
          const planContent = planMatch[1];
          const lines = planContent.split('\n');
          let currentActivityBlock: string[] = [];
          let isCapturing = false;
          let currentDay = '';

          const processActivityBlock = (blockLines: string[]) => {
            if (blockLines.length === 0) return;
            const firstLine = blockLines[0].trim();
            const nameMatch = firstLine.match(/^\d+\.\s*(.*)/);
            if (!nameMatch) return;

            const name = nameMatch[1].replace(/📍.*/, '').trim();
            let area = '';
            let coords = { lat: 12.9716, lng: 77.5946 };
            let cost = '₹0';
            let timeNeeded = '1 Hour';
            let description = '';

            blockLines.forEach(line => {
              const trimmedLine = line.trim();
              if (trimmedLine.includes('📍 Area:')) {
                area = trimmedLine.replace(/.*📍 Area:\s*/, '').trim();
                const coordsMatch = area.match(/\(Coords:\s*\[(.*?)\]\)/i);
                if (coordsMatch) {
                  const [lat, lng] = coordsMatch[1].split(',').map(c => parseFloat(c.trim()));
                  if (!isNaN(lat) && !isNaN(lng)) {
                    coords = { lat, lng };
                  }
                  area = area.replace(/\(Coords:\s*\[(.*?)\]\)/i, '').trim();
                }
              } else if (trimmedLine.includes('💰 Estimated Cost:')) {
                cost = trimmedLine.replace(/.*💰 Estimated Cost:\s*/, '').trim();
              } else if (trimmedLine.includes('⏳ Time Needed:')) {
                timeNeeded = trimmedLine.replace(/.*⏳ Time Needed:\s*/, '').trim();
              } else if (trimmedLine.includes('✨ Why Visit:')) {
                description = trimmedLine.replace(/.*✨ Why Visit:\s*/, '').trim();
              }
            });

            const finalTimeNeeded = currentDay ? `${currentDay} | ${timeNeeded}` : timeNeeded;

            activities.push({
              name,
              description,
              location: area,
              coordinates: coords,
              cost,
              timeNeeded: finalTimeNeeded,
              distance: '',
              travelTime: ''
            });
          };

          lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            const dayMatch = trimmed.match(/^#{1,4}\s*(Day \d+)/i) || trimmed.match(/^(Day \d+)/i);
            if (dayMatch) {
              currentDay = dayMatch[1].trim();
              return;
            }

            const activityStartMatch = trimmed.match(/^\d+\.\s+/);
            if (activityStartMatch) {
              if (currentActivityBlock.length > 0) {
                processActivityBlock(currentActivityBlock);
              }
              currentActivityBlock = [trimmed];
              isCapturing = true;
            } else if (isCapturing) {
              currentActivityBlock.push(trimmed);
            }
          });

          if (currentActivityBlock.length > 0) {
            processActivityBlock(currentActivityBlock);
          }
        }
      } else {
        // Fallback to old format parsing
        const tipsMatch = planText.match(/### (?:⚡ Smart Tips|💡 Quick Tips)([\s\S]*?)(?=---|$)/i);
        if (tipsMatch) localTips = tipsMatch[1].trim();

        const flowMatch = planText.match(/### ⚡ Smart Flow([\s\S]*?)(?=---|$)/i);
        if (flowMatch) smartFlow = flowMatch[1].trim();

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
            const timeMatch = firstLine.match(/^(.*?) –/);
            
            let nameMatch = firstLine.match(/– (.*?) 📍/);
            if (!nameMatch) nameMatch = firstLine.match(/^(.*?) 📍/);

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

            const activityStartMatch = trimmed.match(/^[*+\d.]+\s+\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\s*–/);
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
    }

    return {
      activities,
      costSummary,
      localTips,
      smartFlow,
      whyFits,
      modifyOptions,
      shareSummary,
      nluIntent
    };
  }, [planText]);

  const {
    activities,
    costSummary,
    localTips,
    smartFlow,
    whyFits,
    modifyOptions,
    shareSummary,
    nluIntent
  } = parsedPlan;

  const closingSignature = "Namaste! I am TOUR IT AI — your elite India travel concierge. Where are we heading, and what is the vibe for this journey?";
  const hasClosingSignature = planText?.includes(closingSignature);

  const uniqueDaysList = useMemo(() => {
    return Array.from(new Set(activities.map(a => a.timeNeeded.split('|')[0].trim()).filter(Boolean)));
  }, [activities]);

  const days = useMemo(() => {
    return uniqueDaysList.length > 1 ? ['All', ...uniqueDaysList] : [];
  }, [uniqueDaysList]);

  const dayTitles = useMemo(() => {
    const titles: Record<string, string> = {};
    if (!planText) return titles;
    const lines = planText.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      const match = trimmed.match(/^#{1,4}\s*(Day \d+)\s*[:\-\u2013\u2014]?\s*(.*)/i) || trimmed.match(/^(Day \d+)\s*[:\-\u2013\u2014]?\s*(.*)/i);
      if (match) {
        const dayKey = match[1].trim();
        const dayVal = match[2].trim();
        if (dayVal) {
          titles[dayKey] = dayVal;
        }
      }
    });
    return titles;
  }, [planText]);

  // Automatically start on Page 1 (Day 1) when a multi-day plan is generated
  React.useEffect(() => {
    if (uniqueDaysList.length > 0) {
      setSelectedDay(uniqueDaysList[0]);
    } else {
      setSelectedDay('All');
    }
    setDeselectedActivities(new Set());
    setCustomTravelers(null);
  }, [planText]);

  const isPagedMode = selectedDay !== 'All' && uniqueDaysList.length > 1;
  const currentPageIndex = uniqueDaysList.indexOf(selectedDay);

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setSelectedDay(uniqueDaysList[currentPageIndex - 1]);
      document.getElementById('itinerary-view-top')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < uniqueDaysList.length - 1) {
      setSelectedDay(uniqueDaysList[currentPageIndex + 1]);
      document.getElementById('itinerary-view-top')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredActivities = useMemo(() => {
    if (selectedDay === 'All') return activities;
    return activities.filter(a => a.timeNeeded.startsWith(selectedDay));
  }, [activities, selectedDay]);

  const mappedSelectedActivityIndex = useMemo(() => {
    if (selectedActivityIndex === null || selectedActivityIndex === undefined) return null;
    const act = activities[selectedActivityIndex];
    if (!act) return null;
    const currentList = isPagedMode ? filteredActivities : activities;
    const idx = currentList.indexOf(act);
    return idx !== -1 ? idx : null;
  }, [selectedActivityIndex, filteredActivities, activities, isPagedMode]);

  const activeTravelers = useMemo(() => {
    if (customTravelers !== null) return customTravelers;
    if (!nluIntent || !nluIntent.groupSize) return 1;
    const sizeStr = nluIntent.groupSize;
    const match = sizeStr.match(/(\d+)/);
    if (match) {
      const parsed = parseInt(match[1]);
      return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
    }
    return 1;
  }, [customTravelers, nluIntent]);

  const toggleActivitySelection = (name: string) => {
    setDeselectedActivities(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const analyzedActivities = useMemo(() => {
    return activities.map(act => {
      const numericCost = parseCostToNumber(act.cost);
      const isPerPerson = act.cost.toLowerCase().includes('person') || 
                          act.cost.toLowerCase().includes('head') || 
                          act.cost.toLowerCase().includes('pax') || 
                          act.cost.toLowerCase().includes('ticket') || 
                          act.cost.toLowerCase().includes('entry') ||
                          act.cost.includes('/ person') ||
                          act.cost.includes('/person') ||
                          act.cost.toLowerCase().includes('each');

      const isSelected = !deselectedActivities.has(act.name);
      const perTravelerCost = isPerPerson ? numericCost : (activeTravelers > 0 ? numericCost / activeTravelers : numericCost);
      const totalCost = isPerPerson ? (numericCost * activeTravelers) : numericCost;

      return {
        ...act,
        numericCost,
        isPerPerson,
        isSelected,
        totalCost,
        perTravelerCost
      };
    });
  }, [activities, deselectedActivities, activeTravelers]);

  const budgetStats = useMemo(() => {
    const allChecked = analyzedActivities.filter(a => a.isSelected);
    
    // Total for all checked activities
    const totalTripCost = allChecked.reduce((acc, curr) => acc + curr.totalCost, 0);
    
    // Filter active day list checked items
    const activeDayActivities = isPagedMode ? filteredActivities : activities;
    const dayChecked = analyzedActivities.filter(a => a.isSelected && activeDayActivities.some(da => da.name === a.name));
    const activeDayCost = dayChecked.reduce((acc, curr) => acc + curr.totalCost, 0);

    const mostExpensiveItem = allChecked.length > 0 
      ? allChecked.reduce((max, cur) => cur.totalCost > max.totalCost ? cur : max, allChecked[0])
      : null;

    const freeItemsCount = allChecked.filter(a => a.numericCost === 0).length;

    return {
      totalTripCost,
      activeDayCost,
      mostExpensiveItem,
      freeItemsCount,
      checkedCount: allChecked.length,
      totalCount: activities.length
    };
  }, [analyzedActivities, isPagedMode, filteredActivities, activities]);

  const activeMapActivities = useMemo(() => {
    const baseList = isPagedMode ? filteredActivities : activities;
    return baseList.filter(act => !deselectedActivities.has(act.name));
  }, [filteredActivities, activities, isPagedMode, deselectedActivities]);

  const mapSelectedActivityIndex = useMemo(() => {
    if (selectedActivityIndex === null || selectedActivityIndex === undefined) return null;
    const act = activities[selectedActivityIndex];
    if (!act || deselectedActivities.has(act.name)) return null;
    const idx = activeMapActivities.indexOf(act);
    return idx !== -1 ? idx : null;
  }, [selectedActivityIndex, activeMapActivities, activities, deselectedActivities]);

  // Dynamically resolve coordinates and location name for the weather forecast component
  const weatherCoords = useMemo(() => {
    const currentList = isPagedMode ? filteredActivities : activities;
    if (mappedSelectedActivityIndex !== null && mappedSelectedActivityIndex !== undefined && currentList[mappedSelectedActivityIndex]) {
      const act = currentList[mappedSelectedActivityIndex];
      return {
        lat: act.coordinates.lat,
        lng: act.coordinates.lng,
        name: act.name
      };
    }
    if (currentList.length > 0) {
      return {
        lat: currentList[0].coordinates.lat,
        lng: currentList[0].coordinates.lng,
        name: currentList[0].location || 'your destination'
      };
    }
    if (userLocation) {
      return {
        lat: userLocation.lat,
        lng: userLocation.lng,
        name: userLocation.area || 'your local location'
      };
    }
    return null;
  }, [activities, filteredActivities, mappedSelectedActivityIndex, isPagedMode, userLocation]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="space-y-12 max-w-4xl relative"
    >
      <div id="itinerary-view-top" className="absolute -top-40 pointer-events-none" />

      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b editorial-border pb-6 mb-8 md:mb-12"
      >
        <div className="space-y-3 max-w-2xl px-2 sm:px-0">
          <div className="space-y-1">
            <h2 className="font-serif text-xl md:text-2xl font-bold tracking-tight flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span>{shareSummary ? '🌍 Your Plan' : 'Your Curated Experience'}</span>
              {selectedDay !== 'All' && (
                <>
                  <span className="text-brand-accent font-sans text-xs uppercase px-2.5 py-0.5 rounded-full bg-brand-accent/5 border border-brand-accent/15 tracking-wider font-bold">
                    {selectedDay}
                  </span>
                  {dayTitles[selectedDay] && (
                    <span className="text-brand-muted text-xs font-sans font-medium italic select-none">
                      • {dayTitles[selectedDay]}
                    </span>
                  )}
                </>
              )}
            </h2>
            <p className="text-xs text-brand-muted leading-relaxed italic max-w-xl">
              {shareSummary || 'A custom-crafted journey suited exactly to your request, verified and mapped in real-time.'}
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

      {/* NLU Insight Dashboard */}
      {nluIntent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="border editorial-border rounded-xl bg-white premium-shadow p-5 space-y-4"
        >
          <div className="flex items-center gap-2 border-b editorial-border pb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-brand-muted">Concierge NLU • User Intent Synopsis</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Destination */}
            {nluIntent.destination && nluIntent.destination !== 'Not specified' && (
              <div className="p-3 border border-brand-ink/[0.04] bg-brand-bg/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-brand-muted">
                  <MapPin className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Destination</span>
                </div>
                <div className="text-xs font-bold text-brand-ink truncate">
                  {nluIntent.destination}
                </div>
              </div>
            )}

            {/* Dates */}
            {(nluIntent.startDate || nluIntent.endDate) && (
              <div className="p-3 border border-brand-ink/[0.04] bg-brand-bg/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-brand-muted">
                  <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Dates</span>
                </div>
                <div className="text-xs font-bold text-brand-ink truncate">
                  {nluIntent.startDate || 'Flexible'} {nluIntent.endDate ? `to ${nluIntent.endDate}` : ''}
                </div>
              </div>
            )}

            {/* Duration */}
            {nluIntent.duration && nluIntent.duration !== 'Not specified' && (
              <div className="p-3 border border-brand-ink/[0.04] bg-brand-bg/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-brand-muted">
                  <Clock className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Duration</span>
                </div>
                <div className="text-xs font-bold text-brand-ink truncate">
                  {nluIntent.duration}
                </div>
              </div>
            )}

            {/* Group */}
            {(nluIntent.groupType || nluIntent.groupSize) && (
              <div className="p-3 border border-brand-ink/[0.04] bg-brand-bg/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-brand-muted">
                  <Users className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Travelers</span>
                </div>
                <div className="text-xs font-bold text-brand-ink truncate capitalize">
                  {nluIntent.groupType || 'Solo'} {nluIntent.groupSize && nluIntent.groupSize !== 'Not specified' ? `(${nluIntent.groupSize})` : ''}
                </div>
              </div>
            )}

            {/* Budget */}
            {nluIntent.budget && nluIntent.budget !== 'Not specified' && (
              <div className="p-3 border border-brand-ink/[0.04] bg-brand-bg/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-brand-muted">
                  <Coins className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Budget Fit</span>
                </div>
                <div className="text-xs font-bold text-brand-ink truncate capitalize">
                  {nluIntent.budget}
                </div>
              </div>
            )}

            {/* Mood/Vibe */}
            {nluIntent.mood && nluIntent.mood !== 'Not specified' && (
              <div className="p-3 border border-brand-ink/[0.04] bg-brand-bg/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-brand-muted">
                  <Compass className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Vibe Mood</span>
                </div>
                <div className="text-xs font-bold text-brand-ink truncate capitalize">
                  {nluIntent.mood}
                </div>
              </div>
            )}

            {/* Transportation */}
            {nluIntent.transport && nluIntent.transport !== 'Not specified' && (
              <div className="p-3 border border-brand-ink/[0.04] bg-brand-bg/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-brand-muted">
                  <Luggage className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Transport Mode</span>
                </div>
                <div className="text-xs font-bold text-brand-ink truncate capitalize">
                  {nluIntent.transport}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

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
          activities={activeMapActivities} 
          isLoading={isLoading} 
          selectedActivityIndex={mapSelectedActivityIndex} 
          userLocation={userLocation}
        />
      </motion.div>

      {/* Weather Forecast Summary Component */}
      {weatherCoords && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          <WeatherWidget 
            lat={weatherCoords.lat}
            lng={weatherCoords.lng}
            locationName={weatherCoords.name}
          />
        </motion.div>
      )}

      {/* Dynamic Interactive Budget Dashboard */}
      {activities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.28 }}
          className="border border-brand-ink/10 rounded-2xl bg-white premium-shadow p-6 space-y-6"
        >
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 editorial-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-brand-accent shrink-0" />
                <h3 className="text-xs uppercase tracking-widest font-bold text-brand-muted">
                  Itinerary Budget & Expense Splitter
                </h3>
              </div>
              <p className="text-xs text-brand-muted">
                Dynamic cost computation based on your travel party and attractions checklist.
              </p>
            </div>

            {/* Stepper Traveler Counter */}
            <div className="flex items-center gap-2 bg-brand-bg/50 px-3 py-1.5 rounded-xl border border-brand-ink/5 self-start sm:self-auto shadow-sm">
              <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider shrink-0 select-none">
                Group size:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCustomTravelers(Math.max(1, activeTravelers - 1))}
                  className="w-5 h-5 rounded-md bg-white border border-brand-ink/10 flex items-center justify-center text-brand-ink font-semibold hover:bg-brand-muted/10 font-sans shadow-sm cursor-pointer disabled:opacity-40"
                  disabled={activeTravelers <= 1}
                  title="Decrease Travelers"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-xs font-bold px-2 text-center min-w-[16px] tabular-nums">
                  {activeTravelers}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomTravelers(activeTravelers + 1)}
                  className="w-5 h-5 rounded-md bg-white border border-brand-ink/10 flex items-center justify-center text-brand-ink font-semibold hover:bg-brand-muted/10 font-sans shadow-sm cursor-pointer"
                  title="Increase Travelers"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
              <span className="text-[10px] text-brand-muted italic ml-1">
                ({nluIntent?.groupType || 'Travelers'})
              </span>
            </div>
          </div>

          {/* Budget Aggregate Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Main Trip Card */}
            <div className="p-4 rounded-xl border border-brand-ink/10 bg-brand-accent/[0.01] hover:border-brand-accent/20 transition-all space-y-1.5 relative overflow-hidden">
              <div className="text-[9px] uppercase tracking-wider font-bold text-brand-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                <span>Full-Trip Estimated Outlay</span>
              </div>
              <div className="text-2xl md:text-3xl font-serif font-black text-brand-ink tracking-tight tabular-nums flex items-baseline gap-0.5">
                <span className="text-lg font-serif font-semibold text-brand-accent">₹</span>
                <span>{Math.round(budgetStats.totalTripCost).toLocaleString('en-IN')}</span>
              </div>
              {activeTravelers > 1 ? (
                <div className="text-[10px] text-brand-muted font-medium">
                  💳 Roughly <strong className="font-semibold text-brand-ink">₹{Math.round(budgetStats.totalTripCost / activeTravelers).toLocaleString('en-IN')}</strong> per person
                </div>
              ) : (
                <div className="text-[10px] text-brand-muted font-medium">
                  👤 Calculated for solo traveler
                </div>
              )}
            </div>

            {/* Current Selected Tab/Day Slice */}
            <div className="p-4 rounded-xl border border-brand-ink/10 bg-brand-ink/[0.01] hover:border-brand-accent/20 transition-all space-y-1.5 relative overflow-hidden">
              <div className="text-[9px] uppercase tracking-wider font-bold text-brand-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-ink/40"></span>
                <span>Active View Outlay ({selectedDay})</span>
              </div>
              <div className="text-2xl md:text-3xl font-serif font-black text-brand-ink tracking-tight tabular-nums flex items-baseline gap-0.5">
                <span className="text-lg font-serif font-semibold text-brand-muted">₹</span>
                <span>{Math.round(budgetStats.activeDayCost).toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[10px] text-brand-muted font-medium truncate">
                {selectedDay === 'All' ? 'Showing aggregated scope' : `Cost for ${selectedDay} timeline`}
              </div>
            </div>

            {/* Highlight Statistic */}
            <div className="p-4 rounded-xl border border-brand-ink/10 bg-brand-bg/50 hover:border-brand-accent/20 transition-all space-y-1.5 relative overflow-hidden">
              <div className="text-[9px] uppercase tracking-wider font-bold text-brand-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Itinerary Inclusions</span>
              </div>
              <div className="text-2xl md:text-3xl font-serif font-black text-brand-ink tracking-tight tabular-nums">
                <span>{budgetStats.checkedCount}</span>
                <span className="text-sm font-sans text-brand-muted font-normal"> / {budgetStats.totalCount} cards</span>
              </div>
              <div className="text-[10px] text-brand-muted font-medium flex items-center gap-1">
                <span className="text-emerald-700 font-bold bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded text-[9px]">
                  {budgetStats.freeItemsCount} Free
                </span>
                <span>attractions included</span>
              </div>
            </div>
          </div>

          {/* Segmented Stacked Progress Chart */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-brand-muted uppercase tracking-wider">
              <span>Cost Segment Allocation Map</span>
              <span className="text-[9px] lowercase italic font-normal text-brand-muted/70">Hover segments for item details</span>
            </div>
            
            {/* Segmented Stacked Line */}
            <div className="h-4 rounded-full bg-brand-bg p-0.5 border border-brand-ink/5 flex overflow-hidden shadow-inner">
              {budgetStats.totalTripCost === 0 ? (
                <div className="w-full h-full bg-emerald-500/10 text-emerald-800 rounded-full font-bold text-[9px] tracking-wider uppercase flex items-center justify-center animate-pulse gap-1">
                  <span>🎉 100% Free itinerary! All events are costless</span>
                </div>
              ) : (
                (() => {
                  let segmentIdx = 0;
                  return analyzedActivities.map((act) => {
                    if (!act.isSelected || act.totalCost === 0) return null;
                    const pct = (act.totalCost / budgetStats.totalTripCost) * 100;
                    const colorClass = GRAPH_COLORS[segmentIdx % GRAPH_COLORS.length];
                    segmentIdx++;
                    
                    return (
                      <div
                        key={act.name}
                        style={{ width: `${pct}%` }}
                        className={`${colorClass} h-full border-r border-white/20 first:rounded-l-full last:rounded-r-full transition-all duration-300 relative group cursor-pointer hover:brightness-105`}
                        title={`${act.name}: ₹${Math.round(act.totalCost).toLocaleString('en-IN')} (${Math.round(pct)}%)`}
                      />
                    );
                  });
                })()
              )}
            </div>

            {/* Custom Interactive Segment Legends */}
            {budgetStats.totalTripCost > 0 && (
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 pt-1">
                {(() => {
                  let segmentIdx = 0;
                  return analyzedActivities.map((act) => {
                    if (!act.isSelected || act.totalCost === 0) return null;
                    const pct = (act.totalCost / budgetStats.totalTripCost) * 100;
                    if (pct < 3) {
                      segmentIdx++;
                      return null; // hide extremely tiny ones in legend to prevent clutter
                    }
                    const dotColor = GRAPH_COLORS[segmentIdx % GRAPH_COLORS.length];
                    const textColor = GRAPH_TEXT_COLORS[segmentIdx % GRAPH_TEXT_COLORS.length];
                    segmentIdx++;

                    return (
                      <button
                        type="button"
                        key={act.name}
                        onClick={() => {
                          const originalIdx = activities.findIndex(a => a.name === act.name);
                          if (originalIdx !== -1) {
                            onActivityClick?.(originalIdx);
                          }
                        }}
                        className="flex items-center gap-1.5 group select-none text-[10px] font-semibold text-brand-muted hover:text-brand-accent transition-colors cursor-pointer"
                      >
                        <span className={`w-2 h-2 rounded-full ${dotColor} group-hover:scale-125 transition-transform shrink-0`} />
                        <span className="truncate max-w-[120px]">{act.name}</span>
                        <span className={`text-[9px] font-bold ${textColor}`}>({Math.round(pct)}%)</span>
                      </button>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {costSummary && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-4 rounded-xl border border-brand-accent/15 bg-brand-accent/[0.01] space-y-3"
            >
              <div className="flex items-center gap-2 border-b border-brand-accent/10 pb-2">
                <Coins className="w-3.5 h-3.5 text-brand-accent" />
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-muted">
                  Concierge Trip Budget & Forecast Calculations
                </h4>
              </div>
              <div className="text-xs leading-relaxed text-brand-ink/90 whitespace-pre-wrap font-sans pl-1">
                {costSummary}
              </div>
            </motion.div>
          )}

          {/* Expanded Direct Breakdown / Splitter Accordion */}
          <div className="border border-brand-ink/[0.06] rounded-xl overflow-hidden bg-brand-bg/10">
            {/* Accordion Trigger */}
            <button
              type="button"
              onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
              className="w-full flex items-center justify-between p-4 bg-brand-bg/30 text-brand-ink hover:bg-brand-bg/75 transition-all text-left font-bold text-xs select-none cursor-pointer border-b border-brand-ink/[0.04]"
            >
              <div className="flex items-center gap-2">
                <Coins className="w-3.5 h-3.5 text-brand-accent" />
                <span className="uppercase tracking-wider font-semibold">
                  Detailed Expense Breakdown Table
                </span>
                <span className="text-[9px] text-brand-muted font-normal lowercase bg-white border px-2 py-0.5 rounded-full ml-1 font-sans">
                  {isBreakdownExpanded ? 'Click to collapse' : 'Click to drill down'}
                </span>
              </div>
              <div className="p-0.5 hover:bg-brand-ink/5 rounded">
                {isBreakdownExpanded ? (
                  <ChevronUp className="w-4 h-4 text-brand-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-brand-muted" />
                )}
              </div>
            </button>

            {/* Accordion List Body */}
            <AnimatePresence>
              {isBreakdownExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="overflow-hidden bg-white uppercase-off"
                >
                  <div className="divide-y divide-brand-ink/[0.06] max-h-[300px] overflow-y-auto no-scrollbar py-1">
                    {analyzedActivities.map((act) => {
                      return (
                        <div
                          key={act.name}
                          onClick={() => toggleActivitySelection(act.name)}
                          className={`flex items-center justify-between py-3 px-4 hover:bg-brand-bg/40 transition-colors cursor-pointer ${
                            !act.isSelected ? 'bg-brand-bg/10 text-brand-muted/70 opacity-60 line-through' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 max-w-[70%]">
                            {/* Checkbox */}
                            <div className="shrink-0">
                              <span
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                  act.isSelected
                                    ? 'bg-brand-accent border-brand-accent text-white'
                                    : 'border-brand-ink/20 text-transparent bg-white'
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            </div>
                            
                            {/* Attraction Name and traveler scaling breakdown */}
                            <div className="space-y-0.5 truncate text-left">
                              <div className="text-xs font-bold text-brand-ink truncate">
                                {act.name}
                              </div>
                              <div className="text-[10px] text-brand-muted font-medium lowercase flex items-center gap-1.5 flex-wrap font-sans">
                                <span>{act.location || 'Local area'}</span>
                                {act.numericCost > 0 && (
                                  <>
                                    <span className="opacity-40">•</span>
                                    <span>
                                      {act.isPerPerson 
                                        ? `₹${Math.round(act.numericCost)} each` 
                                        : `₹${Math.round(act.numericCost)} group-flat`
                                      }
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Calculated aggregate cost value */}
                          <div className="text-right shrink-0 font-mono">
                            {act.numericCost === 0 ? (
                              <span className="text-[10px] text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 font-bold uppercase tracking-wider select-none font-sans">
                                Free
                              </span>
                            ) : (
                              <div className="text-xs font-bold text-brand-ink tabular-nums flex items-baseline justify-end gap-0.5">
                                <span className={`text-[10px] font-serif ${act.isSelected ? 'text-brand-accent' : 'text-brand-muted'}`}>₹</span>
                                <span className={act.isSelected ? 'text-brand-ink font-bold' : 'text-brand-muted'}>
                                  {Math.round(act.totalCost).toLocaleString('en-IN')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

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

      <div className="space-y-0 min-h-[250px] relative">
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
        
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="space-y-0"
          >
            {filteredActivities.length === 0 && !isLoading && (
              <div className="py-16 text-center text-brand-muted italic text-xs">
                No active events listed for {selectedDay}.
              </div>
            )}

            {filteredActivities.map((activity, i) => {
              // Find original index for map markers
              const originalIndex = activities.indexOf(activity);
              const isSelected = !deselectedActivities.has(activity.name);
              return (
                <motion.div
                  key={originalIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onActivityClick?.(originalIndex)}
                  transition={{ 
                    duration: 0.5, 
                    delay: i * 0.05,
                    ease: "easeOut"
                  }}
                  className={`grid grid-cols-[40px_1fr] md:grid-cols-[40px_80px_1fr_120px_100px] items-start md:items-center gap-x-3 gap-y-4 md:gap-8 py-6 md:py-8 px-4 md:px-6 -mx-2 md:-mx-6 border-b editorial-border group hover:bg-white hover:shadow-xl hover:shadow-brand-ink/5 md:hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer rounded-xl relative z-10 ${
                    !isSelected ? 'opacity-55 hover:opacity-80' : ''
                  } ${
                    selectedActivityIndex === originalIndex ? 'bg-white shadow-xl shadow-brand-ink/5 md:-translate-y-1 ring-2 ring-brand-accent/20' : ''
                  }`}
                >
                  {/* Circular Checkbox Toggle Column */}
                  <div className="flex items-center justify-center h-5 md:h-auto pt-0.5 md:pt-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActivitySelection(activity.name);
                      }}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-brand-accent text-white border-brand-accent shadow-sm' 
                          : 'bg-white border-brand-ink/15 text-transparent hover:border-brand-accent/40'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>

                  {/* Responsive Content Wrapper using contents display */}
                  <div className="col-span-1 md:contents space-y-4 md:space-y-0">
                    <div className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      selectedActivityIndex === originalIndex ? 'text-brand-accent' : 'text-brand-muted group-hover:text-brand-accent'
                    }`}>
                      {activity.timeNeeded.includes('|') ? activity.timeNeeded.split('|')[1].trim() : activity.timeNeeded}
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className={`text-base md:text-lg font-bold transition-colors ${
                        selectedActivityIndex === originalIndex ? 'text-brand-accent' : 'group-hover:text-brand-accent'
                      } ${!isSelected ? 'line-through text-brand-muted/70 font-sans' : 'font-serif'}`}>
                        {activity.name}
                      </h3>
                      
                      {/* User Rating Score Summary & Social Proof */}
                      {(() => {
                        const proof = getSocialProof(activity.name);
                        return (
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-brand-muted font-medium pb-1.5 pt-0.5">
                            <div className="flex items-center gap-0.5 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 text-amber-700 font-bold text-[10px]">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                              <span>{proof.rating}</span>
                            </div>
                            <span className="text-[10px] text-brand-muted font-semibold">({proof.reviews} ratings)</span>
                            <span className="text-brand-muted/40 text-[10px]">•</span>
                            <div className="flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 font-bold">
                              <ThumbsUp className="w-2.5 h-2.5 shrink-0" />
                              <span>{proof.recommendation}% recommended</span>
                            </div>
                            <span className="hidden lg:inline text-brand-muted/40 text-[10px]">•</span>
                            <span className="hidden lg:inline text-[10px] italic font-medium text-brand-muted/80 truncate max-w-xs font-sans">{proof.saying}</span>
                          </div>
                        );
                      })()}

                      <p className="text-xs md:text-sm text-brand-muted leading-relaxed max-w-md">
                        {activity.description}
                      </p>
                      <LiveConciergeFeed
                        currentPlaceName={activity.name}
                        currentCoords={activity.coordinates}
                        previousCoords={originalIndex > 0 ? activities[originalIndex - 1].coordinates : null}
                        previousPlaceName={originalIndex > 0 ? activities[originalIndex - 1].name : null}
                        userLocation={userLocation}
                      />
                    </div>

                    <div className="flex justify-between md:block md:text-right min-w-0 md:min-w-[120px] gap-4">
                      <div className="md:mb-1">
                        <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-brand-muted block font-bold">Area</span>
                        <span className="text-[10px] md:text-xs font-bold">{activity.location}</span>
                      </div>
                      <div className="text-right md:text-left md:hidden font-sans">
                        <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-brand-muted block font-bold">Cost</span>
                        <span className="text-[10px] md:text-xs font-bold">{activity.cost}</span>
                      </div>
                    </div>

                    <div className="hidden md:block text-right min-w-[100px] font-sans">
                      <span className="text-[10px] uppercase tracking-wider text-brand-muted block font-bold font-serif">Cost</span>
                      <span className="text-xs font-bold">{activity.cost}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Elite Paginated Deck Control */}
        {uniqueDaysList.length > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-4 border-t editorial-border mt-8">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] uppercase tracking-[2px] font-bold text-brand-muted flex items-center gap-1.5 flex-row">
                <BookOpen className="w-3.5 h-3.5 text-brand-accent/80" />
                <span>Book Mode</span>
              </span>
              <span className="hidden sm:inline text-brand-muted/30 text-xs">•</span>
              <span className="text-[10px] font-medium text-brand-muted/80">
                {selectedDay === 'All' 
                  ? 'Showing all days in scrolling log' 
                  : `Page ${currentPageIndex + 1} of ${uniqueDaysList.length} (${selectedDay})`
                }
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={selectedDay === 'All' || currentPageIndex === 0}
                onClick={handlePrevPage}
                className="p-2 border border-brand-ink/10 rounded-lg bg-white text-brand-ink hover:bg-brand-muted/5 hover:border-brand-ink/20 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer group shadow-sm"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <div className="flex items-center gap-1.5 px-3">
                {uniqueDaysList.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      selectedDay === day 
                        ? 'bg-brand-accent scale-125 ring-2 ring-brand-accent/25' 
                        : 'bg-brand-ink/10 hover:bg-brand-ink/30'
                    }`}
                    title={`Jump to ${day}`}
                  />
                ))}
                
                {/* Scroll view icon trigger */}
                <button
                  onClick={() => setSelectedDay('All')}
                  className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border font-sans select-none ml-2 transition-all ${
                    selectedDay === 'All'
                      ? 'bg-brand-ink text-white border-brand-ink'
                      : 'bg-white text-brand-muted border-brand-ink/10 hover:bg-brand-muted/5'
                  }`}
                  title="View All Days as scroll"
                >
                  All
                </button>
              </div>

              <button
                disabled={selectedDay === 'All' || currentPageIndex === uniqueDaysList.length - 1}
                onClick={handleNextPage}
                className="p-2 border border-brand-ink/10 rounded-lg bg-white text-brand-ink hover:bg-brand-muted/5 hover:border-brand-ink/20 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer group shadow-sm"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}
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
              <h4 className="text-[11px] uppercase tracking-[1.5px] font-bold">🔄 Flow of the Plan</h4>
            </div>
            <p className="text-sm font-medium text-brand-ink leading-relaxed italic whitespace-pre-wrap">
              {smartFlow}
            </p>
          </div>
        )}

        {whyFits && (
          <div className="space-y-4 p-6 bg-brand-ink/[0.01] border border-brand-ink/5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-brand-accent">🔥</span>
              <h4 className="text-[11px] uppercase tracking-[1.5px] font-bold">Why This Fits You</h4>
            </div>
            <div className="text-sm text-brand-ink/90 leading-relaxed whitespace-pre-wrap">
              {whyFits}
            </div>
          </div>
        )}

        {localTips && (
          <div className="space-y-4 p-6 bg-yellow-500/[0.02] border border-yellow-500/10 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-brand-accent">💡</span>
              <h4 className="text-[11px] uppercase tracking-[1.5px] font-bold">Local Insight</h4>
            </div>
            <div className="text-sm leading-relaxed text-brand-ink/80 whitespace-pre-wrap">
              {localTips}
            </div>
          </div>
        )}

        {modifyOptions.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-brand-ink/5">
            <h4 className="text-[10px] uppercase tracking-[2px] text-brand-muted font-bold block">⚡ Modify Plan Options</h4>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {modifyOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const cleanText = option.replace(/^[🔁🍺⚡🧘\-*+.]\s*/, '').trim();
                    window.dispatchEvent(new CustomEvent('insert-chat-input', { 
                      detail: { text: `Modify my plan: ${cleanText}` } 
                    }));
                  }}
                  className="px-4 py-2 hover:bg-brand-accent hover:text-white hover:border-brand-accent transition-all duration-300 bg-white border border-brand-ink/10 rounded-full text-xs font-semibold text-brand-ink/80 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
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
