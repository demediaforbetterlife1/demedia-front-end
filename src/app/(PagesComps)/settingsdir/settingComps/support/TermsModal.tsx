"use client";
import { X } from "lucide-react";

type TermsModalProps = {
    closeModal: () => void;
};

export default function TermsModal({ closeModal }: TermsModalProps) {
    return (
        <div className="fixed inset-0 bg-white dark:bg-neutral-900 flex items-center justify-center z-50">
            <div className="w-[90%] max-w-3xl h-[85%] bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-6 relative overflow-hidden">
                {/* Close */}
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Title */}
                <h2 className="text-2xl font-semibold mb-4">Terms & Conditions</h2>

                {/* Scrollable Terms */}
                <div className="overflow-y-auto h-[calc(100%-80px)] pr-2 space-y-4 text-gray-700 dark:text-gray-300">
                    <p>
                        Welcome to our application. By using this service, you agree to the following Terms and Conditions.
                    </p>

                    <h3 className="text-lg font-semibold">1. Acceptance of Terms</h3>
                    <p>
                        By accessing or using our services, you confirm that you accept these Terms and agree to comply with them.
                    </p>

                    <h3 className="text-lg font-semibold">2. User Responsibilities</h3>
                    <p>
                        You must use the service only for lawful purposes and in accordance with applicable laws and regulations.
                    </p>

                    <h3 className="text-lg font-semibold">3. Privacy</h3>
                    <p>
                        Your privacy is important to us. Please review our Privacy Policy to understand how we handle your data.
                    </p>

                    <h3 className="text-lg font-semibold">4. Changes to Terms</h3>
                    <p>
                        We reserve the right to update or modify these Terms at any time. You are encouraged to review them periodically.
                    </p>

                    <h3 className="text-lg font-semibold">5. Limitation of Liability</h3>
                    <p>
                        We shall not be held responsible for any damages resulting from the use of our services.
                    </p>

                    <h3 className="text-lg font-semibold">6. Contact</h3>
                    <p>
                        If you have any questions regarding these Terms, please contact our support team.
                    </p>
                </div>

                {/* Button */}
                <div className="mt-4">
                    <button
                        onClick={closeModal}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
}
