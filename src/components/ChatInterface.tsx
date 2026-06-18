import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2, Clock, LocateFixed, Compass, History, Utensils, Wind, Sparkles, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/src/types';
import { generatePlan, generatePlanStream } from '@/src/lib/gemini';

const VIBES = [
  { name: 'Adventure', icon: Compass, color: 'hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-600', activeStyle: 'bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-600/10' },
  { name: 'Heritage', icon: History, color: 'hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-600', activeStyle: 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/10' },
  { name: 'Culinary', icon: Utensils, color: 'hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-600', activeStyle: 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-600/10' },
  { name: 'Relaxation', icon: Wind, color: 'hover:border-teal-500/30 hover:bg-teal-500/5 hover:text-teal-600', activeStyle: 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/10' },
  { name: 'Spiritual', icon: Sparkles, color: 'hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-purple-600', activeStyle: 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/10' },
  { name: 'Luxury', icon: Gem, color: 'hover:border-yellow-500/30 hover:bg-yellow-500/5 hover:text-yellow-600', activeStyle: 'bg-yellow-600 text-white border-yellow-600 shadow-sm shadow-yellow-600/10' }
];

interface ChatInterfaceProps {
  onPlanGenerated: (plan: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  onLocationUpdate?: (location: { lat: number, lng: number, area?: string } | null) => void;
}

export default function ChatInterface({ onPlanGenerated, onLoadingChange, onLocationUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Namaste! I am TOUR IT AI — your elite India travel concierge. Where are we heading, and what is the vibe for this journey?" }
  ]);
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [duration, setDuration] = useState(1);
  const [customDuration, setCustomDuration] = useState('');
  const [budgetTier, setBudgetTier] = useState<'budget' | 'balanced' | 'premium'>('balanced');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number, area?: string } | null>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  const toggleVibe = (vibeName: string) => {
    setSelectedVibes(prev => 
      prev.includes(vibeName)
        ? prev.filter(v => v !== vibeName)
        : [...prev, vibeName]
    );
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          onLocationUpdate?.(loc);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [onLocationUpdate]);

  useEffect(() => {
    const handleInsert = (e: Event) => {
      const customEvent = e as CustomEvent<{ text: string }>;
      if (customEvent.detail?.text) {
        setInput(customEvent.detail.text);
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    };
    window.addEventListener('insert-chat-input', handleInsert);
    return () => window.removeEventListener('insert-chat-input', handleInsert);
  }, []);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Final safety check for duration
    let finalDuration = customDuration ? parseInt(customDuration) : duration;
    if (isNaN(finalDuration) || finalDuration < 1) finalDuration = 1;
    
    const vibePrefix = selectedVibes.length > 0 ? `[VIBES: ${selectedVibes.join(', ').toUpperCase()}] ` : '';
    const budgetContext = `[BUDGET: ${budgetTier.toUpperCase()}] [DURATION: ${finalDuration} DAY(S)] ${vibePrefix}`;
    const userMessage: ChatMessage = { role: 'user', content: budgetContext + input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    let fullResponse = '';

    try {
      const stream = generatePlanStream(input, messages, finalDuration, userLocation || undefined);
      
      // Add empty placeholder message for model
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', content: fullResponse };
          return newMessages;
        });
        onPlanGenerated(fullResponse);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (d: number) => {
    setDuration(d);
    setCustomDuration(''); // Clear custom when preset is picked
  };

  const handleCustomClick = () => {
    customInputRef.current?.focus();
    setDuration(0); // Mark that we are using custom
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomDuration(val);
    if (val && !isNaN(parseInt(val))) {
      setDuration(parseInt(val));
    } else {
      setDuration(0);
    }
  };

  const handleNearMeClick = () => {
    setInput("Show me elite spots near me right now");
  };

  const suggestions = [
    "Heritage walk in Old Delhi",
    "Marine Drive sunset in Mumbai",
    "Peaceful morning in Cubbon Park",
    "Street food tour in VV Puram",
    "Luxury shopping in UB City"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <ScrollArea className="h-[500px] md:h-[550px] w-full" viewportRef={scrollRef}>
      <div className="flex flex-col pr-4">
        {/* Interactive Control Panel */}
        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
        {/* Budget Selector */}
        <div className="flex items-center justify-between pb-2 border-b editorial-border gap-2">
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="text-brand-accent text-xs">₹</span>
            <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-brand-muted">Budget Tier</span>
          </div>
          <div className="flex items-center gap-0.5 md:gap-1 bg-brand-muted/5 p-1 rounded-lg">
            {(['budget', 'balanced', 'premium'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setBudgetTier(tier)}
                className={`text-[8px] md:text-[9px] uppercase tracking-wider font-bold px-1.5 md:px-2 py-1 rounded-md transition-all duration-200 ${
                  budgetTier === tier 
                    ? 'bg-brand-ink text-white shadow-sm' 
                    : 'text-brand-muted hover:text-brand-ink'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b editorial-border gap-2">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Clock className="w-3 h-3 text-brand-accent" />
            <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-brand-muted">Duration</span>
          </div>
          <div className="flex items-center gap-1 md:gap-1.5">
            <div className="flex items-center gap-1 bg-brand-muted/5 p-0.5 md:p-1 rounded-lg">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  onClick={() => handlePresetClick(d)}
                  className={`text-[8px] md:text-[9px] uppercase tracking-wider font-bold px-2 md:px-2.5 py-1 rounded-md transition-all duration-200 ${
                    duration === d && !customDuration
                      ? 'bg-brand-ink text-white shadow-sm' 
                      : 'text-brand-muted hover:text-brand-ink'
                  }`}
                >
                  {d}{d === 1 ? 'D' : 'Ds'}
                </button>
              ))}
            </div>
            
            <div className={`flex items-center gap-1 bg-brand-muted/5 p-0.5 md:p-1 rounded-lg transition-all ${customDuration || (duration > 3 || duration === 0) ? 'ring-1 ring-brand-accent/30 bg-brand-accent/5' : ''}`}>
              <button 
                onClick={handleCustomClick}
                className={`text-[8px] md:text-[9px] uppercase font-bold px-1 transition-colors ${customDuration || (duration > 3 || duration === 0) ? 'text-brand-accent' : 'text-brand-muted hover:text-brand-ink'}`}
              >
                Custom
              </button>
              <input
                ref={customInputRef}
                type="number"
                min="1"
                max="30"
                value={customDuration}
                onChange={handleCustomChange}
                placeholder="..."
                className="w-8 md:w-10 bg-transparent border-none text-[9px] md:text-[10px] font-bold text-brand-ink focus:ring-0 p-0 text-center placeholder:text-brand-muted/30"
              />
            </div>
          </div>
        </div>

        {/* Duration Slider (Scroll Bar for selection) */}
        <div className="space-y-2 px-1">
          <input 
            type="range" 
            min="1" 
            max="14" 
            step="1"
            value={duration}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setDuration(val);
              if (val > 3) setCustomDuration(val.toString());
              else setCustomDuration('');
            }}
            className="w-full h-1 bg-brand-muted/10 rounded-full appearance-none cursor-pointer accent-brand-accent transition-all hover:bg-brand-muted/20"
          />
          <div className="flex justify-between text-[8px] uppercase tracking-widest font-bold text-brand-muted/60 px-0.5">
            <span>1 Day</span>
            <span>7 Days</span>
            <span>14 Days</span>
          </div>
        </div>

        {/* Vibe Selection Section */}
        <div className="space-y-2 pt-1 pb-3 border-b editorial-border">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Compass className="w-3 h-3 text-brand-accent animate-pulse" />
            <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-brand-muted">Vibe Preferences</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {VIBES.map((vibe) => {
              const Icon = vibe.icon;
              const isSelected = selectedVibes.includes(vibe.name);
              return (
                <button
                  key={vibe.name}
                  onClick={() => toggleVibe(vibe.name)}
                  className={`flex items-center gap-1.5 px-2 md:px-3 py-2 rounded-xl border text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ease-out cursor-pointer active:scale-95 ${
                    isSelected
                      ? vibe.activeStyle
                      : `border-brand-ink/5 bg-transparent text-brand-muted ${vibe.color}`
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{vibe.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Intent Input & Generate Button */}
        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-brand-muted/5 rounded-xl -m-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="e.g. Chill evening under ₹1000"
              rows={1}
              className="w-full bg-transparent border-none p-0 focus:ring-0 placeholder:text-brand-muted/50 text-sm relative z-10 resize-none min-h-[24px] max-h-[120px] overflow-y-auto leading-relaxed"
            />
          </div>
          
          <Button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-full bg-brand-ink text-white rounded-xl py-6 font-bold text-xs uppercase tracking-[2px] hover:bg-brand-accent hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-brand-ink/10 flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>✨ Generate Plan</span>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleNearMeClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-accent/10 text-brand-accent rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-accent/20 hover:bg-brand-accent hover:text-white transition-all duration-300"
          >
            <LocateFixed className="w-3 h-3" />
            Near Me Mode
          </button>
        </div>

        {messages.length === 1 && !isLoading && (
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest font-bold text-brand-muted block">Quick Starts</span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className={`text-[10px] font-bold px-3 py-1.5 border editorial-border rounded-full transition-all duration-200 ${
                    input === s 
                      ? 'bg-brand-accent text-white border-brand-accent shadow-md shadow-brand-accent/20 scale-105' 
                      : 'text-brand-muted hover:text-brand-accent hover:border-brand-accent hover:bg-brand-accent/5'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6 mt-4 pt-6 border-t editorial-border">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-1"
              >
                <span className="text-[9px] uppercase tracking-widest text-brand-muted font-bold">
                  {msg.role === 'user' ? 'You' : 'TOUR IT AI'}
                </span>
                <div className={`text-sm leading-relaxed ${
                  msg.role === 'user' ? 'text-brand-ink font-medium' : 'text-brand-muted'
                }`}>
                  {msg.role === 'model' && msg.content.includes('### 🧳 Trip') ? (
                    <div className="space-y-4">
                      <div className="bg-brand-muted/5 p-4 rounded-xl border editorial-border">
                        {msg.content.match(/### 🧳 Trip([\s\S]*?)(?=---|### 📅 Plan|$)/i)?.[1].trim().split('\n').map((line, idx) => (
                          <div key={idx} className="whitespace-pre-wrap">{line}</div>
                        ))}
                      </div>
                      <div className="pt-2 italic font-medium text-brand-accent">
                        Namaste! I am TOUR IT AI — your elite India travel concierge. Where are we heading, and what is the vibe for this journey?
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-1"
            >
              <span className="text-[9px] uppercase tracking-widest text-brand-muted font-bold">TOUR IT AI</span>
              <div className="flex items-center gap-2 text-xs text-brand-accent italic font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                ✨ Crafting your perfect experience...
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
