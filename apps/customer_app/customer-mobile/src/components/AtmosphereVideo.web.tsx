import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { AppState, AssetRegistry, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAtmosphere } from '../context/AtmosphereContext';
import { useReducedMotion } from './useReducedMotion';

const videos: Record<'grill' | 'bar' | 'delivery' | 'menu', string | number | { uri: string }> = {
  grill: require('../../assets/paramount/paramount-grill.mp4'),
  delivery: require('../../assets/paramount/delivery-packing.mp4'),
  bar: require('../../assets/paramount/bar-cocktail.mp4'),
  menu: require('../../assets/paramount/menu-dishes.mp4'),
};
function resolveVideo(bundledVideo: string | number | { uri: string }) {
  if (typeof bundledVideo === 'string') return bundledVideo;
  if (typeof bundledVideo === 'object') return bundledVideo.uri;
  const asset = AssetRegistry.getAssetByID(bundledVideo);
  if (!asset) return '';
  const location = __DEV__ ? asset.httpServerLocation : asset.httpServerLocation.replace(/\.\.\//g, '_');
  return `${location}/${asset.name}.${asset.type}`;
}

/** Use the browser's muted inline player directly, with a visible recovery action. */
export function AtmosphereVideo({ active = true, variant = 'grill' }: { active?: boolean; variant?: 'grill' | 'bar' | 'delivery' | 'menu' }) {
  const source = resolveVideo(videos[variant]);
  const video = useRef<HTMLVideoElement>(null);
  const focused = useIsFocused();
  const { paused, resume } = useAtmosphere();
  const reduced = useReducedMotion();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const shouldPlay = active && focused && foreground && !paused && !reduced;
  const wantsPlayback = useRef(shouldPlay);
  wantsPlayback.current = shouldPlay;
  const attempt = useCallback(() => {
    const element = video.current;
    if (!element || !shouldPlay) return;
    element.muted = true;
    element.defaultMuted = true;
    void element.play().then(() => setBlocked(false)).catch(() => { if (wantsPlayback.current) setBlocked(true); });
  }, [shouldPlay]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (shouldPlay) attempt();
    else video.current?.pause();
    return () => video.current?.pause();
  }, [shouldPlay, attempt]);
  return <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <Image source={variant === 'menu' ? require('../../assets/paramount/menu-dishes.jpg') : variant === 'delivery' ? require('../../assets/paramount/delivery-packing.jpg') : variant === 'bar' ? require('../../assets/paramount/bar-cocktail.jpg') : require('../../assets/paramount/grill.jpg')} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
      {createElement('video', {
        ref: video, src: source, muted: true, loop: true, playsInline: true, preload: 'auto', 'aria-hidden': true,
        style: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: ready && !reduced ? 1 : 0 },
        onCanPlay: () => { setReady(true); attempt(); },
        onPlaying: () => { setReady(true); setBlocked(false); },
        onError: () => { setReady(false); setBlocked(true); },
      })}
    </View>
    {blocked && !reduced && <Pressable accessibilityRole="button" accessibilityLabel={`Retry ${variant} video`} onPress={() => {
      resume();
      const element = video.current;
      if (!element) return;
      if (element.error) element.load();
      element.muted = true;
      void element.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
    }} style={{ position: 'absolute', zIndex: 10, bottom: 24, right: 20, minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 22, backgroundColor: 'rgba(25,19,14,0.85)' }}>
      <Text style={{ color: '#FFF4DF', fontSize: 12 }}>Play {variant} video</Text>
    </Pressable>}
  </View>;
}
