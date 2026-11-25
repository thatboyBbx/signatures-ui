import { useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Polygon } from 'react-native-svg';
import { useReducedMotion } from './useReducedMotion';

const stops = [[0,'c3c6c4'],[8,'fffdf2'],[16,'9f9f95'],[28,'b49044'],[37,'ffe1a0'],[46,'96713b'],[58,'f2f4ee'],[67,'858e90'],[75,'e7e8de'],[85,'c8a963'],[94,'fff1ce'],[100,'c3c6c4']] as const;
const segments = Array.from({ length: 180 }, (_, index) => {
  const percent = (index + 0.5) / 180 * 100;
  const upper = stops.findIndex(stop => stop[0] >= percent);
  const [start, first] = stops[upper - 1];
  const [end, last] = stops[upper];
  const mix = (percent - start) / (end - start);
  const color = [0, 2, 4].map(channel => Math.round(parseInt(first.slice(channel, channel + 2), 16) * (1 - mix) + parseInt(last.slice(channel, channel + 2), 16) * mix));
  const point = (degrees: number) => `${Math.sin(degrees * Math.PI / 180) * 600},${-Math.cos(degrees * Math.PI / 180) * 600}`;
  return { color: `rgb(${color.join(',')})`, points: `0,0 ${point(index * 2)} ${point((index + 1) * 2 + 0.1)}` };
});

function pill(x: number, y: number, width: number, height: number) {
  const radius = height / 2;
  return `M${x + radius},${y} H${x + width - radius} a${radius},${radius} 0 0 1 0,${height} H${x + radius} a${radius},${radius} 0 0 1 0,${-height} Z`;
}

/** Native conic equivalent, clipped to a two-point pill perimeter. */
export function MetallicEdge({ width, height, active = true }: { width: number; height: number; active?: boolean }) {
  const clip = useId().replace(/:/g, '');
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    if (reduced || !active) { progress.setValue(0); setAngle(0); return; }
    const listener = progress.addListener(({ value }) => setAngle(value * 360));
    const loop = Animated.loop(Animated.timing(progress, { toValue: 1, duration: 3600, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => { loop.stop(); progress.removeListener(listener); progress.setValue(0); };
  }, [active, reduced, progress]);
  if (!width || !height) return null;
  const ring = `${pill(0, 0, width, height)} ${pill(2, 2, width - 4, height - 4)}`;
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <Svg width={width} height={height}>
      <Defs><ClipPath id={clip}><Path d={ring} clipRule="evenodd" fillRule="evenodd" /></ClipPath></Defs>
      <G clipPath={`url(#${clip})`}><Path d={ring} fill="#b6a785" fillRule="evenodd" />
        <G opacity={0.6} transform={`translate(${width / 2} ${height / 2}) rotate(${angle})`}>
          {segments.map((segment, index) => <Polygon key={index} points={segment.points} fill={segment.color} />)}
        </G>
      </G>
    </Svg>
  </View>;
}
