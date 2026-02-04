/**
 * Modern Split-Screen Auth Page
 * Inspired by Nim AI - Clean, professional design with social auth
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ModernAuthPageProps {
  onClose?: () => void;
}

export const ModernAuthPage: React.FC<ModernAuthPageProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, loading } = useAuth();

  const handleGoogleAuth = () => {
    // TODO: Implement Google OAuth
    window.location.href = '/api/auth/google/';
  };

  const handleAppleAuth = () => {
    // TODO: Implement Apple Sign-In
    window.location.href = '/api/auth/apple/';
  };

  return (
    <div className="fixed inset-0 flex">
      {/* Left Side - Auth */}
      <div className="w-full md:w-1/2 bg-[#0a0a0f] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                PromptStudio
              </span>
            </h1>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-white mb-3">
              Welcome ✨
            </h2>
            <p className="text-gray-400 text-lg">
              Create images and videos
            </p>
            <p className="text-gray-400 text-lg">
              with the world's best AI models
            </p>
          </div>

          {/* Social Auth Buttons */}
          <div className="space-y-4 mb-6">
            <button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={handleAppleAuth}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0a0a0f] text-gray-500">or continue with email</span>
            </div>
          </div>

          {/* Email Form (Collapsed by default, can be expanded) */}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-300 underline"
          >
            {isLogin ? 'Sign in with email' : 'Create account with email'}
          </button>

          {/* Footer Links */}
          <div className="mt-12 flex items-center justify-center gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-400 transition-colors">
              Terms
            </a>
            <span>•</span>
            <a href="#" className="hover:text-gray-400 transition-colors">
              Privacy
            </a>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Visual */}
      <div className="hidden md:block w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-300">
        {/* Video/Image Container */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
            {/* Placeholder for video or generated image */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              poster="/assets/hero-poster.jpg"
            >
              <source src="/assets/hero-demo.mp4" type="video/mp4" />
            </video>
            
            {/* Fallback image if video not available */}
            <img
              src="/assets/hero-image.jpg"
              alt="AI Generated Content"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />

            {/* Attribution Badge */}
            <div className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md text-white text-xs px-3 py-2 rounded-lg">
              Generated with AI
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Close Button (if used as modal) */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
