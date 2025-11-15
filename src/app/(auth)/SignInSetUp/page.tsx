"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;

    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(";");

    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(nameEQ)) {
            return cookie.substring(nameEQ.length);
        }
    }

    return null;
};

/* ---------------- Shooting Stars ---------------- */
function ShootingStar() {
    const meshRef = useRef<THREE.Mesh | null>(null);

    useEffect(() => {
        if (!meshRef.current) return;
        const loop = () => {
            gsap.fromTo(
                meshRef.current!.position,
                { x: -12 + Math.random() * 4, y: 6 + Math.random() * 4, z: -10 },
                {
                    x: 10 + Math.random() * 4,
                    y: -4 + Math.random() * 2,
                    z: -6,
                    duration: 2 + Math.random() * 1.5,
                    ease: "power2.inOut",
                    onComplete: loop,
                }
            );
        };
        loop();
    }, []);

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
    );
}

function ShootingStars({ count = 5 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <ShootingStar key={i} />
            ))}
        </>
    );
}

/* ---------------- Galaxy ---------------- */
function Galaxy() {
    const pointsRef = useRef<THREE.Points | null>(null);

    useFrame((_, delta) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y += delta * 0.01;
            pointsRef.current.rotation.x += delta * 0.002;
        }
    });

    const geometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        const vertices: number[] = [];
        for (let i = 0; i < 2000; i++) {
            const x = (Math.random() - 0.5) * 40;
            const y = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;
            vertices.push(x, y, z);
        }
        g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        return g;
    }, []);

    return (
        <points ref={pointsRef} geometry={geometry}>
            <pointsMaterial size={0.05} color="#a5f3fc" />
        </points>
    );
}

