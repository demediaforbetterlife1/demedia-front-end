"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/* -------- Shooting Stars -------- */
function ShootingStar() {
    const meshRef = useRef<THREE.Mesh>(null!);

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

function ShootingStars({ count = 5 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <ShootingStar key={i} />
            ))}
        </>
    );
}

/* -------- Galaxy -------- */
function Galaxy() {
    const pointsRef = useRef<THREE.Points>(null);

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

/* -------- Camera Controller -------- */
function CameraController() {
    const { camera, mouse } = useThree();

    useFrame(() => {
        camera.position.x += (mouse.x * 5 - camera.position.x) * 0.05;
        camera.position.y += (mouse.y * 5 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
    });

    return null;
}

/* -------- Space Background -------- */
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

/* -------- Interests Page -------- */
const allInterests = [
    "Technology", "Gaming", "Sports", "Music", "Art", "Movies", "Coding",
    "Space", "AI", "Travel", "Food", "Photography", "Fashion", "Fitness",
    "Books", "Nature", "History", "Science", "Business", "Anime",
    "Cars", "Politics", "Education", "Health", "Finance", "Startups",
    "Memes", "Design", "Marketing", "Crypto"
];

export default function InterestsPage() {
    const [selected, setSelected] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { user, updateUser } = useAuth();

    const toggleInterest = (interest: string) => {
        setSelected((prev) =>
            prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
        );
    };

    const handleContinue = async () => {
        if (selected.length === 0) {
            setError("Please select at least one interest!");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Get userId from AuthContext
            const userId = user?.id;
            if (!userId) {
                console.error("No userId found - user not authenticated");
                setError("Session expired. Please sign in again.");
                setIsLoading(false);
                return;
            }

            console.log("Saving interests to database for user:", userId, "interests:", selected);

            // Get token to ensure we're authenticated
            const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
            if (!token) {
                console.error("No authentication token found");
                setError("Session expired. Please sign in again.");
                setIsLoading(false);
                return;
            }

            // Make direct fetch call with explicit headers
            const res = await fetch(`/api/users/${userId}/interests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ interests: selected }),
                credentials: "include",
            });

            console.log("Interests API response status:", res.status);

            if (!res.ok) {
                let errorData;
                try {
                    errorData = await res.json();
                } catch {
                    try {
                        const errorText = await res.text();
                        errorData = { error: errorText || 'Unknown error' };
                    } catch {
                        errorData = { error: 'Failed to parse error response' };
                    }
                }
                
                console.error("Interests API error:", errorData);
                
                const errorMsg = errorData.error || errorData.message || "Failed to save interests to database";
                setError(`${errorMsg}. Please try again.`);
                setIsLoading(false);
                return;
            }

            const respData = await res.json();
            console.log("✅ Interests saved to database successfully:", respData);
            
            // Update user context with saved data
            updateUser({ interests: selected });

            console.log("Redirecting to FinishSetup");
            router.push("/FinishSetup");
            
        } catch (err: any) {
            console.error("Error saving interests:", err);
            console.error("Error stack:", err.stack);
            
            // On ANY error, show message and DO NOT proceed
            let errorMessage = "Failed to save interests. Please check your connection and try again.";
            
            if (err.message) {
                if (err.message.includes('Failed to fetch')) {
                    errorMessage = "Network error. Please check your internet connection and try again.";
                } else if (err.message.includes('timeout')) {
                    errorMessage = "Request timeout. Please try again.";
                } else {
                    errorMessage = err.message;
                }
            }
            
            setError(errorMessage);
            setIsLoading(false);
        }
    };


    return (
        <div className="relative min-h-screen w-screen overflow-hidden flex flex-col items-center justify-center px-6">
            <SpaceBackground />

            <motion.h1
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="relative z-10 text-4xl md:text-5xl font-extrabold text-center text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text"
            >
                Choose Your Interests 🚀
            </motion.h1>


            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-10 max-w-4xl"
            >
                {allInterests.map((interest) => {
                    const isSelected = selected.includes(interest);
                    return (
                        <motion.div
                            key={interest}
                            onClick={() => toggleInterest(interest)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`cursor-pointer px-4 py-3 rounded-2xl text-center font-semibold transition 
                                ${isSelected
                                ? "bg-gradient-to-r from-purple-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/30"
                                : "bg-white/10 text-white/80 border border-white/20 hover:bg-white/20"
                            }`}
                        >
                            {interest}
                        </motion.div>
                    );
                })}
            </motion.div>
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 mt-6"
                >
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                        <p className="text-red-400 text-sm text-center">{error}</p>
                    </div>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="relative z-10 mt-10"
            >
                <Button
                    onClick={() => handleContinue()}
                    disabled={isLoading}
                    className="px-8 py-3 text-lg rounded-2xl bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 text-white font-semibold shadow-lg hover:brightness-110 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Saving..." : "Continue"}
                </Button>
            </motion.div>
        </div>
    );
}
