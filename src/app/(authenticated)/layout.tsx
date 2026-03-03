'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useSuperAppBridge } from '@/hooks/use-super-app-bridge';
import { BottomNav } from '@/components/layout/BottomNav';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, loadFromStorage, token } = useAuthStore();
  const { isInWebView } = useSuperAppBridge();
  const notificationsSentRef = useRef(false);

  // Hide nav only on genius detail pages (immersive experience)
  const shouldHideNav = pathname.startsWith('/explorar/genio/');

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/callback?error=session_expired');
    }
  }, [isLoading, isAuthenticated, router]);

  // Enviar notificaciones pendientes al super app via WebView bridge
  useEffect(() => {
    if (!isAuthenticated || !token || notificationsSentRef.current) return;
    if (typeof window === 'undefined' || !(window as any).ReactNativeWebView) return;

    notificationsSentRef.current = true;

    async function sendPendingNotifications() {
      try {
        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return;

        const { notifications } = await res.json();
        if (!notifications || notifications.length === 0) return;

        // Enviar cada notificacion al super app
        for (const notif of notifications) {
          (window as any).ReactNativeWebView.postMessage(JSON.stringify({
            type: 'NOTIFICATION',
            payload: {
              title: notif.title,
              message: notif.message,
              miniAppId: 'stargenius',
            },
          }));
        }

        // Marcar como leidas
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationIds: notifications.map((n: any) => n.id),
          }),
        });
      } catch (err) {
        console.error('Error sending notifications:', err);
      }
    }

    sendPendingNotifications();
  }, [isAuthenticated, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`min-h-screen bg-app-black ${!shouldHideNav ? 'pb-20' : ''}`}>
      <main>{children}</main>
      {!shouldHideNav && <BottomNav />}
    </div>
  );
}
