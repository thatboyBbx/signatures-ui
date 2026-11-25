import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { AppState, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAtmosphere } from '../context/AtmosphereContext';
import { useReducedMotion } from './useReducedMotion';

/** Native hero player, kept mounted through transient playback failures. */
export function AtmosphereVideo({ active = true, variant = 'grill' }: { active?: boolean; variant?: 'grill' | 'bar' | 'delivery' | 'menu' }) {
  const source = variant === 'menu' ? require('../../assets/paramount/menu-dishes.mp4') : variant === 'delivery' ? require('../../assets/paramount/delivery-packing.mp4') : variant === 'bar' ? require('../../assets/paramount/bar-cocktail.mp4') : require('../../assets/paramount/paramount-grill.mp4');
  const focused = useIsFocused();
  const { paused, resume } = useAtmosphere();
  const reduced = useReducedMotion();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [failed, setFailed] = useState(false);
  const player = useVideoPlayer(source, instance => {
    instance.loop = true;
    instance.muted = true;
    instance.audioMixingMode = 'mixWithOthers';
    instance.keepScreenOnWhilePlaying = false;
  });
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    const subscription = player.addListener('statusChange', ({ status }) => setFailed(status === 'error'));
    return () => subscription.remove();
  }, [player]);
  useEffect(() => {
    if (active && focused && foreground && !paused && !reduced && !failed) player.play();
    else player.pause();
    return () => player.pause();
  }, [active, focused, foreground, paused, reduced, failed, player]);
  return <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <Image source={variant === 'menu' ? require('../../assets/paramount/menu-dishes.jpg') : variant === 'delivery' ? require('../../assets/paramount/delivery-packing.jpg') : variant === 'bar' ? require('../../assets/paramount/bar-cocktail.jpg') : require('../../assets/paramount/grill.jpg')} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
    {!reduced && <VideoView player={player} nativeControls={false} contentFit="cover" playsInline allowsPictureInPicture={false} fullscreenOptions={{ enable: false }} surfaceType="textureView" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: failed ? 0 : 1 }]} />}
    </View>
    {failed && !reduced && <Pressable accessibilityRole="button" accessibilityLabel={`Retry ${variant} video`} onPress={() => {
      resume();
      void player.replaceAsync(source).catch(() => setFailed(true));
    }} style={{ position: 'absolute', bottom: 24, right: 20, minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(25,19,14,0.85)' }}><Text style={{ color: '#FFF4DF', fontSize: 12 }}>Play {variant} video</Text></Pressable>}
  </View>;
}
