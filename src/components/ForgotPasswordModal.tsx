"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'method' | 'contact' | 'verify' | 'reset' | 'success';
type Method = 'email' | 'phone' | null;

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<Method>(null);
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setMethod(null);
      setContact('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setResetToken('');
      setCountdown(0);
    }
  }, [isOpen]);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleBack = () => {
    setError('');
    if (step === 'contact') setStep('method');
    else if (step === 'verify') setStep('contact');
    else if (step === 'reset') setStep('verify');
  };

  const handleMethodSelect = (selectedMethod: Method) => {
    setMethod(selectedMethod);
    setStep('contact');
    setError('');
  };

  const handleContactSubmit = async () => {
    if (!contact.trim()) {
      setError(`Please enter your ${method === 'email' ? 'email address' : 'phone number'}`);
      return;
    }

    // Basic validation
    if (method === 'email' && !contact.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (method === 'phone' && !contact.startsWith('+')) {
      setError('Please enter phone number with country code (e.g., +1234567890)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/forgot-password/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, contact }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('verify');
        setCountdown(120); // 2 minutes countdown
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, contact, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetToken(data.resetToken);
        setStep('reset');
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/forgot-password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/forgot-password/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, contact }),
      });

      const data = await response.json();

      if (response.ok) {
        setCountdown(120);
        setOtp('');
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'method':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
              <p className="text-gray-300">Choose how you'd like to recover your account</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleMethodSelect('email')}
                className="w-full p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-300 flex items-center space-x-4"
              >
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Recover by Email</h3>
                  <p className="text-sm text-gray-400">We'll send a code to your email address</p>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('phone')}
                className="w-full p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-300 flex items-center space-x-4"
              >
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Phone className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Recover by Phone</h3>
                  <p className="text-sm text-gray-400">We'll send a code via WhatsApp</p>
                </div>
              </button>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <button onClick={handleBack} className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white">Enter Your {method === 'email' ? 'Email' : 'Phone Number'}</h2>
                <p className="text-gray-300">We'll send a verification code to reset your password</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {method === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={method === 'email' ? 'your@email.com' : '+1234567890'}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleContactSubmit}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 text-white font-semibold rounded-xl hover:brightness-110 transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <button onClick={handleBack} className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white">Enter Verification Code</h2>
                <p className="text-gray-300">
                  We sent a 6-digit code to {method === 'email' ? 'your email' : 'your WhatsApp'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  disabled={isLoading}
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleOTPVerify}
                disabled={isLoading || otp.length !== 6}
                className="w-full py-3 bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 text-white font-semibold rounded-xl hover:brightness-110 transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <div className="text-center">
                <button
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isLoading}
                  className="text-cyan-400 hover:text-cyan-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'reset':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <button onClick={handleBack} className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white">Create New Password</h2>
                <p className="text-gray-300">Choose a strong password for your account</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-400 space-y-1">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                  <li>One special character</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handlePasswordReset}
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full py-3 bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 text-white font-semibold rounded-xl hover:brightness-110 transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 bg-green-500/20 rounded-full">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
              <p className="text-gray-300">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
            </div>

            <Button
              onClick={handleClose}
              className="w-full py-3 bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 text-white font-semibold rounded-xl hover:brightness-110 transition-all duration-300"
            >
              Continue to Sign In
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md"
          >
            <div className="relative rounded-3xl p-[1px] overflow-hidden">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 animate-pulse" />
              
              <div className="relative rounded-3xl bg-black/90 backdrop-blur-xl p-8">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                {renderStepContent()}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}