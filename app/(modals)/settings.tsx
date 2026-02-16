import { View, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0A0A0F',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '600' }}>
        Settings
      </Text>
    </View>
  );
}
