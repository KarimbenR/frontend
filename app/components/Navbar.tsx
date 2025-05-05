'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-xl font-semibold text-white">Dashboard</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-300">
              <User size={20} />
              <span>{session?.user?.name}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-gray-300 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
} 