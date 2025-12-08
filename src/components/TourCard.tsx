import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Star, Globe2, PlayCircle } from "lucide-react";
import FunFact from "./FunFact";

type Tour = {
  title: string;
  img: string;
  videoUrl?: string;
  facts: string[];
  didYouKnow: string;
  location: string;
  rating: number;
  tags: string[];
};

interface TourCardProps {
  tour: Tour;
  onView: () => void;
  highlight?: boolean;
  animationOrder?: number;
}

export default function TourCard({
  tour,
  onView,
  highlight = false,
  animationOrder = 0,
}: TourCardProps) {
  const supportsVR = !!tour.videoUrl && tour.videoUrl.includes("youtube.com/embed");
  return (
    <Card
      className={`
        group hover:shadow-2xl transition-all cursor-pointer relative overflow-visible
        ${highlight ? "ring-4 ring-emerald-300 scale-105 animate-fade-in" : ""}
        animate-fade-in
      `}
      style={{ animationDelay: `${animationOrder * 80}ms` }}
    >
      {/* Animated badge for featured cards */}
      {highlight && (
        <span className="absolute -top-4 left-4 z-10 px-3 py-1 bg-gradient-to-br from-yellow-200 to-yellow-100 text-yellow-900 font-bold rounded-lg text-xs shadow animate-bounce">
          Editor&apos;s Pick
        </span>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between gap-2">
          <span className="flex-1 leading-tight truncate">{tour.title}</span>
          <span className="flex items-center gap-1 text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded shadow font-bold">
            <Star className="w-4 h-4" fill="currentColor" />
            <span className="text-sm">{tour.rating}</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <AspectRatio ratio={16/9} className="overflow-hidden rounded-xl ring-1 ring-emerald-100">
            <img
              src={tour.img}
              alt={tour.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </AspectRatio>
          {supportsVR && (
            <span className="absolute top-2 left-2 bg-emerald-700/90 text-white text-[11px] px-2 py-0.5 rounded shadow flex items-center gap-1 animate-bounce z-10 border border-white/50">
              <Globe2 className="w-3 h-3" /> 360° VR
            </span>
          )}
        </div>
        <div className="mt-4 flex justify-center">
          <Button
            size="sm"
            variant={highlight ? "default" : "secondary"}
            onClick={onView}
            className={`w-full shadow hover:shadow-lg focus:ring-2 focus:ring-emerald-400 transition-transform duration-300 hover:scale-105 ${highlight ? "animate-pulse" : ""}`}
          >
            <PlayCircle className="w-4 h-4" /> View Virtual Tour
          </Button>
        </div>
        {/* FunFact callout ❇️ */}
        <FunFact className="mt-2 mb-2">{tour.didYouKnow}</FunFact>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <ul className="list-disc pl-4 text-gray-600 space-y-1">
            {tour.facts.slice(0, 2).map((fact, idx) => (
              <li key={idx}>{fact}</li>
            ))}
          </ul>
          <div className="flex flex-col gap-1 items-end">
            <span className="inline-block px-2 py-1 text-[11px] bg-emerald-100 text-emerald-700 font-bold rounded shadow-sm mb-1">
              📍 {tour.location}
            </span>
            <div className="flex flex-wrap gap-1 justify-end">
              {tour.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-block bg-blue-100 text-blue-900 rounded-full px-2 py-[2px] text-xs font-medium"
                  style={{ boxShadow: "0 1px 2px 0 rgba(30,64,175,0.04)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
