"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";

interface NotificationToastProps {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}

const toastVariants = {
    hidden: { opacity: 0, y: -50, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -50, scale: 0.9 }
};

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
};

const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500"
};

export default function NotificationToast({ 
    id, 
    type, 
    title, 
    message, 
    duration = 5000, 
    onClose 
}: NotificationToastProps) {
    const [isVisible, setIsVisible] = useState(true);
    const Icon = icons[type];

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(id), 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    variants={toastVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="fixed top-4 right-4 z-50 max-w-sm w-full"
                >
                    <div className={`${colors[type]} text-white rounded-lg shadow-lg p-4 relative`}>
                        <div className="flex items-start space-x-3">
                            <Icon size={20} className="flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm">{title}</h4>
                                <p className="text-sm opacity-90 mt-1">{message}</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
