import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme';

type ToastOptions = {
  duration?: number; // ms
  action?: { label: string; onPress: () => void };
};

type ToastContextType = {
  show: (message: string, options?: ToastOptions) => void;
  hide: () => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [action, setAction] = useState<ToastOptions['action']>(undefined);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const hideTimer = useRef<null | ReturnType<typeof setTimeout>>(null);

  const hide = useCallback(() => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 20, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => {
      setMessage(null);
      setAction(undefined);
    });
  }, []);

  const show = useCallback((msg: string, options?: ToastOptions) => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    setMessage(msg);
    setAction(options?.action);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    const duration = Math.min(options?.duration ?? 2000, 2000);
    hideTimer.current = setTimeout(() => hide(), duration);
  }, [hide]);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {/* Toast Overlay */}
        <View
          pointerEvents={message ? 'box-none' : 'none'}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' }}
        >
          <Animated.View
            // Tap to dismiss immediately
            onTouchEnd={hide as any}
            style={{
              opacity,
              transform: [{ translateY }],
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: theme.colors.text,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 10,
              elevation: 6,
              maxWidth: '92%',
              zIndex: 999999,
            }}
          >
            {!!message && (
              <Text style={{ color: '#fff', fontWeight: '700' }}>{message}</Text>
            )}
            {!!action && (
              <TouchableOpacity onPress={() => { action.onPress(); hide(); }}>
                <Text style={{ color: theme.colors.onDark, fontWeight: '900' }}>{action.label}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
