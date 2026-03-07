import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { User, Scale, Ruler, Target, Save } from 'lucide-react-native';
import { useWorkout } from '../context/WorkoutContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, updateProfile } = useWorkout();
  const [form, setForm] = useState(userProfile);

  const handleSave = () => {
    updateProfile(form);
    Alert.alert('Profile Saved', 'Your details have been updated locally.');
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <User color="#fff" size={50} />
        </View>
        <Text style={styles.headerTitle}>User Profile</Text>
        <Text style={styles.headerSub}>Stored only on your device</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <User color="#00b894" size={18} />
            <Text style={styles.label}>FULL NAME</Text>
          </View>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(t) => setForm({...form, name: t})}
            placeholder="e.g. John Doe"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <View style={styles.labelRow}>
              <Scale color="#0984e3" size={18} />
              <Text style={styles.label}>WEIGHT (KG)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={form.weight}
              keyboardType="numeric"
              onChangeText={(t) => setForm({...form, weight: t})}
              placeholder="75"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <View style={styles.labelRow}>
              <Ruler color="#e17055" size={18} />
              <Text style={styles.label}>HEIGHT (CM)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={form.height}
              keyboardType="numeric"
              onChangeText={(t) => setForm({...form, height: t})}
              placeholder="180"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Target color="#6c5ce7" size={18} />
            <Text style={styles.label}>FITNESS GOAL</Text>
          </View>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            value={form.goal}
            multiline
            onChangeText={(t) => setForm({...form, goal: t})}
            placeholder="e.g. Build muscle, lose weight, run a 5k..."
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save color="#fff" size={24} />
          <Text style={styles.saveButtonText}>SAVE DETAILS</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#00b894', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 5 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#2d3436' },
  headerSub: { fontSize: 14, color: '#b2bec3', fontWeight: '600' },
  section: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '800', color: '#636e72', marginLeft: 8, letterSpacing: 1 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 15, fontSize: 16, color: '#2d3436', elevation: 1, borderWidth: 1, borderBottomColor: '#eee' },
  row: { flexDirection: 'row' },
  saveButton: { backgroundColor: '#00b894', padding: 18, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, elevation: 4 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: '900', marginLeft: 12 }
});
