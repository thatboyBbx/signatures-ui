import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { Animated } from 'react-native';

const AtmosphereContext = createContext<{
  paused: boolean; toggle: () => void; resume: () => void; scrolled: boolean; setScrolled: (value: boolean) => void;
  onHome: boolean; setOnHome: (value: boolean) => void; scrollY: Animated.Value;
  heroHeight: number; setHeroHeight: (value: number) => void;
  lightHeader: boolean; setLightHeader: (value: boolean) => void;
} | null>(null);

export function AtmosphereProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [onHome, setOnHome] = useState(true);
  const [heroHeight, setHeroHeight] = useState(460);
  const [lightHeader, setLightHeader] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  return <AtmosphereContext.Provider value={{ paused, toggle: () => setPaused(value => !value), resume: () => setPaused(false), scrolled, setScrolled, onHome, setOnHome, scrollY, heroHeight, setHeroHeight, lightHeader, setLightHeader }}>{children}</AtmosphereContext.Provider>;
}

export function useOptionalAtmosphere() { return useContext(AtmosphereContext); }

export function useAtmosphere() {
  const value = useContext(AtmosphereContext);
  if (!value) throw new Error('AtmosphereProvider is required');
  return value;
}
