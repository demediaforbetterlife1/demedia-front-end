"use client";

import React, { useState } from 'react';
import { Plus, Video, X } from 'lucide-react';
import CreateDeSnapModal from './CreateDeSnapModal';

interface FloatingDeSnapButtonProps {
    className?: string;
}

export default function FloatingDeSnapButton({ className = "" }: FloatingDeSnapButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDeSnapCreated = (deSnap: any) => {
        console.log('DeSnap created:', deSnap);
        // You can add any additional logic here, like showing a success message
        setIsModalOpen(false);
    };

    return (
        <>
            {/* Floating DeSnap Button */}
            <div className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-50 ${className}`}>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group relative bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                    title="Create DeSnap"
                >
                    <Video className="w-5 h-5" />
                    
                    {/* Tooltip */}
                    <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        Create DeSnap
                    </div>
                    
                    {/* Pulse animation */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-ping opacity-20"></div>
                </button>
            </div>

            {/* DeSnap Creation Modal */}
            <CreateDeSnapModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onDeSnapCreated={handleDeSnapCreated}
            />
        </>
    );
}
