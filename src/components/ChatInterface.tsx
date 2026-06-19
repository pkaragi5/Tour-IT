import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/src/types';
import { generatePlanStream } from '@/src/lib/gemini';

const POPULAR_SEARCHES = [
  "Goa trip with 10 friends from June 15 to June 18",
  "Weekend bike ride near Bangalore",
  "Things to do near me tonight",
  "Couple trip to Coorg next weekend"
];

interface ChatInterfaceProps {
  onPlanGenerated: (plan: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  onLocationUpdate?: (location: { lat: number, lng: number, area?: string } | null) => void;
}

export default function ChatInterface({ onPlanGenerated, onLoadingChange, onLocationUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number, area?: string } | null>(null);

  // Soft Auto-Detect Location
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
          console.error("Location access declined or not found:", error);
        }
      );
    }
  }, [onLocationUpdate]);

  // Handle outside input triggers
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(220, textareaRef.current.scrollHeight)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const currentHistory = [...messages];
    setMessages(prev => [...prev, userMessage]);
    const originalInput = input;
    setInput('');
    setIsLoading(true);
    let fullResponse = '';

    try {
      const stream = generatePlanStream(
        originalInput, 
        currentHistory, 
        1,  // Smart defaults: Let our LLM parser analyze natural dates/duration
        userLocation || undefined
      );
      
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

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full space-y-6">
      {/* Premium Minimal Text Input Area */}
      <div className="space-y-4">
        <div className="relative rounded-2xl border border-brand-ink/10 bg-white/60 backdrop-blur-md p-5 transition-all duration-300 focus-within:border-brand-accent/30 focus-within:ring-2 focus-within:ring-brand-accent/10 focus-within:bg-white shadow-sm hover:shadow-md">
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
            placeholder="Goa trip with 10 friends from June 15 to June 18..."
            className="w-full bg-transparent border-none p-0 outline-none focus:ring-0 placeholder:text-brand-muted/30 text-base md:text-lg leading-relaxed resize-none min-h-[64px] max-h-[220px] overflow-y-auto text-brand-ink/90 font-medium"
          />
        </div>

        <Button 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="w-full bg-brand-ink text-white rounded-xl py-6 md:py-7 font-bold text-xs uppercase tracking-[2.5px] hover:bg-brand-accent hover:scale-[1.005] active:scale-[0.995] transition-all duration-300 shadow-xl shadow-brand-ink/5 flex items-center justify-center gap-2.5 group cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Plan My Journey</span>
              <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12 group-hover:scale-110" />
            </>
          )}
        </Button>
      </div>

      {/* Popular Suggestions Section */}
      {messages.length === 0 && !isLoading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[2px] font-bold text-brand-muted/70">Popular Searches</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {POPULAR_SEARCHES.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className={`text-left text-xs md:text-sm font-semibold px-4 py-3.5 border rounded-xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] ${
                  input === s 
                    ? 'border-brand-accent text-brand-accent bg-brand-accent/[0.03]' 
                    : 'border-brand-ink/[0.05] bg-white/40 text-brand-muted/80 hover:bg-brand-accent/[0.02] hover:border-brand-accent/25 hover:text-brand-accent'
                }`}
              >
                📍 {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Conversation Render */}
      {messages.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-brand-ink/5">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-1.5"
              >
                <span className="text-[9px] uppercase tracking-widest text-brand-muted/80 font-bold block">
                  {msg.role === 'user' ? 'Your Request' : 'TOUR IT AI'}
                </span>
                <div className={`text-sm md:text-base leading-relaxed p-5 rounded-2xl border ${
                  msg.role === 'user' 
                    ? 'bg-brand-ink/[0.02] border-brand-ink/[0.06] text-brand-ink font-medium shadow-sm' 
                    : 'bg-white border-brand-ink/[0.04] text-brand-muted shadow-md'
                }`}>
                  {msg.role === 'model' && msg.content.includes('### 🧳 Trip') ? (
                    <div className="space-y-4">
                      <div className="whitespace-pre-wrap">
                        {msg.content.match(/### 🧳 Trip([\s\S]*?)(?=---|### 📅 Plan|$)/i)?.[1].trim() || msg.content}
                      </div>
                      <div className="pt-3 border-t border-brand-ink/[0.04] italic font-semibold text-brand-accent text-xs flex items-center gap-1.5 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>Interactive trail, dynamic roadmap, and weather forecast updated below.</span>
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
              className="space-y-1.5"
            >
              <span className="text-[9px] uppercase tracking-widest text-brand-muted font-bold block">TOUR IT AI</span>
              <div className="flex items-center gap-2.5 text-xs md:text-sm text-brand-accent italic font-semibold bg-brand-accent/[0.02] p-5 rounded-2xl border border-brand-accent/10 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-brand-accent" />
                <span>Crafting your bespoke curated itinerary...</span>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
