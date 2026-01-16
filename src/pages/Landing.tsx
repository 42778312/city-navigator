import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserButton, useUser, SignInButton, useClerk } from "@clerk/clerk-react";
import { ChevronDown, ChevronUp, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Index from "./Index";
import Snowfall from "@/components/Snowfall";

const translations = {
    de: {
        heroTitle: "Was geht in Konstanz ab?",
        heroSubtitle: "Dein smarter Nightlife Guide",
        heroDescription: "Check live auf der Map, wo heute was geht. Bars, Clubs & Partys mit Stimmung, Öffnungszeiten und Preisen. Taxi-Preis schnell berechnen, Route sehen und sicher nach Hause kommen.",
        startNow: "Jetzt starten",
        login: "Login / Registrieren",
        footer: "made with ❤️ in Konstanz"
    },
    en: {
        heroTitle: "What's happening in Konstanz?",
        heroSubtitle: "Your smart nightlife guide",
        heroDescription: "Check the map live to see what's going on today. Bars, clubs & parties with vibes, opening hours and prices. Calculate taxi prices quickly, see the route and get home safely.",
        startNow: "Start now",
        login: "Login / Sign Up",
        footer: "made with ❤️ in Konstanz"
    }
};

const Landing = () => {
    const { isSignedIn } = useUser();
    const { openSignIn } = useClerk();
    const navigate = useNavigate();
    const [lang, setLang] = useState<'de' | 'en'>('de');

    const t = translations[lang];

    const heroRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    const handleStartNow = () => {
        if (isSignedIn) {
            navigate('/map');
        } else {
            openSignIn({ forceRedirectUrl: '/map' });
        }
    };

    const toggleLanguage = () => {
        setLang(prev => prev === 'de' ? 'en' : 'de');
    };

    const scrollToMap = () => {
        mapRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen md:h-screen bg-[#0B0D12] text-white overflow-x-hidden md:overflow-hidden font-sans selection:bg-purple-500/30 flex flex-col">
            {/* Winter Effect */}
            <Snowfall />

            {/* Background decoration */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Grid pattern overlay */}
            <div
                className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Header */}
            <header className="relative md:absolute md:top-6 md:left-0 md:right-0 z-50 mt-6 md:mt-0 mx-auto max-w-5xl px-6 py-3 flex items-center justify-between rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                            <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg tracking-tight">Light Map</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Language Toggle */}
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider"
                    >
                        <Globe className="w-3.5 h-3.5 text-purple-400" />
                        <span>{lang}</span>
                    </button>

                    {isSignedIn ? (
                        <div className="pl-2 border-l border-white/10">
                            <UserButton afterSignOutUrl="/" />
                        </div>
                    ) : (
                        <SignInButton mode="modal" forceRedirectUrl="/map">
                            <button className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-purple-900/20">
                                {t.login}
                            </button>
                        </SignInButton>
                    )}
                </div>
            </header>

            {/* Main Content Layout container */}
            <div className="relative w-full flex-1 flex flex-col md:flex-row">

                {/* Hero Content Section */}
                <main
                    ref={heroRef}
                    className="relative z-10 px-6 md:px-16 pt-32 md:pt-0 pb-4 md:pb-0 max-w-5xl md:flex-1 flex flex-col justify-center"
                >
                    <div className="space-y-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={lang}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white">
                                    {t.heroTitle} <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{t.heroSubtitle}</span> <br />
                                </h1>

                                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mt-8 leading-relaxed">
                                    {t.heroDescription}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        <div className="pt-4">
                            <button
                                onClick={handleStartNow}
                                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all shadow-xl shadow-purple-900/30 hover:scale-105 active:scale-95"
                            >
                                {t.startNow}
                            </button>
                        </div>
                    </div>
                </main>

                {/* Demo Map Section - sequential on mobile, fixed on desktop */}
                <div
                    ref={mapRef}
                    className="relative md:fixed top-0 right-0 w-full md:w-[60%] h-[800px] md:h-screen z-0 pointer-events-auto map-mask mt-4 md:mt-0 border-t border-b md:border-none border-white/5 overflow-hidden"
                >
                    {/* Floating Navigation Arrows - Mobile/iPad only, tucked in left corner */}
                    <div className="lg:hidden absolute top-4 left-4 z-50">
                        <motion.button
                            onClick={scrollToMap}
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="bg-white/10 backdrop-blur-md border border-white/20 p-2.5 rounded-full shadow-lg"
                        >
                            <ChevronDown className="w-6 h-6 text-white" />
                        </motion.button>
                    </div>

                    <Index className="w-full h-full" isDemo={true} lang={lang} />

                    <div className="lg:hidden absolute bottom-4 left-4 z-50">
                        <motion.button
                            onClick={scrollToTop}
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="bg-white/10 backdrop-blur-md border border-white/20 p-2.5 rounded-full shadow-lg"
                        >
                            <ChevronUp className="w-6 h-6 text-white" />
                        </motion.button>
                    </div>
                </div>

            </div>

            {/* In-flow Footer */}
            <footer className="relative md:absolute md:bottom-12 md:left-16 z-50 py-12 md:py-0 text-center md:text-left text-gray-500 font-medium text-sm">
                {t.footer}
            </footer>
        </div>
    );
};

export default Landing;
