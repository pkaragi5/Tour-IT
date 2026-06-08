import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSun, 
  CloudDrizzle, 
  CloudLightning, 
  CloudFog, 
  Thermometer, 
  Droplets,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface WeatherWidgetProps {
  lat?: number;
  lng?: number;
  locationName?: string;
}

interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    precipitation: number;
    weatherCode: number;
    isDay: number;
  };
  daily: Array<{
    date: string;
    weatherCode: number;
    tempMax: number;
    tempMin: number;
  }>;
}

const getWeatherDetails = (code: number) => {
  switch (code) {
    case 0:
      return { label: 'Clear Skies', icon: Sun, color: 'text-amber-500 bg-amber-500/5 border-amber-500/10' };
    case 1:
    case 2:
    case 3:
      return { label: 'Partly Cloudy', icon: CloudSun, color: 'text-neutral-500 bg-neutral-500/5 border-neutral-500/10' };
    case 45:
    case 48:
      return { label: 'Foggy Conditions', icon: CloudFog, color: 'text-slate-400 bg-slate-400/5 border-slate-400/10' };
    case 51:
    case 53:
    case 55:
      return { label: 'Light Drizzle', icon: CloudDrizzle, color: 'text-blue-400 bg-blue-400/5 border-blue-400/10' };
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return { label: 'Rain Showers', icon: CloudRain, color: 'text-indigo-500 bg-indigo-500/5 border-indigo-500/10' };
    case 95:
    case 96:
    case 99:
      return { label: 'Thunderstorms', icon: CloudLightning, color: 'text-violet-500 bg-violet-500/5 border-violet-500/10' };
    default:
      return { label: 'Cloudy Skies', icon: Cloud, color: 'text-neutral-500 bg-neutral-500/5 border-neutral-500/10' };
  }
};

const formatDayName = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

export default function WeatherWidget({ lat, lng, locationName }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lat || !lng) return;

    let isMounted = true;
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to retrieve forecast data');
        const data = await res.json();

        if (isMounted) {
          const formattedCurrent = {
            temp: Math.round(data.current.temperature_2m),
            feelsLike: Math.round(data.current.apparent_temperature),
            humidity: data.current.relative_humidity_2m,
            precipitation: data.current.precipitation,
            weatherCode: data.current.weather_code,
            isDay: data.current.is_day,
          };

          const formattedDaily = data.daily.time.slice(0, 3).map((timeStr: string, index: number) => ({
            date: formatDayName(timeStr),
            weatherCode: data.daily.weather_code[index],
            tempMax: Math.round(data.daily.temperature_2m_max[index]),
            tempMin: Math.round(data.daily.temperature_2m_min[index]),
          }));

          setWeather({ current: formattedCurrent, daily: formattedDaily });
        }
      } catch (err) {
        console.error('Weather Fetch Error:', err);
        if (isMounted) setError('Precipitation and forecast data temporarily unreachable.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, [lat, lng]);

  if (!lat || !lng) return null;

  return (
    <div id="weather-forecast-component" className="border editorial-border rounded-xl bg-white premium-shadow overflow-hidden p-5 space-y-5">
      {/* Header section with loading indicator */}
      <div className="flex justify-between items-center border-b editorial-border pb-3">
        <div className="space-y-0.5">
          <span className="text-[9px] uppercase tracking-[1.5px] font-bold text-brand-muted block">Expected Conditions</span>
          <h4 className="text-xs font-bold font-sans text-brand-ink">
            {locationName ? `Weather in ${locationName}` : 'Local Weather Forecast'}
          </h4>
        </div>
        {loading && (
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-brand-accent">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping"></div>
            Syncing
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg border border-red-500/10 bg-red-500/5 text-red-700 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        ) : loading && !weather ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-5"
          >
            {/* Loading Skeletion */}
            <div className="md:col-span-6 flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 bg-neutral-100 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-neutral-100 rounded w-1/3"></div>
                <div className="h-3 bg-neutral-100 rounded w-1/2"></div>
              </div>
            </div>
            <div className="md:col-span-6 grid grid-cols-3 gap-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-neutral-100 rounded-lg"></div>
              ))}
            </div>
          </motion.div>
        ) : weather ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
          >
            {/* Current weather overview */}
            <div className="md:col-span-6 flex items-center gap-5">
              {(() => {
                const config = getWeatherDetails(weather.current.weatherCode);
                const IconComponent = config.icon;
                return (
                  <>
                    <div className={`p-4 rounded-full border ${config.color} shrink-0`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-serif font-bold tracking-tight text-brand-ink">
                          {weather.current.temp}°C
                        </span>
                        <span className="text-[10px] text-brand-muted uppercase font-bold">
                          {config.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-brand-muted font-medium">
                        <span className="flex items-center gap-1">
                          <Thermometer className="w-3.5 h-3.5 text-brand-muted/70" />
                          Feels like {weather.current.feelsLike}°
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Droplets className="w-3.5 h-3.5 text-blue-400" />
                          {weather.current.humidity}% Humidity
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* 3-day forecast outlook */}
            <div className="md:col-span-6 grid grid-cols-3 gap-3">
              {weather.daily.map((dayData, idx) => {
                const config = getWeatherDetails(dayData.weatherCode);
                const IconComponent = config.icon;
                return (
                  <div 
                    key={idx} 
                    className="border border-brand-ink/[0.04] bg-brand-bg/40 rounded-xl p-2.5 text-center flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-muted">
                      {idx === 0 ? 'Today' : dayData.date}
                    </span>
                    <IconComponent className={`w-5 h-5 ${config.color.split(' ')[0]}`} />
                    <div className="flex justify-center items-baseline gap-1 text-[11px] font-bold text-brand-ink">
                      <span>{dayData.tempMax}°</span>
                      <span className="text-[9px] font-medium text-brand-muted">{dayData.tempMin}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
