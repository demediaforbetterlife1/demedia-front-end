"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle, XCircle, Mail, RefreshCw } from "lucide-react";

export default function VerifyPhonePage() {
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [error, setError] = useState("");
    const [phone, setPhone] = useState("");
    const [isResending, setIsResending] = useState(false);
    
    const { verifyPhone, resendVerification } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            handleVerification(token);
        }
    }, [token]);

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

    const handleResendVerification = async () => {
        if (!phone) {
            setError("Please enter your phone number");
            return;
        }
        
        setIsResending(true);
        setError("");
        
        try {
            await resendVerification(phone);
            setError(""); // Clear any previous errors
            alert("Verification code sent successfully!");
        } catch (err: any) {
            setError(err.message || "Failed to resend verification code");
        } finally {
            setIsResending(false);
        }
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
                            Email Verification 📧
                        </h2>

                        {verificationStatus === 'pending' && !token && (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <Mail className="mx-auto text-cyan-400 mb-4" size={48} />
                                    <p className="text-cyan-100 mb-4">
                                        Enter your phone number to resend the verification code
                                    </p>
                                </div>
                                
                                <div>
                                    <input
                                        type="tel"
                                        placeholder="Enter your phone number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleResendVerification}
                                    disabled={isResending}
                                    className="w-full py-3 rounded-xl bg-cyan-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isResending ? (
                                        <>
                                            <RefreshCw className="animate-spin" size={18} />
                                            Sending...
                                        </>
                                    ) : (
                                        'Resend Verification Email'
                                    )}
                                </button>
                            </div>
                        )}

                        {verificationStatus === 'pending' && token && (
                            <div className="text-center">
                                <RefreshCw className="mx-auto text-cyan-400 mb-4 animate-spin" size={48} />
                                <p className="text-cyan-100">Verifying your email...</p>
                            </div>
                        )}

                        {verificationStatus === 'success' && (
                            <div className="text-center space-y-4">
                                <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                                <h3 className="text-green-400 font-semibold text-xl">Email Verified Successfully!</h3>
                                <p className="text-cyan-100">
                                    Your email has been verified. You can now log in to your account.
                                </p>
                                <button
                                    onClick={() => router.push('/sign-in')}
                                    className="w-full py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition-colors"
                                >
                                    Go to Login
                                </button>
                            </div>
                        )}

                        {verificationStatus === 'error' && (
                            <div className="text-center space-y-4">
                                <XCircle className="mx-auto text-red-400 mb-4" size={48} />
                                <h3 className="text-red-400 font-semibold text-xl">Verification Failed</h3>
                                <p className="text-cyan-100 mb-4">
                                    {error || "The verification link is invalid or has expired."}
                                </p>
                                
                                <div className="space-y-3">
                                    <div>
                                        <input
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                        />
                                    </div>
                                    
                                    <button
                                        onClick={handleResendVerification}
                                        disabled={isResending}
                                        className="w-full py-3 rounded-xl bg-cyan-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isResending ? (
                                            <>
                                                <RefreshCw className="animate-spin" size={18} />
                                                Sending...
                                            </>
                                        ) : (
                                            'Resend Verification Email'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        <p className="text-center text-cyan-100 mt-6 text-sm">
                            <a href="/sign-in" className="text-cyan-300 hover:underline">Back to Login</a>
                        </p>
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
