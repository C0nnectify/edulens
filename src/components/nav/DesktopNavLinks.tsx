
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavDropdowns from './NavDropdowns';

const navLinks = [
  { to: "/events", label: "Events" },
  { to: "/marketplace", label: "Marketplace" },
];

export default function DesktopNavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex items-center space-x-4">
      <NavDropdowns />
      {navLinks.map(({ to, label }) => {
        const isActive = pathname === to;
        return (
          <Link
            key={to}
            href={to}
            className={
              isActive
                ? "text-emerald-700 font-semibold"
                : "text-gray-700 hover:text-emerald-700"
            }
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
