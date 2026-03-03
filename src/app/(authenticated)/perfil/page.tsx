'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { INTELLIGENCES } from '@/constants/intelligences';
import type { ProfileStats, Reflection, StudentIntelligence } from '@/types';

export default function PerfilPage() {
  const { student, logout } = useAuth();
  const { token } = useAuthStore();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const [statsRes, reflectionsRes] = await Promise.all([
        fetch('/api/profile/stats', { headers }),
        fetch('/api/profile/reflections', { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (reflectionsRes.ok) {
        const data = await reflectionsRes.json();
        setReflections(data.reflections || []);
      }
    } catch (err) {
      console.error('Profile error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading || !student) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const strongestIntelligence = stats?.intelligences?.reduce(
    (best: StudentIntelligence | null, curr: StudentIntelligence) =>
      !best || curr.score > best.score ? curr : best,
    null
  );

  return (
    <div className="min-h-screen bg-background-dark relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-[-10%] left-[-20%] w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-15%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-40 glass-panel flex items-center justify-between px-5 pt-12 pb-4">
        <span className="text-lg font-bold text-white">PERFIL</span>
        <button className="w-10 h-10 rounded-full glass-icon flex items-center justify-center">
          <span className="material-icons-round text-white">settings</span>
        </button>
      </div>

      <div className="relative z-10 px-5 py-6 space-y-8">
        {/* Profile Hero */}
        <div className="flex flex-col items-center">
          <div className="relative group mb-4">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000" />
            <div className="relative w-24 h-24 rounded-full bg-surface-dark border-4 border-background-dark flex items-center justify-center overflow-hidden">
              {student.avatarUrl ? (
                <img alt={student.firstName} className="w-full h-full object-cover" src={student.avatarUrl} />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {student.firstName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold text-white">{student.firstName} {student.lastName?.charAt(0)}.</h2>
          <p className="text-sm text-gray-400">@{student.firstName.toLowerCase()}_ceo</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="school"
            iconColor="#06b6d4"
            value={stats?.totalGeniusesExplored || 0}
            label="Genios"
          />
          <StatCard
            icon="star"
            iconColor="#60a5fa"
            value={stats?.totalLessonsDiscovered || 0}
            label="Lecciones"
          />
        </div>

        {/* Knowledge Footprint */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Mi Huella</h3>
            <span className="material-icons-round text-gray-500 text-lg">info</span>
          </div>

          <div className="space-y-4">
            {INTELLIGENCES.map((intel) => {
              const userIntel = stats?.intelligences?.find(
                (i) => i.intelligenceCode === intel.code
              );
              const score = userIntel?.score || 0;

              return (
                <div key={intel.code} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${intel.color}20` }}
                  >
                    <span
                      className="material-icons-round text-base"
                      style={{ color: intel.color }}
                    >
                      {intel.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-300">{intel.name}</span>
                      <span className="text-xs text-gray-400">{score}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${score}%`,
                          backgroundColor: intel.color,
                          boxShadow: `0 0 10px ${intel.color}80`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {strongestIntelligence && (
            <p className="text-xs text-gray-400 mt-4 text-center">
              Tu inteligencia mas fuerte es{' '}
              <span className="text-primary font-semibold">
                {INTELLIGENCES.find((i) => i.code === strongestIntelligence.intelligenceCode)?.name}
              </span>
            </p>
          )}
        </div>

        {/* Recent Reflections */}
        {reflections.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-white mb-4">Mis Reflexiones</h3>
            <div className="space-y-3">
              {reflections.slice(0, 5).map((ref) => (
                <div key={ref.id} className="glass-card rounded-xl p-4">
                  <p className="text-sm text-white mb-2 line-clamp-3">{ref.content}</p>
                  <div className="flex items-center gap-2">
                    <span className="material-icons-round text-xs text-primary">school</span>
                    <span className="text-[10px] text-gray-400">
                      {ref.geniusName} • {ref.lessonTitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 text-red-400 text-sm font-medium"
        >
          <span className="material-icons-round text-lg">logout</span>
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconColor,
  value,
  label,
  pulse,
}: {
  icon: string;
  iconColor: string;
  value: number;
  label: string;
  pulse?: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2">
      <span
        className={`material-icons-round text-2xl ${pulse ? 'animate-pulse' : ''}`}
        style={{ color: iconColor }}
      >
        {icon}
      </span>
      <span className="text-2xl font-extrabold text-white">{value}</span>
      <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}
