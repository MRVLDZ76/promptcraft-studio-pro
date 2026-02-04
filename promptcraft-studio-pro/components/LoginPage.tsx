import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Lock, Mail, User, Eye, EyeOff, Video, Sparkles, Wand2, Film } from 'lucide-react';

const DEMO_VIDEOS = [
  {
    type: 'video',
    src: 'https://businessesppall.nyc3.cdn.digitaloceanspaces.com/studio/whale.mp4',
    title: 'AI-Powered Video Creation',
    prompt: 'Professional content creator working on futuristic holographic interface in modern glass office with city skyline, typing and gesturing with excitement, energetic creative workflow, dynamic hand movements, Shot on 35mm lens, f/1.8, natural depth of field, Golden hour lighting with warm sun flare streaming through windows, rim light on edges, Unreal Engine 5 render, 8k resolution, octane render, ultra sharp focus, Camera movement: Smooth cinematic tracking shot following hands to face, Timing: Real-time with subtle slow-motion emphasis on key moments, aspect ratio 16:9. Exclude: watermark, text, logos, UI elements, blurry faces'
  },
  {
    type: 'video',
    src: 'https://businessesppall.nyc3.cdn.digitaloceanspaces.com/studio/girl-ads.mp4',
    title: 'Multi-Modal Content Studio',
    prompt: 'Overhead aerial view of creative workspace with multiple glowing screens displaying AI-generated content, hands typing on illuminated keyboard with holographic projections floating above desk, surrounded by sketches and storyboards coming to life, tech startup atmosphere, high-energy innovation mood, Shot on 24mm wide lens, f/2.0, shallow depth of field with bokeh lights, Blue hour ambient lighting with purple and cyan accents, neon rim lights, Unreal Engine 5 render, 8k resolution, octane render, crystal sharp, Camera movement: Slow descending crane shot revealing full workspace, Timing: Hyper-lapse showing creative process accelerated, aspect ratio 16:9. Exclude: watermark, text, logos, brand names, UI overlays, distorted screens'
  },
  {
    type: 'video',
    src: 'https://businessesppall.nyc3.cdn.digitaloceanspaces.com/studio/intro-1.mp4',
    title: 'From Idea to Production',
    prompt: 'Abstract visualization of AI neural network transforming simple text prompts into stunning visual content, flowing particles morphing from words into cinematic scenes, creative energy flowing through digital space, mesmerizing transformation sequence, futuristic tech aesthetic, Shot on macro 100mm lens, f/2.8, deep depth of field, Volumetric lighting with god rays, purple and gold particle effects, holographic shimmer, Unreal Engine 5 render, 8k resolution, octane render, pristine clarity, Camera movement: Dynamic 360-degree rotation around central transformation, Timing: Smooth time-lapse showing evolution, aspect ratio 16:9. Exclude: watermark, text, logos, subtitles, captions, low quality, compression artifacts, noise'
  },
 
];

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState('');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const { login, register, loading } = useAuth();

  // Rotate demo videos every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % DEMO_VIDEOS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
        // Login successful - the App component will automatically re-render and show main content
      } else {
        if (!username) {
          setError('Username is required');
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          return;
        }
        if (password !== passwordConfirm) {
          setError('Passwords do not match');
          return;
        }
        await register(email, username, password, fullName);
        // Registration successful - the App component will automatically re-render and show main content
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Demo Video (Full Height Split) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Full-screen video background */}
        <div className="absolute inset-0">
          {DEMO_VIDEOS.map((demo, index) => (
            <video
              key={index}
              src={demo.src}
              autoPlay
              muted
              loop
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                index === currentVideoIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/60"></div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12 text-white">
          {/* Top: Logo & Brand */}
          <div>
            <div className="flex items-center mb-3">
              <Sparkles className="w-10 h-10 text-white drop-shadow-lg" />
              <h1 className="text-3xl font-bold ml-3 drop-shadow-lg">
                PromptCraft Studio Pro
              </h1>
            </div>
            <p className="text-lg text-white/90 drop-shadow-lg">
              AI-Powered Video & Content Creation Platform
            </p>
          </div>

          {/* Bottom: Video Title & Controls */}
          <div>
            <h3 className="text-3xl font-bold text-white drop-shadow-lg mb-6">
              {DEMO_VIDEOS[currentVideoIndex].title}
            </h3>

            {/* Progress Dots */}
            <div className="flex space-x-3">
              {DEMO_VIDEOS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentVideoIndex(index)}
                  className={`h-1 rounded-full transition-all ${
                    index === currentVideoIndex
                      ? 'bg-white w-12'
                      : 'bg-white/40 hover:bg-white/60 w-8'
                  }`}
                  aria-label={`View demo ${index + 1}`}
                />
              ))}
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                <span className="text-sm font-medium">Multi-Provider AI</span>
              </div>
              <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                <span className="text-sm font-medium">Smart Storyboard</span>
              </div>
              <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                <span className="text-sm font-medium">Pro Tools Suite</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white dark:bg-gray-900 p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              <h1 className="text-3xl font-bold ml-2 text-gray-900 dark:text-white">
                PromptCraft Studio
              </h1>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            {/* Tab Switcher */}
            <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  isLogin
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  !isLogin
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => setError('Google Sign-In will be available soon!')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-gray-700 dark:text-gray-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={() => setError('Apple Sign-In will be available soon!')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-gray-700 dark:text-gray-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Choose a username"
                        required={!isLogin}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Your full name (optional)"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder={isLogin ? 'Enter your password' : 'Choose a strong password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Must be at least 8 characters
                  </p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Re-enter your password"
                      required={!isLogin}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </form>

            {isLogin && (
              <div className="mt-4 text-center">
                <a
                  href="#"
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                >
                  Forgot your password?
                </a>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setError('');
                    }}
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setError('');
                    }}
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              By continuing, you agree to our{' '}
              <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
