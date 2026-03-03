'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDevLogin, setShowDevLogin] = useState(false);
  const [devLoading, setDevLoading] = useState(false);

  const getIsLocalhost = () => {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  };

  const [isDev] = useState(getIsLocalhost);

  const handleDevLogin = async () => {
    setDevLoading(true);
    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error en login de desarrollo');
        setDevLoading(false);
        return;
      }

      const { token, student } = await response.json();
      setAuth(token, student);
      router.replace('/');
    } catch (err) {
      console.error('Dev login error:', err);
      setError('Error de conexión');
      setDevLoading(false);
    }
  };

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(
        errorParam === 'session_expired'
          ? 'Tu sesión ha expirado. Vuelve a abrir la app desde CEO Junior.'
          : 'Ha ocurrido un error de autenticación.'
      );
      setIsLoading(false);
      setShowDevLogin(isDev);
      return;
    }

    if (!code) {
      if (isDev) {
        setShowDevLogin(true);
        setIsLoading(false);
        return;
      }
      setError('No se proporcionó un código de acceso. Abre la app desde CEO Junior.');
      setIsLoading(false);
      return;
    }

    async function authenticate() {
      try {
        const response = await fetch('/api/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Código inválido o expirado. Intenta de nuevo.');
          setIsLoading(false);
          return;
        }

        const { token, student } = await response.json();
        setAuth(token, student);
        router.replace('/');
      } catch (err) {
        console.error('Auth error:', err);
        setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
        setIsLoading(false);
      }
    }

    authenticate();
  }, [searchParams, router, setAuth, isDev]);

  // Dev login screen
  if (showDevLogin && !error) {
    return (
      <div className="min-h-screen bg-app-black flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)' }}>
            <span className="material-icons-round text-white text-4xl">developer_mode</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Modo Desarrollo
          </h1>
          <p className="text-gray-400 mb-8">
            Entra como estudiante de prueba para explorar StarGenius.
          </p>
          <button
            onClick={handleDevLogin}
            disabled={devLoading}
            className="w-full btn-gradient py-4 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {devLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <span className="material-icons-round text-xl">login</span>
                Entrar como Estudiante Demo
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-6">
            Solo disponible en entorno de desarrollo
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-black flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-icons-round text-red-400 text-4xl">error</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Error de autenticación
          </h1>
          <p className="text-gray-400 mb-8">{error}</p>
          {showDevLogin && (
            <button
              onClick={handleDevLogin}
              disabled={devLoading}
              className="w-full glass-card text-primary border border-primary/30 font-semibold py-4 px-6 rounded-xl mb-3 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {devLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <span className="material-icons-round text-xl">developer_mode</span>
                  Entrar en Modo Dev
                </>
              )}
            </button>
          )}
          <button
            onClick={() => {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({ type: 'CLOSE' })
                );
              }
            }}
            className="w-full btn-gradient py-4 px-6 rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-black flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)' }}>
            <span className="material-icons-round text-white text-4xl">psychology</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">StarGenius</h1>
          <p className="text-gray-400">Iniciando sesión...</p>
          <div className="mt-6 flex justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-app-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)' }}>
              <span className="material-icons-round text-white text-4xl">psychology</span>
            </div>
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
