import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Cloud, CloudOff, ChevronDown, CheckCircle2 } from 'lucide-react';
import { User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface UserAvatarMenuProps {
  user: FirebaseUser | null;
  onOpenAuthModal: () => void;
}

export const UserAvatarMenu: React.FC<UserAvatarMenuProps> = ({ user, onOpenAuthModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  if (!user) {
    return (
      <button
        onClick={onOpenAuthModal}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors border border-slate-200 cursor-pointer"
        title="Sign In / Sync to Firebase Firestore"
      >
        <CloudOff className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline">Cloud Sync</span>
      </button>
    );
  }

  const initial = user.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
        title={`Signed in as ${user.email}`}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="User Avatar" className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
            {initial}
          </div>
        )}
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Firestore Connected"></div>
        <ChevronDown className="w-3 h-3 text-indigo-700" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 animate-fadeIn">
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Firestore Active</p>
                <p className="text-xs font-bold text-slate-800 truncate max-w-[170px]">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="py-2 space-y-1">
            <div className="px-2 py-1 bg-slate-50 rounded-lg text-[10px] text-slate-500 leading-tight">
              Cloud backups active for Quotations, BOQs, Invoices & Reports.
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full mt-1 flex items-center space-x-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
