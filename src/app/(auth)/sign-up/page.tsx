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
import { Eye, EyeOff, Mail, Lock, User, UserCheck, Phone } from "lucide-react";
import VerificationMethodModal from "@/components/VerificationMethodModal";

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
        phoneNumber: "",
        password: "",
    });
    const [selectedCountryCode, setSelectedCountryCode] = useState("+1");

    // Country codes data
    const countryCodes = [
        { code: "+1", country: "US/Canada", flag: "🇺🇸" },
        { code: "+20", country: "Egypt", flag: "🇪🇬" },
        { code: "+44", country: "UK", flag: "🇬🇧" },
        { code: "+33", country: "France", flag: "🇫🇷" },
        { code: "+49", country: "Germany", flag: "🇩🇪" },
        { code: "+39", country: "Italy", flag: "🇮🇹" },
        { code: "+34", country: "Spain", flag: "🇪🇸" },
        { code: "+7", country: "Russia", flag: "🇷🇺" },
        { code: "+86", country: "China", flag: "🇨🇳" },
        { code: "+81", country: "Japan", flag: "🇯🇵" },
        { code: "+82", country: "South Korea", flag: "🇰🇷" },
        { code: "+91", country: "India", flag: "🇮🇳" },
        { code: "+61", country: "Australia", flag: "🇦🇺" },
        { code: "+55", country: "Brazil", flag: "🇧🇷" },
        { code: "+52", country: "Mexico", flag: "🇲🇽" },
        { code: "+54", country: "Argentina", flag: "🇦🇷" },
        { code: "+27", country: "South Africa", flag: "🇿🇦" },
        { code: "+234", country: "Nigeria", flag: "🇳🇬" },
        { code: "+254", country: "Kenya", flag: "🇰🇪" },
        { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
        { code: "+971", country: "UAE", flag: "🇦🇪" },
        { code: "+90", country: "Turkey", flag: "🇹🇷" },
        { code: "+98", country: "Iran", flag: "🇮🇷" },
        { code: "+92", country: "Pakistan", flag: "🇵🇰" },
        { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
        { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
        { code: "+977", country: "Nepal", flag: "🇳🇵" },
        { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
        { code: "+93", country: "Afghanistan", flag: "🇦🇫" },
        { code: "+374", country: "Armenia", flag: "🇦🇲" },
        { code: "+994", country: "Azerbaijan", flag: "🇦🇿" },
        { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
        { code: "+375", country: "Belarus", flag: "🇧🇾" },
        { code: "+32", country: "Belgium", flag: "🇧🇪" },
        { code: "+359", country: "Bulgaria", flag: "🇧🇬" },
        { code: "+385", country: "Croatia", flag: "🇭🇷" },
        { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
        { code: "+45", country: "Denmark", flag: "🇩🇰" },
        { code: "+372", country: "Estonia", flag: "🇪🇪" },
        { code: "+358", country: "Finland", flag: "🇫🇮" },
        { code: "+30", country: "Greece", flag: "🇬🇷" },
        { code: "+36", country: "Hungary", flag: "🇭🇺" },
        { code: "+353", country: "Ireland", flag: "🇮🇪" },
        { code: "+972", country: "Israel", flag: "🇮🇱" },
        { code: "+370", country: "Lithuania", flag: "🇱🇹" },
        { code: "+352", country: "Luxembourg", flag: "🇱🇺" },
        { code: "+356", country: "Malta", flag: "🇲🇹" },
        { code: "+31", country: "Netherlands", flag: "🇳🇱" },
        { code: "+47", country: "Norway", flag: "🇳🇴" },
        { code: "+48", country: "Poland", flag: "🇵🇱" },
        { code: "+351", country: "Portugal", flag: "🇵🇹" },
        { code: "+40", country: "Romania", flag: "🇷🇴" },
        { code: "+421", country: "Slovakia", flag: "🇸🇰" },
        { code: "+386", country: "Slovenia", flag: "🇸🇮" },
        { code: "+46", country: "Sweden", flag: "🇸🇪" },
        { code: "+41", country: "Switzerland", flag: "🇨🇭" },
        { code: "+380", country: "Ukraine", flag: "🇺🇦" },
    ];

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [pendingUserData, setPendingUserData] = useState<{name: string; username: string; phoneNumber: string; password: string} | null>(null);
    const { t } = useI18n();
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    const { register, isAuthenticated, isLoading, user, sendVerificationCode } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (isAuthenticated && user) {
            router.replace(user.isSetupComplete ? "/(pages)/home" : "/SignInSetUp");
        }
    }, [isAuthenticated, isLoading, user, router]);

    // Form validation function
    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};

        if (!form.name.trim()) {
            newErrors.name = t('auth.nameRequired', 'Full name is required');
        }

        if (!form.username.trim()) {
            newErrors.username = t('auth.usernameRequired', 'Username is required');
        } else if (form.username.length < 3) {
            newErrors.username = t('auth.usernameMinLength', 'Username must be at least 3 characters');
        } else if (!/^[a-z0-9_]+$/.test(form.username)) {
            newErrors.username = t('auth.usernameInvalid', 'Username can only contain lowercase letters, numbers, and underscores');
        }

        if (!form.phoneNumber.trim()) {
            newErrors.phoneNumber = t('auth.phoneRequired', 'Phone number is required');
        } else if (!/^\+?[1-9]\d{1,14}$/.test(form.phoneNumber)) {
            newErrors.phoneNumber = t('auth.phoneInvalid', 'Please enter a valid phone number');
        }

        if (!form.password) {
            newErrors.password = t('auth.passwordRequired', 'Password is required');
        } else if (form.password.length < 6) {
            newErrors.password = t('auth.passwordMinLength', 'Password must be at least 6 characters');
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
            // Combine country code with phone number
            const fullPhoneNumber = selectedCountryCode + form.phoneNumber;
            const formData = { ...form, phoneNumber: fullPhoneNumber };
            
            const result = await register(formData);
            
            // Check if phone verification is required
            if (result && typeof result === 'object' && result.requiresPhoneVerification) {
                // Store user data and show verification method modal
                setPendingUserData(formData);
                setShowVerificationModal(true);
            } else {
                // Clear form on success and redirect to sign-in
                setForm({ name: "", username: "", phoneNumber: "", password: "" });
                router.push('/sign-in');
            }
        } catch (err: any) {
            console.error("❌ Registration error:", err);
            console.error("Error message:", err.message);
            console.error("Error type:", typeof err);
            console.error("Error string:", err.toString());
            console.error("Full error object:", err);
            
            // Clear any previous errors
            setErrors({});
            
            // Handle specific error cases with better matching
            const errorMessage = err.message || err.toString() || "";
            console.log("Error message for handling:", errorMessage);
            
            if (errorMessage.includes("Username already in use")) {
                setErrors({ username: t('auth.usernameTaken', 'This username is already taken') });
            } else if (errorMessage.includes("Phone number already registered")) {
                setErrors({ phoneNumber: t('auth.phoneRegistered', 'This phone number is already registered') });
            } else if (errorMessage.includes("Something went wrong")) {
                // This is the generic error - show a more helpful message
                setErrors({ general: t('auth.registrationFailed', 'Registration failed. Please try a different username or phone number.') });
            } else {
                // Show the actual error message
                setErrors({ general: errorMessage || t('auth.registrationFailedGeneric', 'Registration failed. Please try again.') });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleVerificationMethodSelect = async (method: 'whatsapp' | 'sms') => {
        if (!pendingUserData) return;
        
        try {
            // Send verification code via the selected method
            await sendVerificationCode(pendingUserData.phoneNumber, method);
            
            // Redirect to verification page with parameters
            const params = new URLSearchParams({
                phone: pendingUserData.phoneNumber,
                method: method
            });
            
            router.push(`/verify-code?${params.toString()}`);
        } catch (error) {
            console.error('Error sending verification code:', error);
            setErrors({ general: 'Failed to send verification code. Please try again.' });
        }
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
                        <h2 className="text-3xl font-bold text-center text-cyan-200 mb-6">{t('auth.welcomeTitle', 'Create Your Account And Join DeMedia')} 🚀</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full Name Input */}
                            <div>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={18} />
                                    <input 
                                        type="text" 
                                        name="name" 
                                        placeholder={t('auth.name', 'Full Name')} 
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
                                        placeholder={t('auth.username', 'Username (lowercase only)')} 
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
                            
                            {/* PHONE NUMBER INPUT */}
                            <div>
                                <div className="flex rounded-xl overflow-hidden bg-[#1b263b]/70 border border-gray-600 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20">
                                    {/* Country Code Dropdown */}
                                    <div className="relative">
                                        <select
                                            value={selectedCountryCode}
                                            onChange={(e) => setSelectedCountryCode(e.target.value)}
                                            className="px-4 py-3 bg-transparent text-white border-none focus:outline-none cursor-pointer appearance-none"
                                        >
                                            {countryCodes.map((country) => (
                                                <option key={country.code} value={country.code} className="bg-gray-800 text-white">
                                                    {country.flag} {country.code}
                                                </option>
                                            ))}
                                        </select>
                                        {/* Custom dropdown arrow */}
                                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    {/* Divider */}
                                    <div className="w-px bg-gray-600"></div>
                                    
                                    {/* Phone Number Input */}
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={18} />
                                        <input 
                                            type="tel" 
                                            name="phoneNumber" 
                                            placeholder={t('auth.phone', 'Phone Number')}
                                            value={form.phoneNumber} 
                                            onChange={handleChange} 
                                            className={`w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-white/60 border-none focus:outline-none ${errors.phoneNumber ? 'text-red-400' : ''}`} 
                                            required
                                        />
                                    </div>
                                </div>
                                {errors.phoneNumber && <p className="text-red-400 text-sm mt-1">{errors.phoneNumber}</p>}
                            </div>
                            
                            {/* Password Input */}
                            <div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={18} />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        name="password" 
                                        placeholder={t('auth.password', 'Password')} 
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
                                {isSubmitting ? t('auth.creatingAccount', 'Creating Account...') : t('auth.signUp', 'Sign Up')}
                            </motion.button>
                        </form>

                        <p className="text-center text-cyan-100 mt-6 text-sm sm:text-base">
                            {t('auth.alreadyHaveAccount', 'Already have an account?')} <a href="/sign-in" className="text-cyan-300 hover:underline">{t('auth.login', 'Login')}</a>
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

            {/* Verification Method Modal */}
            <VerificationMethodModal
                isOpen={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
                onSelectMethod={handleVerificationMethodSelect}
                phoneNumber={pendingUserData?.phoneNumber || ''}
            />
        </div>
    );
}