import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI to show the install button after a short delay
            setTimeout(() => setIsVisible(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the PWA install prompt');
        } else {
            console.log('User dismissed the PWA install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Persist dismiss in session storage so it doesn't show again this session
        sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    // Check if it was dismissed in the current session
    useEffect(() => {
        if (sessionStorage.getItem('pwa-prompt-dismissed') === 'true') {
            setIsVisible(false);
        }
    }, []);

    return (
        <AnimatePresence>
            {isVisible && deferredPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[200]"
                >
                    <div className="glass-panel p-4 flex flex-col gap-3 shadow-2xl border-white/20">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/40">
                                    <Download className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Light Map App</h3>
                                    <p className="text-xs text-gray-400">Install for a faster, better experience in Konstanz.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="text-gray-500 hover:text-white transition-colors p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={handleInstallClick}
                            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Install as App
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
