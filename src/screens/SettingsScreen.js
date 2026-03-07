import React from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity } from 'react-native';
import { User, Bell, Shield, Info, LogOut, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);

  const SettingItem = ({ icon: Icon, title, value, type = 'chevron' }) => (
    <TouchableOpacity style={styles.item}>
      <View style={styles.itemLeft}>
        <View style={styles.iconBox}>
          <Icon color="#2d3436" size={20} />
        </View>
        <Text style={styles.itemTitle}>{title}</Text>
      </View>
      {type === 'switch' ? (
        <Switch value={value} onValueChange={setNotifications} />
      ) : (
        <ChevronRight color="#b2bec3" size={20} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
           <User color="#fff" size={40} />
        </View>
        <Text style={styles.userName}>Guest User</Text>
        <Text style={styles.userEmail}>Join to sync your progress</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>App Settings</Text>
        <SettingItem icon={Bell} title="Notifications" value={notifications} type="switch" />
        <SettingItem icon={Shield} title="Privacy Policy" />
        <SettingItem icon={Info} title="Help & Support" />
      </View>

      <TouchableOpacity style={styles.logoutBtn}>
        <LogOut color="#d63031" size={20} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00b894',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  userName: { fontSize: 24, fontWeight: '900', color: '#2d3436' },
  userEmail: { fontSize: 14, color: '#b2bec3', marginTop: 4, fontWeight: '600' },
  section: { marginTop: 20, paddingHorizontal: 15 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#b2bec3', textTransform: 'uppercase', marginLeft: 10, marginBottom: 10 },
  item: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 1
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#2d3436' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    padding: 15
  },
  logoutText: { color: '#d63031', fontSize: 18, fontWeight: '800', marginLeft: 10 }
});
