import React from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function BackgroundLayout({ children }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF4FF", "#F8FAFF", "#FFFFFF"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Curva superior derecha */}
      <View style={styles.topCircle} />

      {/* Curva inferior izquierda */}
      <View style={styles.bottomCircle} />

      {/* Imagen de los árboles/campus (fondo inferior) */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1000&q=80' }}
        style={styles.campus}
        resizeMode="cover"
      />

      <View style={StyleSheet.absoluteFillObject}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  topCircle: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: "#DCE8FF",
    top: -170,
    right: -170,
    opacity: 0.8,
  },
  bottomCircle: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: "#EDF4FF",
    bottom: -200,
    left: -180,
    opacity: 0.8,
  },
  campus: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "35%",
    opacity: 0.12,
  },
});
