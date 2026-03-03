'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  href: string;
  icon: string;
  activeIcon: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: 'home', activeIcon: 'home', label: 'Feed' },
  { href: '/explorar', icon: 'search', activeIcon: 'search', label: 'Explorar' },
  { href: '/biblioteca', icon: 'school', activeIcon: 'school', label: 'Biblioteca' },
  { href: '/perfil', icon: 'person', activeIcon: 'person', label: 'Perfil' },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-dark border-t border-white/5 pb-5 pt-2 px-2 z-50">
      <ul className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <li key={item.label} className="flex-1">
              <Link
                href={item.href}
                className="flex flex-col items-center gap-1 p-2 group"
              >
                <span
                  className={`material-icons-round text-2xl transition-colors ${
                    active ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'
                  }`}
                >
                  {active ? item.activeIcon : item.icon}
                </span>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    active ? 'font-bold text-primary' : 'text-gray-500 group-hover:text-gray-300'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
