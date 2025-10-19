"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Phone, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ResendPhoneVerificationPage() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    
    const { resendPhoneVerification } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        setMessage("");

        try {
            await resendPhoneVerification(phoneNumber);
            setMessage("Verification SMS sent successfully! Please check your messages.");
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to resend verification SMS");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <div className="text-center mb-6">
                        <Phone className="mx-auto text-cyan-400 mb-4" size={48} />
                        <h1 className="text-2xl font-bold text-white mb-2">Resend Verification SMS</h1>
                        <p className="text-cyan-100 text-sm">
                            Enter your phone number to receive a new verification code
                        </p>
                    </div>

                    {isSuccess ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-4"
                        >
                            <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                            <h3 className="text-green-400 font-semibold text-xl">SMS Sent!</h3>
                            <p className="text-cyan-100">
                                {message}
                            </p>
                            <div className="flex gap-3">
                                <Link
                                    href="/sign-in"
                                    className="flex-1 py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition-colors text-center"
                                >
                                    Go to Login
                                </Link>
                                <button
                                    onClick={() => {
                                        setIsSuccess(false);
                                        setMessage("");
                                        setPhoneNumber("");
                                    }}
                                    className="flex-1 py-3 rounded-xl bg-gray-600 text-white font-bold hover:bg-gray-700 transition-colors"
                                >
                                    Send Another
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="phoneNumber" className="block text-cyan-100 text-sm font-medium mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    placeholder="Enter your phone number"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            {message && (
                                <div className="bg-green-500/20 border border-green-500 rounded-lg p-3">
                                    <p className="text-green-400 text-sm">{message}</p>
                                </div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-xl bg-cyan-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Sending..." : "Send Verification SMS"}
                            </motion.button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link 
                            href="/sign-in" 
                            className="inline-flex items-center text-cyan-300 hover:text-cyan-200 transition-colors text-sm"
                        >
                            <ArrowLeft className="mr-2" size={16} />
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
