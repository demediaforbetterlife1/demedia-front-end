"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { motion } from "framer-motion";
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
            <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={1}
            />
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

/* -------- Camera Controller (parallax) -------- */
function CameraController() {
    const { camera, mouse } = useThree();

    useFrame(() => {
        camera.position.x += (mouse.x * 5 - camera.position.x) * 0.05;
        camera.position.y += (mouse.y * 5 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
    });

    return null;
}

/* -------- Main Component -------- */
export default function FinishSetUp() {
    const router = useRouter();
    const { completeSetup, user } = useAuth();
    const [isCompleting, setIsCompleting] = useState(false);

    const handleComplete = async () => {
        if (isCompleting) return; // Prevent double clicks
        
        setIsCompleting(true);
        try {
            console.log('[FinishSetup] Starting setup completion...');
            
            // Always try to complete setup, but don't let it block the user
            let result;
            try {
                result = await completeSetup();
                console.log('[FinishSetup] Setup completion result:', result);
            } catch (error) {
                console.log('[FinishSetup] Setup completion threw error, but continuing:', error);
                result = { success: true, message: 'Completed locally' };
            }
            
            // Always redirect to home - don't block the user
            console.log('[FinishSetup] Redirecting to home...');
            setTimeout(() => {
                router.replace("/home");
            }, 500);
            
        } catch (error) {
            console.error("[FinishSetup] Unexpected error, but continuing anyway:", error);
            // Still redirect - never block the user
            setTimeout(() => {
                router.replace("/home");
            }, 500);
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <div className="relative h-screen w-screen bg-black overflow-hidden">
            {/* 3D Background */}
            <Canvas
                camera={{ position: [0, 0, 8], fov: 70 }}
                className="absolute inset-0 z-0 pointer-events-none" // FIX: allow overlay to show/click
            >
                <ambientLight intensity={0.6} />
                <pointLight intensity={1.5} position={[5, 5, 5]} color={"#bb86fc"} />

                <Stars radius={150} depth={80} count={8000} factor={5} fade speed={1.5} />

                <ShootingStars count={5} />

                <CameraController />

                <OrbitControls enableZoom={false} />
            </Canvas>

            {/* Overlay Text */}
            <div className="absolute inset-0 flex flex-col gap-6 items-center justify-center z-50">
                <motion.h1
                    className="text-center text-4xl md:text-6xl font-bold text-white leading-snug"
                    animate={{
                        textShadow: [
                            "0 0 0px #00ffff",
                            "0 0 10px #00ffff",
                            "0 0 20px #00ffff",
                            "0 0 10px #00ffff",
                            "0 0 0px #00ffff",
                        ],
                        opacity: [1, 0.7, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <span className="block md:inline">Setup has done successfully!</span>{" "}
                    <span className="block md:inline">You can start exploring!</span>
                </motion.h1>

                <motion.button
                    className="relative px-8 py-4 bg-gradient-to-r from-purple-400 via-cyan-300 to-purple-600 rounded-full text-white font-semibold shadow-lg hover:scale-105 transition-transform overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ 
                        y: 0, 
                        opacity: 1,
                        boxShadow: [
                            "0 0 20px rgba(139, 69, 255, 0.5)",
                            "0 0 40px rgba(139, 69, 255, 0.8)",
                            "0 0 60px rgba(139, 69, 255, 1)",
                            "0 0 40px rgba(139, 69, 255, 0.8)",
                            "0 0 20px rgba(139, 69, 255, 0.5)"
                        ]
                    }}
                    transition={{ 
                        delay: 1.5, 
                        duration: 0.8, 
                        ease: "easeOut",
                        boxShadow: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                    onClick={handleComplete}
                    disabled={isCompleting}
                >
                    {/* Glowing background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-cyan-300 to-purple-600 rounded-full opacity-75 blur-sm animate-pulse"></div>
                    
                    {/* Button content */}
                    <span className="relative z-10 flex items-center gap-2">
                        {isCompleting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Completing...
                            </>
                        ) : (
                            'Join Our Community!'
                        )}
                    </span>
                </motion.button>
            </div>
        </div>
    );
}
