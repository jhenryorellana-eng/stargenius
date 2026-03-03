'use client';

import { useEffect, useCallback } from 'react';
import type { SuperAppMessage } from '@/types';

interface UseSuperAppBridgeOptions {
  onMessage?: (message: SuperAppMessage) => void;
}

export function useSuperAppBridge(options: UseSuperAppBridgeOptions = {}) {
  const { onMessage } = options;

  useEffect(() => {
    if (!onMessage) return;

    const handleAppMessage = (event: CustomEvent) => {
      try {
        const message = event.detail as SuperAppMessage;
        onMessage(message);
      } catch (error) {
        console.error('Error handling app message:', error);
      }
    };

    window.addEventListener('appMessage', handleAppMessage as EventListener);
    return () => {
      window.removeEventListener('appMessage', handleAppMessage as EventListener);
    };
  }, [onMessage]);

  const sendToSuperApp = useCallback((message: SuperAppMessage) => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  }, []);

  const sendNotification = useCallback(
    (title: string, message: string, data?: Record<string, unknown>) => {
      sendToSuperApp({
        type: 'NOTIFICATION',
        payload: {
          title,
          message,
          miniAppId: 'stargenius',
          ...data,
        },
      });
    },
    [sendToSuperApp]
  );

  const requestClose = useCallback(() => {
    sendToSuperApp({ type: 'CLOSE' });
  }, [sendToSuperApp]);

  const notifyLogout = useCallback(() => {
    sendToSuperApp({ type: 'LOGOUT' });
  }, [sendToSuperApp]);

  const navigateInSuperApp = useCallback(
    (route: string) => {
      sendToSuperApp({
        type: 'NAVIGATE',
        payload: { route },
      });
    },
    [sendToSuperApp]
  );

  const requestRefresh = useCallback(() => {
    sendToSuperApp({ type: 'REFRESH' });
  }, [sendToSuperApp]);

  const isInWebView = typeof window !== 'undefined' && !!window.ReactNativeWebView;

  return {
    isInWebView,
    sendToSuperApp,
    sendNotification,
    requestClose,
    notifyLogout,
    navigateInSuperApp,
    requestRefresh,
  };
}
