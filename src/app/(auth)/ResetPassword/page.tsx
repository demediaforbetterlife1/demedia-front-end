"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Lock, RefreshCw, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const phone = searchParams.get("phone");
    const token = searchParams.get("token");
    const router = useRouter();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleReset = async () => {
        if (newPassword.length < 6) return setError("Password must be at least 6 characters");
        if (newPassword !== confirmPassword) return setError("Passwords do not match");

        setIsResetting(true);
        setError("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, token, newPassword }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to reset password");
            }

            setSuccess(true);
            setTimeout(() => router.push("/sign-in"), 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-[#0d1b2a]/80 via-[#1b263b]/70 to-[#0d1b2a]/80 backdrop-blur-2xl p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4 text-center"
            >
                <Image src="/assets/images/logo.png" width={100} height={100} alt="logo" className="mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-cyan-200 mb-4">Set New Password</h2>

                {success ? (
                    <div className="text-green-400">
                        <CheckCircle className="mx-auto mb-4" size={48} />
                        <p>Password updated successfully!</p>
                    </div>
                ) : (
                    <>
                        <div className="relative mb-3">
                            <Lock className="absolute left-3 top-3 text-cyan-400" />
                            <input
                                type="password"
                                placeholder="New password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-10 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                            />
                        </div>
                        <div className="relative mb-3">
                            <Lock className="absolute left-3 top-3 text-cyan-400" />
                            <input
                                type="password"
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <button
                            onClick={handleReset}
                            disabled={isResetting}
                            className="w-full mt-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold flex items-center justify-center gap-2"
                        >
                            {isResetting ? <><RefreshCw className="animate-spin" size={18}/> Resetting...</> : "Reset Password"}
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}