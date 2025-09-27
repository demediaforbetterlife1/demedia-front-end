"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useI18n } from "@/contexts/I18nContext";
import { Eye, EyeOff, Phone, Lock, User, UserCheck } from "lucide-react";

/* ---------------- BACKGROUND 3D ---------------- */
function RotatingPlanet({
                            position,
                            size,
                            color,
                        }: {
    position: [number, number, number];
    size: number;
    color: string;
}) {
    const meshRef = useRef<THREE.Mesh | null>(null);
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.0015;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[size, 32, 32]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.4}
                roughness={0.6}
                metalness={0.3}
            />
        </mesh>
    );
}

function ShootingStar() {
    const meshRef = useRef<THREE.Mesh | null>(null);

    useEffect(() => {
        if (!meshRef.current) return;

        const loop = () => {
            gsap.fromTo(
                meshRef.current!.position,
                { x: -12, y: 6, z: -10 },
                {
                    x: 10,
                    y: -4,
                    z: -6,
                    duration: 2,
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
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1} />
        </mesh>
    );
}

function Galaxy() {
    const pointsRef = useRef<THREE.Points | null>(null);

    useFrame((_, delta) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y += delta * 0.05;
            pointsRef.current.rotation.x += delta * 0.01;
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
            <pointsMaterial size={0.05} color="#90caf9" />
        </points>
    );
}

function SpaceBackground() {
    return (
        <div className="absolute inset-0 -z-10 bg-black">
            <Canvas camera={{ position: [0, 0, 8], fov: 70 }}>
                <ambientLight intensity={0.6} />
                <pointLight position={[5, 5, 5]} intensity={1.5} color={"#bb86fc"} />
                <Stars radius={150} depth={80} count={8000} factor={5} fade speed={2} />
                <Galaxy />
                <RotatingPlanet position={[2, -1, -7]} size={1.4} color={"#3f51b5"} />
                <RotatingPlanet position={[-4, 2, -10]} size={0.9} color={"#ff9800"} />
                <RotatingPlanet position={[5, 3, -12]} size={1.2} color={"#00bcd4"} />
                <ShootingStar />
                <OrbitControls enableZoom={false} />
            </Canvas>
        </div>
    );
}
/* ----------------------------------------------- */

export default function SignUpPage() {
    const [form, setForm] = useState({
        name: "",
        username: "",
        phone: "",
        password: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { t } = useI18n();
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    const { register, isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (isAuthenticated && user) {
            router.replace(user.isSetupComplete ? "/home" : "/SignInSetUp");
        }
    }, [isAuthenticated, isLoading, user, router]);

    // Form validation function
    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};

        if (!form.name.trim()) {
            newErrors.name = "Full name is required";
        }

        if (!form.username.trim()) {
            newErrors.username = "Username is required";
        } else if (form.username.length < 3) {
            newErrors.username = "Username must be at least 3 characters";
        } else if (!/^[a-z0-9_]+$/.test(form.username)) {
            newErrors.username = "Username can only contain lowercase letters, numbers, and underscores";
        }

        if (!form.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(form.phone.replace(/\s/g, ''))) {
            newErrors.phone = "Please enter a valid phone number";
        }

        if (!form.password) {
            newErrors.password = "Password is required";
        } else if (form.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous errors
        setErrors({});
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await register(form);
            // Clear form on success
            setForm({ name: "", username: "", phone: "", password: "" });
        } catch (err: any) {
            console.error("❌ Registration error:", err);
            
            // Handle specific error cases
            if (err.message === "Username already in use") {
                setErrors({ username: "This username is already taken" });
            } else if (err.message && err.message.includes("phone")) {
                setErrors({ phone: "This phone number is already registered" });
            } else {
                setErrors({ general: err.message || "Registration failed. Please try again." });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    return (
        <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden">
            <SpaceBackground />

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
                        <h2 className="text-3xl font-bold text-center text-cyan-200 mb-6">Create Your Account And Join DeMedia 🚀</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full Name Input */}
                            <div>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={18} />
                                    <input 
                                        type="text" 
                                        name="name" 
                                        placeholder="Full Name" 
                                        value={form.name} 
                                        onChange={handleChange} 
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${errors.name ? 'border border-red-500' : ''}`} 
                                    />
                                </div>
                                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                            </div>
                            
                            {/* Username Input */}
                            <div>
                                <div className="relative">
                                    <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={18} />
                                    <input 
                                        type="text" 
                                        name="username" 
                                        placeholder="Username (lowercase only)" 
                                        value={form.username} 
                                        onChange={(e) => {
                                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                                            setForm({ ...form, username: value });
                                        }}
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${errors.username ? 'border border-red-500' : ''}`} 
                                    />
                                </div>
                                {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
                            </div>
                            
                            {/* PHONE NUMBER INPUT - NOT EMAIL */}
                            <div>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={18} />
                                    <input 
                                        type="tel" 
                                        name="phone" 
                                        placeholder="📱 Mobile Phone Number"
                                        value={form.phone} 
                                        onChange={handleChange} 
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${errors.phone ? 'border border-red-500' : ''}`} 
                                        required
                                    />
                                </div>
                                {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
                            </div>
                            
                            {/* Password Input */}
                            <div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={18} />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        name="password" 
                                        placeholder="Password" 
                                        value={form.password} 
                                        onChange={handleChange} 
                                        className={`w-full pl-12 pr-12 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${errors.password ? 'border border-red-500' : ''}`} 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                            </div>

                            {errors.general && (
                                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                                    <p className="text-red-400 text-sm">{errors.general}</p>
                                </div>
                            )}

                            <motion.button 
                                whileHover={{ scale: 1.05 }} 
                                whileTap={{ scale: 0.95 }} 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-xl bg-cyan-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                            </motion.button>
                        </form>

                        <p className="text-center text-cyan-100 mt-6 text-sm sm:text-base">
                            Already have an account? <a href="/sign-in" className="text-cyan-300 hover:underline">Login</a>
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