import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [os, setOs] = useState<"Android" | "iOS" | "Desktop" | "">("");

    useEffect(() => {
        // Device Detection
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        if (/android/i.test(userAgent)) {
            setOs("Android");
        } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
            setOs("iOS");
        } else {
            setOs("Desktop");
        }

        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show prompt if not dismissed and on Android
            if (sessionStorage.getItem('pwa-prompt-dismissed') !== 'true') {
                setTimeout(() => setIsVisible(true), 3000);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // For iOS, we show the prompt manually since beforeinstallprompt isn't supported
        if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
            if (!window.matchMedia('(display-mode: standalone)').matches &&
                sessionStorage.getItem('pwa-prompt-dismissed') !== 'true') {
                setTimeout(() => setIsVisible(true), 4000);
            }
        }

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

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[300]"
                >
                    <div className="glass-panel p-5 flex flex-col gap-4 shadow-3xl border-white/20 overflow-hidden relative">
                        {/* Status Bar for Aesthetic */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-60" />

                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-xl shadow-purple-900/40 border border-white/10">
                                    <Smartphone className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white tracking-tight">Experience Light Map</h3>
                                    <p className="text-xs text-white/50 leading-relaxed">Install Konstanz's ultimate guide as an app for seamless navigation.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="text-white/20 hover:text-white transition-colors p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {os === "iOS" ? (
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
                                <p className="text-[13px] font-bold text-white/80 flex items-center gap-2">
                                    To install on your iPhone:
                                </p>
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                                            <Share className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <span className="text-xs text-white/60">1. Tap the <span className="text-white font-bold">Share</span> button below</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                                            <PlusSquare className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-xs text-white/60">2. Select <span className="text-white font-bold">Add to Home Screen</span></span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstallClick}
                                disabled={!deferredPrompt}
                                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[15px] font-black rounded-2xl transition-all shadow-xl shadow-purple-900/40 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <Download className="w-5 h-5 group-hover:animate-bounce" />
                                Install App
                            </button>
                        )}

                        <p className="text-[10px] text-center text-white/20 font-medium uppercase tracking-[0.2em]">
                            Supported on {os === "iOS" ? "iOS Safari" : "all modern mobile browsers"}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
