import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import {
    Search,
    Navigation,
    Clock,
    User,
    ChevronRight,
    Map as MapIcon,
    Compass,
    Loader2,
    X,
    Calendar,
    MapPin,
    AlertCircle,
    Apple,
    Fuel,
    Utensils,
    ShoppingBasket,
    CircleParking,
    Pizza,
    Coffee,
    Bed,
    Bike,
    Croissant,
} from "lucide-react"
import { PartyEvent } from "@/lib/partyApi"
import { motion, AnimatePresence } from "framer-motion"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { searchAddress, AddressResult, DEBOUNCE_DELAY, MIN_QUERY_LENGTH } from "@/lib/photonApi"
import { PlaceCard } from "./PlaceCard"

interface AppSidebarProps {
    sidebarTab: string
    setSidebarTab: (tab: string) => void
    onLocationSelect?: (location: AddressResult) => void
    onDirectionsClick?: (location: AddressResult) => void
    onToggle?: () => void
    events: PartyEvent[]
    loading: boolean
    error: string | null
    bottomSheetState?: 'collapsed' | 'half' | 'full'
    setBottomSheetState?: (state: 'collapsed' | 'half' | 'full') => void
}

export function AppSidebar({
    sidebarTab,
    setSidebarTab,
    onLocationSelect,
    onDirectionsClick,
    events,
    loading,
    error,
    ...props
}: AppSidebarProps) {
    const { isMobile, open, setOpen, openMobile, setOpenMobile } = useSidebar()
    const [searchQuery, setSearchQuery] = useState("")
    const [results, setResults] = useState<AddressResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const [selectedPlace, setSelectedPlace] = useState<AddressResult | null>(null)
    const searchTimeout = useRef<NodeJS.Timeout | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const isContentOpen = isMobile ? openMobile : (open && (!!sidebarTab || !!selectedPlace));
    const totalWidth = isMobile
        ? (openMobile ? "100vw" : "0px")
        : (isContentOpen ? (selectedPlace ? "27rem" : "33rem") : "5rem");

    const tabs = [
        { id: "search", label: "Search", icon: Search },
        { id: "guides", label: "Guides", icon: Compass },
        { id: "directions", label: "Directions", icon: Navigation },
    ]

    const categories = [
        { id: "fuel", label: "Petrol Stations", icon: Fuel, color: "bg-[#7c3aed]" },
        { id: "restaurants", label: "Restaurants", icon: Utensils, color: "bg-[#f59e0b]" },
        { id: "supermarkets", label: "Supermarkets", icon: ShoppingBasket, color: "bg-[#fbbf24]" },
        { id: "parking", label: "Parking", icon: CircleParking, color: "bg-[#3b82f6]" },
        { id: "fastfood", label: "Fast Food", icon: Pizza, color: "bg-[#ea580c]" },
        { id: "cafes", label: "Cafés", icon: Coffee, color: "bg-[#f59e0b]" },
        { id: "hotels", label: "Hotels", icon: Bed, color: "bg-[#8b5cf6]" },
        { id: "bike", label: "Bicycle Sharing", icon: Bike, color: "bg-[#6366f1]" },
        { id: "bakeries", label: "Bakeries", icon: Croissant, color: "bg-[#d97706]" },
    ]

    const recents = [
        { id: "1", label: "LAGO Shopping-Center" },
        { id: "2", label: "Konstanz-Hafen" },
        { id: "3", label: "Münster Unserer Lieben Frau" },
    ]

    useEffect(() => {
        if (searchQuery.length < MIN_QUERY_LENGTH) {
            setResults([])
            setIsSearching(false)
            setActiveIndex(-1)
            return
        }

        setIsSearching(true)
        if (searchTimeout.current) clearTimeout(searchTimeout.current)

        searchTimeout.current = setTimeout(async () => {
            try {
                const data = await searchAddress(searchQuery)
                setResults(data)
                setActiveIndex(data.length > 0 ? 0 : -1)
            } catch (error) {
                console.error("Search failed:", error)
            } finally {
                setIsSearching(false)
            }
        }, DEBOUNCE_DELAY)

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current)
        }
    }, [searchQuery])

    const handleSelect = (location: AddressResult) => {
        if (onLocationSelect) {
            onLocationSelect(location)
        }
        setSelectedPlace(location)
        setSearchQuery("")
        setResults([])
        setActiveIndex(-1)
    }

    const handleBack = useCallback(() => {
        setSelectedPlace(null)
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (results.length === 0) return

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setActiveIndex((prev) => (prev + 1) % results.length)
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setActiveIndex((prev) => (prev - 1 + results.length) % results.length)
        } else if (e.key === "Enter") {
            e.preventDefault()
            if (activeIndex >= 0 && activeIndex < results.length) {
                handleSelect(results[activeIndex])
            }
        } else if (e.key === "Escape") {
            setResults([])
            setActiveIndex(-1)
        }
    }

    return (
        <Sidebar
            variant="sidebar"
            collapsible="none"
            {...props}
            className="border-none bg-transparent transition-all duration-500 ease-in-out"
            style={{ width: totalWidth } as React.CSSProperties}
        >
            <div className="flex h-full w-full overflow-hidden">
                {/* 1. Main Navigation Rail (Hidden on Mobile) */}
                {!isMobile && (
                    <div className="w-[5rem] flex flex-col items-center py-8 border-r border-white/5 bg-[#0a0a0b]/80 backdrop-blur-[80px] z-30 shrink-0 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
                        <div className="flex aspect-square size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20 mb-10 transition-transform hover:scale-110 active:scale-95 cursor-pointer">
                            <MapIcon className="text-white size-6" />
                        </div>

                        <div className="flex flex-col gap-6">
                            {tabs.map((tab) => {
                                const IsActive = sidebarTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            if (sidebarTab === tab.id) {
                                                setOpen(!open);
                                            } else {
                                                setSidebarTab(tab.id);
                                                setOpen(true);
                                            }
                                        }}
                                        className={`relative flex flex-col items-center gap-1 group transition-all ${IsActive ? "text-blue-400" : "text-white/40 hover:text-white/60"
                                            }`}
                                    >
                                        <div className={`p-3 rounded-2xl transition-all duration-300 ${IsActive ? "bg-blue-400/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "group-hover:bg-white/5"
                                            }`}>
                                            <tab.icon className="size-6" />
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${IsActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                                            }`}>
                                            {tab.label}
                                        </span>
                                        {IsActive && (
                                            <motion.div
                                                layoutId="active-tab"
                                                className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-auto flex flex-col gap-6 items-center">
                            <button className="p-3 rounded-2xl text-white/20 hover:text-white/40 hover:bg-white/5 transition-all">
                                <Clock className="size-6" />
                            </button>
                            <div className="size-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden hover:border-white/20 transition-all cursor-pointer">
                                <User className="size-5 text-white/40" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Secondary Content Sidebar */}
                <div
                    className={`flex-1 flex flex-col bg-[#0a0a0b]/60 backdrop-blur-[60px] border-r border-white/5 overflow-hidden transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-[20px_0_50px_rgba(0,0,0,0.5)] ${(isContentOpen || isMobile) ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12 pointer-events-none"
                        }`}
                    style={{ width: isMobile ? "100vw" : (isContentOpen ? (selectedPlace ? "22rem" : "28rem") : "0rem") }}
                >
                    {selectedPlace ? (
                        <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                            <PlaceCard
                                place={selectedPlace}
                                onBack={handleBack}
                                onDirectionsClick={() => onDirectionsClick?.(selectedPlace)}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            <SidebarHeader className={`px-6 pb-6 border-b border-white/[0.03] ${isMobile ? "pt-6" : "pt-10"}`}>
                                <div className={`flex items-center justify-between mb-8 ${isMobile ? "flex-row-reverse" : ""}`}>
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1 capitalize">
                                            {sidebarTab || "Explorer"}
                                        </h2>
                                        <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">
                                            Konstanz, Germany
                                        </p>
                                    </div>

                                    {isMobile && (
                                        <div className="flex gap-2 items-center">
                                            <div className="flex gap-1 mr-2 p-1 bg-white/5 rounded-xl border border-white/10">
                                                {tabs.map((tab) => {
                                                    const IsActive = sidebarTab === tab.id;
                                                    return (
                                                        <button
                                                            key={tab.id}
                                                            onClick={() => setSidebarTab(tab.id)}
                                                            className={`p-2 rounded-lg transition-all ${IsActive ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-white/30 hover:text-white/60"
                                                                }`}
                                                        >
                                                            <tab.icon className="size-4" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => setOpenMobile(false)}
                                                className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 active:scale-95 transition-all border border-white/10"
                                            >
                                                <X className="size-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/60 transition-colors pointer-events-none">
                                        {isSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                                    </div>
                                    <Input
                                        ref={inputRef}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Apple Maps"
                                        className="w-full pl-12 pr-10 h-14 bg-white/[0.08] border border-white/[0.1] rounded-2xl text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-white/20 transition-all text-[17px] font-medium shadow-2xl"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery("")
                                                setResults([])
                                                setActiveIndex(-1)
                                                inputRef.current?.focus()
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    )}
                                </div>
                            </SidebarHeader>

                            <SidebarContent className="px-3 gap-0 no-scrollbar pb-10">
                                {results.length > 0 && (
                                    <SidebarGroup className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <SidebarGroupLabel className="text-white/15 uppercase text-[10.5px] font-black tracking-[0.2em] px-5 mb-3 mt-4">Results</SidebarGroupLabel>
                                        <SidebarGroupContent>
                                            <SidebarMenu className="gap-1.5 px-3">
                                                {results.map((result, idx) => (
                                                    <SidebarMenuItem key={`res-${idx}`}>
                                                        <SidebarMenuButton
                                                            onClick={() => handleSelect(result)}
                                                            className={`h-16 px-4 rounded-2xl transition-all flex flex-col items-start justify-center gap-0 border border-transparent ${activeIndex === idx
                                                                ? "bg-blue-500/10 border-blue-500/20 text-white"
                                                                : "bg-white/[0.02] hover:bg-white/[0.05] text-white/70"
                                                                }`}
                                                        >
                                                            <span className={`text-[15px] font-bold tracking-tight transition-colors truncate w-full ${activeIndex === idx ? "text-blue-400" : "text-white group-hover:text-blue-400"
                                                                }`}>
                                                                {result.displayLine1}
                                                            </span>
                                                            <span className={`text-[12px] font-medium truncate w-full transition-colors ${activeIndex === idx ? "text-white/50" : "text-white/30"
                                                                }`}>
                                                                {result.displayLine2}
                                                            </span>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenu>
                                        </SidebarGroupContent>
                                    </SidebarGroup>
                                )}

                                {sidebarTab === "guides" && !results.length && (
                                    <SidebarGroup className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                                        <SidebarGroupLabel className="text-blue-400 font-black uppercase text-[11px] tracking-[0.3em] px-5 mb-6 mt-8 flex items-center justify-between">
                                            <span>Upcoming Events</span>
                                            <div className="size-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,1)]" />
                                        </SidebarGroupLabel>
                                        <SidebarGroupContent className="px-3">
                                            <div className="flex flex-col gap-4">
                                                {loading ? (
                                                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/10">
                                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                                        <span className="text-[11px] font-black uppercase tracking-[0.3em]">Synching Data...</span>
                                                    </div>
                                                ) : error ? (
                                                    <div className="flex items-center gap-3 p-5 rounded-3xl bg-red-500/5 border border-red-500/10 text-red-500/60 shadow-lg">
                                                        <AlertCircle size={18} />
                                                        <span className="text-sm font-bold tracking-tight">{error}</span>
                                                    </div>
                                                ) : (
                                                    events.map((event) => {
                                                        const day = event.start_date_details.day;
                                                        const monthIndex = parseInt(event.start_date_details.month) - 1;
                                                        const shortMonth = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][monthIndex] || 'JAN';
                                                        const hour = parseInt(event.start_date_details.hour);
                                                        const ampm = hour >= 12 ? 'PM' : 'AM';
                                                        const displayHour = hour % 12 || 12;
                                                        const formattedTime = `${displayHour}:${event.start_date_details.minutes} ${ampm}`;

                                                        return (
                                                            <div
                                                                key={event.id}
                                                                className="group relative flex flex-col gap-4 p-4 rounded-[28px] bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.07] hover:border-white/[0.1] hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden shadow-xl"
                                                            >
                                                                <div className="flex gap-4">
                                                                    {/* Date Badge */}
                                                                    <div className="flex flex-col items-center justify-center size-14 rounded-2xl bg-gradient-to-b from-white/[0.1] to-white/[0.02] border border-white/[0.08] shrink-0 shadow-lg">
                                                                        <span className="text-lg font-black text-white leading-none">{day}</span>
                                                                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">{shortMonth}</span>
                                                                    </div>

                                                                    {/* Info */}
                                                                    <div className="flex flex-col min-w-0 justify-center">
                                                                        <h4 className="text-[15px] font-black text-white line-clamp-1 group-hover:text-blue-400 transition-colors" dangerouslySetInnerHTML={{ __html: event.title }} />
                                                                        <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                                                                            <div className="flex items-center gap-1.5 text-white/30 shrink-0">
                                                                                <Clock className="size-3 text-blue-500/50" />
                                                                                <span className="text-[11px] font-bold tracking-tight">{formattedTime}</span>
                                                                            </div>
                                                                            <div className="size-1 rounded-full bg-white/10 shrink-0" />
                                                                            <div className="flex items-center gap-1.5 text-white/30 min-w-0">
                                                                                <MapPin className="size-3 text-blue-500/50" />
                                                                                <span className="text-[11px] font-bold truncate tracking-tight">{event.venue?.venue || "Konstanz"}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Thumbnail Preview */}
                                                                {event.image && (
                                                                    <div className="relative h-32 w-full rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                                                                        <img
                                                                            src={event.image.url}
                                                                            alt=""
                                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).src = '/assets/images/nightlife/bar.png';
                                                                            }}
                                                                        />
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                                            <div className="bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20">
                                                                                <ChevronRight className="size-3 text-white" />
                                                                            </div>
                                                                        </div>
                                                                        {event.featured && (
                                                                            <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-blue-500/90 backdrop-blur-md text-[9px] font-black text-white uppercase tracking-[0.2em] shadow-xl border border-white/20">
                                                                                Featured
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </SidebarGroupContent>
                                    </SidebarGroup>
                                )}

                                {sidebarTab === "search" && !results.length && (
                                    <div className="flex flex-col">
                                        <SidebarGroup>
                                            <div className="flex items-center justify-between px-5 mb-4 mt-6">
                                                <h3 className="text-[20px] font-black text-white tracking-tight">Recents</h3>
                                                <ChevronRight className="size-5 text-white/20" />
                                            </div>
                                            <SidebarGroupContent className="px-3">
                                                <SidebarMenu className="gap-2">
                                                    {recents.map((recent) => (
                                                        <SidebarMenuItem key={recent.id}>
                                                            <SidebarMenuButton className="h-14 bg-[#1c1c1e]/80 hover:bg-white/5 text-white/70 px-5 rounded-2xl group transition-all border border-white/[0.03]">
                                                                <div className="flex size-8 items-center justify-center rounded-xl bg-white/5 text-white/20 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all mr-3 shadow-lg">
                                                                    <Search size={16} />
                                                                </div>
                                                                <span className="text-[17px] font-bold tracking-tight group-hover:text-white transition-colors">{recent.label}</span>
                                                            </SidebarMenuButton>
                                                        </SidebarMenuItem>
                                                    ))}
                                                </SidebarMenu>
                                            </SidebarGroupContent>
                                        </SidebarGroup>

                                        <SidebarGroup>
                                            <h3 className="text-[20px] font-black text-white px-5 mb-4 mt-8 tracking-tight">Find Nearby</h3>
                                            <SidebarGroupContent className="px-4">
                                                <div className="grid grid-cols-1 gap-2">
                                                    {categories.map((cat) => (
                                                        <button
                                                            key={cat.id}
                                                            className="flex items-center gap-4 p-3.5 rounded-[18px] bg-[#1c1c1e]/80 hover:bg-white/5 transition-all text-left border border-white/[0.03]"
                                                        >
                                                            <div className={`size-10 rounded-full ${cat.color} flex items-center justify-center shadow-lg`}>
                                                                <cat.icon className="size-5 text-white fill-current" />
                                                            </div>
                                                            <span className="text-[16px] font-bold text-white tracking-tight">{cat.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </SidebarGroupContent>
                                        </SidebarGroup>
                                    </div>
                                )}
                            </SidebarContent>

                            <SidebarFooter className="p-6 border-t border-white/[0.03]">
                                <div className="p-6 rounded-[24px] bg-white/[0.03] border border-white/[0.05] shadow-inner group cursor-pointer hover:bg-white/[0.05] transition-all">
                                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.25em] mb-2">Business Console</p>
                                    <button className="text-[14px] text-white/60 group-hover:text-white font-bold transition-all text-left flex items-center gap-2">
                                        Manage locations
                                        <ChevronRight className="size-4 text-white/20 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </SidebarFooter>
                        </div>
                    )}
                </div>
            </div>
        </Sidebar>
    )
}