/* ---------------- Camera parallax controller ---------------- */
function CameraController() {
    const { camera, mouse } = useThree();

    useFrame(() => {
        camera.position.x += (mouse.x * 5 - camera.position.x) * 0.05;
        camera.position.y += (mouse.y * 5 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
    });

    return null;
}

/* ---------------- Space Background ---------------- */
function SpaceBackground() {
    return (
        <div className="absolute inset-0 -z-10 bg-black">
            <Canvas camera={{ position: [0, 0, 8], fov: 70 }}>
                <ambientLight intensity={0.6} />
                <pointLight position={[5, 5, 5]} intensity={1.5} color={"#bb86fc"} />
                <Stars radius={150} depth={80} count={8000} factor={5} fade speed={1.5} />
                <Galaxy />
                <ShootingStars count={7} />
                <CameraController />
                <OrbitControls enableZoom={false} />
            </Canvas>
        </div>
    );
}

/* ------------------ UI Component ------------------ */
export default function SignInSetUp() {
    const [day, setDay] = useState<string>("");
    const [month, setMonth] = useState<string>("");
    const [year, setYear] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const cardWrapRef = useRef<HTMLDivElement | null>(null);
    
    const { user, updateUser, isLoading: authLoading, isAuthenticated } = useAuth();
    const { setLanguage: setAppLanguage, supportedLocales } = useI18n();
    const { t } = useI18n();

    const days = useMemo(() => Array.from({ length: 31 }, (_, i) => `${i + 1}`), []);
    const months = useMemo(
        () => [
            { val: "1", label: "January" },
            { val: "2", label: "February" },
            { val: "3", label: "March" },
            { val: "4", label: "April" },
            { val: "5", label: "May" },
            { val: "6", label: "June" },
            { val: "7", label: "July" },
            { val: "8", label: "August" },
            { val: "9", label: "September" },
            { val: "10", label: "October" },
            { val: "11", label: "November" },
            { val: "12", label: "December" },
        ],
        []
    );
    const years = useMemo(() => {
        const arr: string[] = [];
        for (let y = 2016; y >= 1950; y--) arr.push(`${y}`);
        return arr;
    }, []);

    const router = useRouter();

    // Show loading while auth is initializing
    if (authLoading) {
        return (
            <div className="relative min-h-screen w-screen overflow-hidden flex items-center justify-center">
                <SpaceBackground />
                <div className="relative z-10 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-cyan-400 text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    // If auth finished loading and no user/token, redirect to sign-up
    // But be very patient if token exists - user might still be loading after registration
    useEffect(() => {
        // Don't do anything while auth is loading
        if (authLoading) {
            return;
        }
        
        const token = getCookie("token") || (typeof window !== 'undefined' ? localStorage.getItem("token") : null);
        
        // If user is authenticated, we're good - don't redirect
        if (isAuthenticated && user) {
            return;
        }
        
        // If no token at all, redirect to sign-up (but wait a bit to avoid race conditions)
        if (!token) {
            const timeout = setTimeout(() => {
                // Double-check - if user became authenticated, don't redirect
                if (isAuthenticated && user) {
                    return;
                }
                
                const tokenCheck = getCookie("token") || (typeof window !== 'undefined' ? localStorage.getItem("token") : null);
                if (!tokenCheck && !authLoading) {
                    console.log('SignInSetUp: No token found after delay, redirecting to sign-up');
                    router.replace('/sign-up');
                }
            }, 2000); // Wait 2 seconds before redirecting
            
            return () => clearTimeout(timeout);
        }
        
        // If token exists but user not loaded yet, wait longer for auth state to update
        // This is common right after registration - be very patient
        if (!isAuthenticated && !user) {
            console.log('SignInSetUp: Token found but user not loaded, waiting for auth state...');
            
            // Use a polling approach to check if user becomes authenticated
            let checkCount = 0;
            const maxChecks = 10; // Check 10 times over 5 seconds
            const checkInterval = 500; // Check every 500ms
            
            const interval = setInterval(() => {
                checkCount++;
                
                // If user became authenticated, stop checking
                if (isAuthenticated && user) {
                    console.log('SignInSetUp: User authenticated, stopping redirect check');
                    clearInterval(interval);
                    return;
                }
                
                // If we've checked enough times and still no user, redirect
                if (checkCount >= maxChecks) {
                    const tokenCheck = getCookie("token") || (typeof window !== 'undefined' ? localStorage.getItem("token") : null);
                    if (!user && !authLoading) {
                        if (tokenCheck) {
                            console.log('SignInSetUp: Token exists but user still not loaded after extended wait - this might be an auth issue');
                            // Don't redirect if token exists - might be a temporary auth state issue
                            // Let the user stay on the page
                        } else {
                            console.log('SignInSetUp: Token disappeared, redirecting to sign-up');
                            router.replace('/sign-up');
                        }
                    }
                    clearInterval(interval);
                }
            }, checkInterval);
            
            return () => clearInterval(interval);
        }
    }, [authLoading, isAuthenticated, user, router]);

    
    const handleSave = async () => {
        if (!day || !month || !year) {
            gsap.timeline()
                .to(cardWrapRef.current, { x: -8, duration: 0.08 })
                .to(cardWrapRef.current, { x: 8, duration: 0.08 })
                .to(cardWrapRef.current, { x: 0, duration: 0.1 });
            setError("Please select your date of birth");
            return;
        }
    
        const dobIso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        setIsLoading(true);
        setError("");
    
        try {
            // Call the complete-setup endpoint
            // Cookies (httpOnly) are sent automatically via credentials: 'include'
            // The Next.js API route will extract the token from cookies and forward it to the backend
            const res = await fetch("/api/auth/complete-setup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include', // This automatically sends httpOnly cookies
                body: JSON.stringify({ 
                    dob: dobIso 
                }),
            });
    
            const data = await res.json();
    
            if (!res.ok) {
                throw new Error(data.error || "Failed to save profile information");
            }
    
            // Update user context with the real data from backend
            if (data.user) {
                updateUser(data.user);
            }
            
            console.log("Date of birth saved successfully:", data);
            router.push("/interests");
    
        } catch (err: any) {
            console.error("Setup error:", err);
            setError(err.message || "Error saving profile information");
            
            // If it's an authentication error, suggest re-login
            if (err.message.includes("token") || err.message.includes("authentication")) {
                setError(`${err.message} Please try signing in again.`);
            }
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="relative min-h-screen w-screen overflow-hidden flex items-center justify-center">
            <SpaceBackground />

            <motion.div ref={cardWrapRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full max-w-xl px-6">
                <div className="relative rounded-3xl p-[3px] overflow-hidden">
                    <div className="absolute inset-0 rounded-3xl bg-[conic-gradient(at_top_left,_#ec4899,_#8b5cf6,_#06b6d4,_#3b82f6,_#ec4899)] animate-spin-slow blur-md opacity-80" />

                    <Card className="relative rounded-3xl bg-transparent backdrop-blur-xl border border-white/20 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-center text-4xl font-extrabold bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                                {t('setup.completeProfile','Complete Your Profile')}
                            </CardTitle>
                            <p className="text-center text-sm text-white/70 mt-2">Just two quick steps to personalize your experience 🚀</p>
                        </CardHeader>

                        <CardContent className="pt-4">
                            <div className="grid grid-cols-1 gap-6">
                                {/* DOB */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-white/90">Date of Birth</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <Select onValueChange={setDay} value={day}>
                                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                                <SelectValue placeholder="Day" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 text-white">
                                                {days.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                                            </SelectContent>
                                        </Select>

                                        <Select onValueChange={setMonth} value={month}>
                                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                                <SelectValue placeholder="Month" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 text-white">
                                                {months.map((m) => (<SelectItem key={m.val} value={m.val}>{m.label}</SelectItem>))}
                                            </SelectContent>
                                        </Select>

                                        <Select onValueChange={setYear} value={year}>
                                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                                <SelectValue placeholder="Year" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-72 overflow-auto bg-slate-900 text-white">
                                                {years.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>


                                {error && (
                                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* CTA */}
                                <div>
                                    <Button 
                                        onClick={handleSave} 
                                        disabled={isLoading}
                                        className="w-full py-3 text-lg rounded-2xl bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 text-white font-semibold shadow-lg hover:brightness-110 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? t('setup.saving','Saving...') : t('setup.saveContinue','Save & Continue')}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>

            <style jsx>{`
        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
