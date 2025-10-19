"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle, XCircle, Phone, RefreshCw, ArrowLeft } from "lucide-react";

export default function VerifyCodePage() {
    const [verificationCode, setVerificationCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [error, setError] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isResending, setIsResending] = useState(false);
    const [verificationMethod, setVerificationMethod] = useState<'whatsapp' | 'sms'>('sms');
    
    const { verifyPhone, resendPhoneVerification, sendVerificationCode } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const phone = searchParams.get('phone');
    const method = searchParams.get('method');

    useEffect(() => {
        if (phone) {
            setPhoneNumber(phone);
        }
        if (method && (method === 'whatsapp' || method === 'sms')) {
            setVerificationMethod(method);
        }
        if (token) {
            handleVerification(token);
        }
    }, [token, phone, method]);

    const handleVerification = async (verificationToken: string) => {
        setIsVerifying(true);
        setError("");
        
        try {
            await verifyPhone(verificationToken);
            setVerificationStatus('success');
        } catch (err: any) {
            setVerificationStatus('error');
            setError(err.message || "Verification failed");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleCodeVerification = async () => {
        if (!verificationCode.trim()) {
            setError("Please enter the verification code");
            return;
        }

        setIsVerifying(true);
        setError("");
        
        try {
            // Here you would typically send the code to your backend for verification
            // For now, we'll simulate the verification
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate verification - replace with actual API call
            const res = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    code: verificationCode, 
                    phoneNumber: phoneNumber,
                    method: verificationMethod 
                }),
            });

            if (res.ok) {
                setVerificationStatus('success');
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Invalid verification code');
            }
        } catch (err: any) {
            setVerificationStatus('error');
            setError(err.message || "Invalid verification code");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendVerification = async () => {
        if (!phoneNumber) {
            setError("Please enter your phone number");
            return;
        }
        
        setIsResending(true);
        setError("");
        
        try {
            await sendVerificationCode(phoneNumber, verificationMethod);
            setError(""); // Clear any previous errors
            alert(`Verification code sent via ${verificationMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'}!`);
        } catch (err: any) {
            setError(err.message || "Failed to resend verification code");
        } finally {
            setIsResending(false);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
        setVerificationCode(value);
        setError(""); // Clear error when user starts typing
    };

    return (
        <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden bg-black">
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 120, damping: 12 }}
                >
                    <Image src="/assets/images/logo.png" alt="Demedia Logo" width={120} height={120} className="mb-6" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="relative w-full max-w-md mx-4 sm:mx-6 md:mx-0 rounded-2xl p-[4px] bg-transparent"
                >
                    <motion.div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 blur-md animate-spin-slow" style={{ zIndex: 0 }} />
                    <div className="relative bg-gradient-to-br from-[#0d1b2a]/80 via-[#1b263b]/70 to-[#0d1b2a]/80 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl z-10">
                        <h2 className="text-3xl font-bold text-center text-cyan-200 mb-6">
                            Enter Verification Code 🔐
                        </h2>

                        {verificationStatus === 'pending' && !token && (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <Phone className="mx-auto text-cyan-400 mb-4" size={48} />
                                    <p className="text-cyan-100 mb-2">
                                        We sent a {verificationMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'} code to:
                                    </p>
                                    <p className="text-cyan-300 font-mono text-sm">
                                        {phoneNumber}
                                    </p>
                                </div>
                                
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={verificationCode}
                                        onChange={handleCodeChange}
                                        maxLength={6}
                                        className="w-full px-4 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-center text-2xl font-mono tracking-widest"
                                        autoComplete="one-time-code"
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleCodeVerification}
                                    disabled={isVerifying || verificationCode.length !== 6}
                                    className="w-full py-3 rounded-xl bg-cyan-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isVerifying ? (
                                        <>
                                            <RefreshCw className="animate-spin" size={18} />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify Code'
                                    )}
                                </button>

                                <div className="text-center">
                                    <button
                                        onClick={handleResendVerification}
                                        disabled={isResending}
                                        className="text-cyan-300 hover:text-cyan-200 text-sm underline disabled:opacity-50"
                                    >
                                        {isResending ? 'Sending...' : 'Resend Code'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {verificationStatus === 'pending' && token && (
                            <div className="text-center">
                                <RefreshCw className="mx-auto text-cyan-400 mb-4 animate-spin" size={48} />
                                <p className="text-cyan-100">Verifying your phone number...</p>
                            </div>
                        )}

                        {verificationStatus === 'success' && (
                            <div className="text-center space-y-4">
                                <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                                <h3 className="text-green-400 font-semibold text-xl">Phone Number Verified Successfully!</h3>
                                <p className="text-cyan-100">
                                    Your phone number has been verified. Redirecting to setup...
                                </p>
                                <div className="w-full h-2 bg-cyan-500/20 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-cyan-500 rounded-full"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 2 }}
                                        onAnimationComplete={() => router.push('/SignInSetUp')}
                                    />
                                </div>
                            </div>
                        )}

                        {verificationStatus === 'error' && (
                            <div className="text-center space-y-4">
                                <XCircle className="mx-auto text-red-400 mb-4" size={48} />
                                <h3 className="text-red-400 font-semibold text-xl">Verification Failed</h3>
                                <p className="text-cyan-100 mb-4">
                                    {error || "The verification code is invalid or has expired."}
                                </p>
                                
                                <div className="space-y-3">
                                    <button
                                        onClick={() => {
                                            setVerificationStatus('pending');
                                            setError('');
                                            setVerificationCode('');
                                        }}
                                        className="w-full py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                    
                                    <button
                                        onClick={handleResendVerification}
                                        disabled={isResending}
                                        className="w-full py-3 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold hover:bg-cyan-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isResending ? (
                                            <>
                                                <RefreshCw className="animate-spin" size={18} />
                                                Sending...
                                            </>
                                        ) : (
                                            'Resend Code'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => router.push('/sign-up')}
                                className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 text-sm transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Back to Sign Up
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            <style jsx>{`
                @keyframes spin-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            `}</style>
        </div>
    );
}
