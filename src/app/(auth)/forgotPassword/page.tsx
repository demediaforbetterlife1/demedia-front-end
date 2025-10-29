"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Phone, RefreshCw } from "lucide-react";

export default function ForgotPasswordPage() {
    const [phone, setPhone] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSendCode = async () => {
        if (!phone.trim()) {
            setError("Please enter your phone number");
            return;
        }

        setIsSending(true);
        setError("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to send reset code");
            }

            router.push(`/verify-reset?phone=${phone}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-[#0d1b2a]/80 via-[#1b263b]/70 to-[#0d1b2a]/80 backdrop-blur-2xl p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4"
            >
                <div className="text-center mb-6">
                    <Image src="/assets/images/logo.png" width={100} height={100} alt="logo" className="mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-cyan-200">Forgot Password 🔐</h2>
                    <p className="text-cyan-100 text-sm mt-2">Enter your phone number to reset your password</p>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 text-cyan-400" />
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter phone number"
                            className="w-full pl-10 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <button
                        onClick={handleSendCode}
                        disabled={isSending}
                        className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold flex items-center justify-center gap-2"
                    >
                        {isSending ? <><RefreshCw className="animate-spin" size={18}/> Sending...</> : "Send Reset Code"}
                    </button>

                    <p className="text-center text-sm text-cyan-200 mt-4">
                        <a href="/sign-in" className="text-cyan-400 hover:underline">Back to Login</a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}