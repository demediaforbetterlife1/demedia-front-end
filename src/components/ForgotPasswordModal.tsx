'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MessageSquare, Mail, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'phone' | 'method' | 'verify' | 'reset' | 'success';

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'sms' | 'whatsapp' | null>(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Reset all state
  const resetState = () => {
    setStep('phone');
    setPhoneNumber('');
    setSelectedMethod(null);
    setOtp(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
    setError('');
    setExpiresIn(0);
    setResendCooldown(0);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Step 1: Check phone number
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/forgot-password/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify phone number');
      }

      if (data.phoneExists) {
        setStep('method');
      } else {
        // Show generic message
        setError('If this phone number is registered, you will receive a verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Send OTP
  const handleMethodSelect = async (method: 'sms' | 'whatsapp') => {
    setSelectedMethod(method);
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, method }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setExpiresIn(data.expiresIn || 600);
      setStep('verify');

      // Start countdown
      const interval = setInterval(() => {
        setExpiresIn((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setResetToken(data.resetToken);
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOTP = [...otp];
    newOTP[index] = value.slice(-1);
    setOtp(newOTP);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle OTP paste
  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOTP = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOTP);
  };

  // Step 4: Reset password
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/forgot-password/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/forgot-password/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, method: selectedMethod }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setExpiresIn(data.expiresIn || 600);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);

      // Countdown for resend
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>

          <div className="p-8">
            {/* Step 1: Enter Phone */}
            {step === 'phone' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-purple-600/20 rounded-full">
                    <Phone className="w-8 h-8 text-purple-400" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white text-center mb-2">
                  Forgot Password?
                </h2>
                <p className="text-gray-400 text-center mb-6">
                  Enter your phone number to receive a verification code
                </p>

                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Phone Number"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 2: Choose Method */}
            {step === 'method' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-blue-600/20 rounded-full">
                    <MessageSquare className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white text-center mb-2">
                  Choose Delivery Method
                </h2>
                <p className="text-gray-400 text-center mb-6">
                  How would you like to receive your verification code?
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => handleMethodSelect('sms')}
                    disabled={loading}
                    className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-purple-500 transition-all disabled:opacity-50 flex items-center gap-4"
                  >
                    <div className="p-3 bg-purple-600/20 rounded-lg">
                      <Mail className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-white font-semibold">SMS</h3>
                      <p className="text-gray-400 text-sm">Receive code via text message</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleMethodSelect('whatsapp')}
                    disabled={loading}
                    className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-green-500 transition-all disabled:opacity-50 flex items-center gap-4"
                  >
                    <div className="p-3 bg-green-600/20 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-white font-semibold">WhatsApp</h3>
                      <p className="text-gray-400 text-sm">Receive code via WhatsApp</p>
                    </div>
                  </button>
                </div>

                {error && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {loading && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending code...</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Verify OTP */}
            {step === 'verify' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-green-600/20 rounded-full">
                    <Lock className="w-8 h-8 text-green-400" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white text-center mb-2">
                  Enter Verification Code
                </h2>
                <p className="text-gray-400 text-center mb-6">
                  We sent a 6-digit code to your {selectedMethod === 'sms' ? 'phone' : 'WhatsApp'}
                </p>

                <form onSubmit={handleOTPSubmit} className="space-y-4">
                  <div className="flex gap-2 justify-center" onPaste={handleOTPPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOTPChange(index, e.target.value)}
                        className="w-12 h-14 text-center text-2xl font-bold bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ))}
                  </div>

                  {expiresIn > 0 && (
                    <p className="text-center text-gray-400 text-sm">
                      Code expires in {formatTime(expiresIn)}
                    </p>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.join('').length !== 6}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Code'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="w-full text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Didn't receive code? Resend"}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 4: Reset Password */}
            {step === 'reset' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-yellow-600/20 rounded-full">
                    <Lock className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white text-center mb-2">
                  Create New Password
                </h2>
                <p className="text-gray-400 text-center mb-6">
                  Choose a strong password for your account
                </p>

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                      minLength={8}
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Password must:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Be at least 8 characters long</li>
                      <li>Contain uppercase and lowercase letters</li>
                      <li>Contain at least one number</li>
                    </ul>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 5: Success */}
            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-green-600/20 rounded-full">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                  Password Reset Successful!
                </h2>
                <p className="text-gray-400 mb-6">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>

                <button
                  onClick={handleClose}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Back to Login
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
