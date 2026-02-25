/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Search, 
  Plus, 
  User as UserIcon, 
  Briefcase, 
  Navigation, 
  Clock, 
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User, Post, Role } from './types';

// Mock user ID for demo purposes
const MOCK_USER_ID = 'user_' + Math.random().toString(36).substr(2, 9);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('worker');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [postCategory, setPostCategory] = useState('General');

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          setError("Location access denied. Please enable GPS to see nearby results.");
          console.error(err);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (location && user) {
      fetchNearby();
    }
  }, [location, user, role]);

  const fetchNearby = async () => {
    if (!location) return;
    setLoading(true);
    try {
      if (role === 'employer') {
        // Employers search for workers
        const res = await fetch(`/api/workers/nearby?lat=${location.lat}&lng=${location.lng}`);
        const data = await res.json();
        setWorkers(data);
      } else {
        // Workers search for jobs/posts
        const res = await fetch(`/api/posts/nearby?lat=${location.lat}&lng=${location.lng}`);
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (name: string) => {
    if (!location) return;
    const newUser: User = {
      id: MOCK_USER_ID,
      name,
      role,
      lat: location.lat,
      lng: location.lng
    };
    
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      setUser(newUser);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !location) return;

    const newPost = {
      id: 'post_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      title: postTitle,
      description: postDesc,
      category: postCategory,
      lat: location.lat,
      lng: location.lng
    };

    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });
      setIsPosting(false);
      setPostTitle('');
      setPostDesc('');
      fetchNearby();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = useMemo(() => {
    if (role === 'employer') {
      return workers.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return posts.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workers, posts, searchQuery, role]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-sm max-w-md w-full border border-black/5"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center">
              <Navigation className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-center mb-2 tracking-tight">WorkNearby</h1>
          <p className="text-neutral-500 text-center mb-8">Connect with opportunities around you.</p>
          
          <div className="flex p-1 bg-neutral-100 rounded-xl mb-6">
            <button 
              onClick={() => setRole('worker')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === 'worker' ? 'bg-white shadow-sm text-black' : 'text-neutral-500'}`}
            >
              I need work
            </button>
            <button 
              onClick={() => setRole('employer')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === 'employer' ? 'bg-white shadow-sm text-black' : 'text-neutral-500'}`}
            >
              I'm hiring
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value;
            handleJoin(name);
          }}>
            <input 
              name="name"
              required
              placeholder="Your Name"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5 mb-4"
            />
            <button 
              type="submit"
              className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
            >
              Get Started
            </button>
          </form>
          
          {error && <p className="mt-4 text-red-500 text-xs text-center">{error}</p>}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-neutral-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-6 h-6" />
            <span className="font-semibold text-lg tracking-tight">WorkNearby</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full text-xs font-medium">
              <MapPin className="w-3 h-3" />
              {location ? 'Nearby' : 'Locating...'}
            </div>
            <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-neutral-600" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text"
              placeholder={role === 'worker' ? "Search for jobs..." : "Search for workers..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-black/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          {role === 'worker' && (
            <button 
              onClick={() => setIsPosting(true)}
              className="bg-black text-white px-6 py-3 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Post Availability
            </button>
          )}
        </div>

        {/* Filters/Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'General', 'Delivery', 'Cleaning', 'Technical', 'Manual Labor'].map(cat => (
            <button 
              key={cat}
              className="px-4 py-2 bg-white border border-black/5 rounded-full text-sm font-medium whitespace-nowrap hover:bg-neutral-50 transition-colors shadow-sm"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-3xl h-48 animate-pulse border border-black/5" />
              ))
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id}
                  className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-neutral-100 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
                      {role === 'worker' ? <Briefcase className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-50 px-2 py-1 rounded-md">
                      {role === 'worker' ? (item as Post).category : 'Worker'}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-black transition-colors">
                    {role === 'worker' ? (item as Post).title : (item as User).name}
                  </h3>
                  
                  {role === 'worker' ? (
                    <p className="text-neutral-500 text-sm line-clamp-2 mb-4">
                      {(item as Post).description}
                    </p>
                  ) : (
                    <p className="text-neutral-500 text-sm mb-4">
                      Available for hire in your area.
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-50">
                    <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                      <MapPin className="w-3 h-3" />
                      <span>{item.distance?.toFixed(1)} km away</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{role === 'worker' ? 'Just now' : 'Active'}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-lg font-medium">No results found</h3>
                <p className="text-neutral-500">Try adjusting your search or filters.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Post Modal */}
      <AnimatePresence>
        {isPosting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPosting(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Post Availability</h2>
                <button onClick={() => setIsPosting(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreatePost} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">What can you do?</label>
                  <input 
                    required
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="e.g. Professional House Cleaning"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Category</label>
                  <select 
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5 bg-white"
                  >
                    <option>General</option>
                    <option>Delivery</option>
                    <option>Cleaning</option>
                    <option>Technical</option>
                    <option>Manual Labor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Details</label>
                  <textarea 
                    required
                    value={postDesc}
                    onChange={(e) => setPostDesc(e.target.value)}
                    placeholder="Describe your experience, tools, and availability..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-black text-white py-4 rounded-2xl font-semibold hover:bg-neutral-800 transition-colors shadow-lg shadow-black/10"
                >
                  Post Now
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Nav (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 px-6 py-4 flex justify-between items-center z-30">
        <button className="flex flex-col items-center gap-1 text-black">
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">Explore</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-neutral-400">
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-medium">History</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-neutral-400">
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
