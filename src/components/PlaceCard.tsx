import * as React from "react"
import {
    ChevronLeft,
    Share,
    Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AddressResult } from "@/lib/photonApi"

interface PlaceCardProps {
    place: AddressResult
    onBack: () => void
    onDirectionsClick?: () => void
}

export function PlaceCard({ place, onBack, onDirectionsClick }: PlaceCardProps) {
    return (
        <ScrollArea className="h-full bg-transparent">
            <div className="flex flex-col pb-12">
                {/* Header Actions */}
                <div className="flex items-center justify-between px-6 pt-6 mb-8 sticky top-0 bg-[#0a0a0b]/40 backdrop-blur-3xl z-10 py-4 border-b border-white/[0.03]">
                    <button
                        onClick={onBack}
                        className="size-11 rounded-2xl bg-white/[0.08] flex items-center justify-center hover:bg-white/[0.12] transition-all active:scale-95 group border border-white/10"
                    >
                        <ChevronLeft className="size-6 text-white group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="flex gap-3">
                        <button className="size-11 rounded-2xl bg-white/[0.08] flex items-center justify-center hover:bg-white/[0.12] transition-all active:scale-95 border border-white/10">
                            <Share className="size-5 text-white/70" />
                        </button>
                    </div>
                </div>

                {/* Title Section */}
                <div className="px-8 mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] border border-blue-500/20">
                            {place.district || "Location"}
                        </span>
                        <div className="h-4 w-[1px] bg-white/10" />
                        <span className="text-[12px] font-bold text-green-400/80 flex items-center gap-1.5">
                            <div className="size-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                            Open Now
                        </span>
                    </div>

                    <h1 className="text-[38px] font-black text-white tracking-tight leading-[1.1] mb-4 drop-shadow-2xl">
                        {place.name || place.displayLine1}
                    </h1>

                    <p className="text-[17px] text-white/40 font-bold leading-relaxed mb-6">
                        {place.displayLine2}
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="px-6 mb-10">
                    <Button
                        onClick={onDirectionsClick}
                        className="w-full h-16 bg-blue-500 hover:bg-blue-600 rounded-[22px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-blue-600/30 border-none"
                    >
                        <Navigation className="size-6 fill-current" />
                        <span className="text-[16px] font-bold">Directions</span>
                    </Button>
                </div>

                {/* Placeholder for remaining space */}
                <div className="flex-1" />
            </div>
        </ScrollArea>
    )
}
