"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle, XCircle, RefreshCw, Shield } from "lucide-react";

export default function VerifyResetPage() {
    const searchParams = useSearchParams();
    const phone = searchParams.get("phone") || "";
    const [code, setCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleVerifyCode = async () => {
        if (!code.trim()) {
            setError("Please enter the code");
            return;
        }

        setIsVerifying(true);
        setError("");

        try {
            const res = await fetch("/api/auth/verify-reset-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, code }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setStatus("success");
            setTimeout(() => {
                router.push(`/reset-password?phone=${phone}&token=${data.token}`);
            }, 1500);
        } catch (err: any) {
            setStatus("error");
            setError(err.message);
        } finally {
            setIsVerifying(false);
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
                <h2 className="text-2xl font-bold text-cyan-200 mb-4">Verify Code</h2>

                {status === "pending" && (
                    <>
                        <input
                            type="text"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                            className="w-full py-3 rounded-xl bg-[#1b263b]/70 text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-cyan-400 outline-none"
                            placeholder="Enter 6-digit code"
                        />
                        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

                        <button
                            onClick={handleVerifyCode}
                            disabled={isVerifying}
                            className="w-full mt-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold flex items-center justify-center gap-2"
                        >
                            {isVerifying ? <><RefreshCw className="animate-spin" size={18}/> Verifying...</> : "Verify Code"}
                        </button>
                    </>
                )}

                {status === "success" && (
                    <div className="mt-6 text-green-400">
                        <CheckCircle className="mx-auto mb-4" size={48} />
                        <p>Code verified successfully! Redirecting...</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="mt-6 text-red-400">
                        <XCircle className="mx-auto mb-4" size={48} />
                        <p>{error}</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}