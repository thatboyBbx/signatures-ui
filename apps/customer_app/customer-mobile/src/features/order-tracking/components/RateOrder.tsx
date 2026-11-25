import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import { haptic } from '../../../components/haptics';
import { useRatings } from '../../../context/RatingsContext';
import type { Order } from '../../../types/order';
import { colors, fonts } from '../../../theme/theme';

const cream = '#F3E6CF';
const soft = 'rgba(243,230,207,0.62)';
const words = ['', 'Poor', 'Not great', 'Good', 'Very good', 'Excellent'];

/** One tap from 1 to 5 saves the rating; a note is optional. Ratings feed the dish ratings on the menu. */
export function RateOrder({ order }: { order: Order }) {
  const { rate, ratingFor } = useRatings();
  const saved = ratingFor(order.id);
  const [note, setNote] = useState(saved?.note ?? '');
  const [noteSent, setNoteSent] = useState(Boolean(saved?.note));
  const score = saved?.score ?? 0;
  return <View style={styles.card}>
    <Text style={styles.eyebrow}>{score ? 'THANKS FOR RATING' : 'HOW WAS IT?'}</Text>
    <View accessibilityRole="radiogroup" style={styles.stars}>
      {[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={`${value} out of 5, ${words[value]}`} accessibilityState={{ checked: value === score }} aria-checked={value === score}
        hitSlop={4} onPress={() => { rate(order, value, noteSent ? note : undefined); haptic(); }} style={styles.star}>
        <Ionicons name={value <= score ? 'star' : 'star-outline'} size={32} color={value <= score ? '#FFC27A' : 'rgba(243,230,207,0.4)'} />
      </Pressable>)}
    </View>
    {score > 0 && <Text style={styles.word}>{words[score]}</Text>}
    {score > 0 && !noteSent && <View style={styles.noteRow}>
      <TextInput accessibilityLabel="Add a note (optional)" placeholder="Add a note (optional)" placeholderTextColor={soft} value={note} onChangeText={setNote} maxLength={280} style={styles.input} />
      <Pressable accessibilityRole="button" disabled={!note.trim()} onPress={() => { rate(order, score, note); setNoteSent(true); }} style={[styles.send, !note.trim() && { opacity: 0.45 }]}>
        <Text style={styles.sendText}>Send</Text>
      </Pressable>
    </View>}
    {noteSent && !!note.trim() && <Text style={styles.sent}>“{note.trim()}”</Text>}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(233,211,174,0.14)', backgroundColor: '#1C140E', padding: 18, gap: 12, alignItems: 'center' },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.6, color: colors.gold },
  stars: { flexDirection: 'row', gap: 6 },
  star: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  word: { fontFamily: fonts.headingItalic, fontSize: 20, color: cream, marginTop: -4 },
  noteRow: { alignSelf: 'stretch', flexDirection: 'row', gap: 8 },
  input: { flex: 1, minHeight: 46, paddingHorizontal: 16, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(233,211,174,0.25)', fontFamily: fonts.body, fontSize: 14, color: cream },
  send: { minHeight: 46, paddingHorizontal: 20, borderRadius: 23, backgroundColor: '#B4461F', alignItems: 'center', justifyContent: 'center' },
  sendText: { fontFamily: fonts.bold, fontSize: 14, color: '#FFF4DF' },
  sent: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: soft, textAlign: 'center' },
});
