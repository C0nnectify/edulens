import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Star, Tag, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface VirtualTourModalProps {
  tour: Tour;
  open: boolean;
  onClose: () => void;
}

export default function VirtualTourModal({ tour, open, onClose }: VirtualTourModalProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden shadow-xl ring-1 ring-emerald-100">
        <DialogHeader className="bg-emerald-50 px-8 pt-8 pb-4 border-b border-emerald-100">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {tour.title}
            <span className="flex items-center ml-2 text-yellow-600">
              <Star className="w-5 h-5 mr-1" fill="currentColor" />
              {tour.rating}
            </span>
          </DialogTitle>
          <DialogDescription className="text-emerald-900">{tour.location}</DialogDescription>
        </DialogHeader>
        <div className="p-0">
          {/* 360º / VR video embedded here (YouTube as a placeholder) */}
          <div className="aspect-video bg-gray-200 relative">
            {tour.videoUrl ? (
              <iframe
                src={tour.videoUrl}
                title={tour.title}
                className="w-full h-full rounded-none"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img src={tour.img} alt={tour.title} className="object-cover w-full h-full" />
            )}
            {/* Tag badge */}
            <div className="absolute top-2 right-2 flex gap-1">
              {tour.tags.slice(0,2).map(tag=>(
                <span key={tag} className="bg-blue-100 text-blue-900 px-2 py-1 rounded-full text-xs font-medium shadow-sm border border-blue-200">{tag}</span>
              ))}
            </div>
          </div>
          <div className="px-8 py-6">
            {/* Location Row */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded text-xs font-semibold shadow border border-emerald-200">
                📍 {tour.location}
              </span>
              {tour.rating && (
              <span className="inline-flex items-center px-2 py-0.5 bg-yellow-100 ml-1 text-yellow-900 rounded text-xs font-semibold shadow border border-yellow-200">
                <Star className="w-3 h-3 mr-1" fill="currentColor"/> {tour.rating}
              </span>
              )}
            </div>
            {/* FunFact */}
            <FunFact>{tour.didYouKnow}</FunFact>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-1 text-emerald-800 mt-4">
              <ThumbsUp className="w-5 h-5 text-emerald-600" />
              Quick Facts
            </h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              {tour.facts.map((fact, i) => (
                <li key={i}>{fact}</li>
              ))}
            </ul>
            {/* Tag List Full */}
            <div className="flex flex-wrap gap-2 mb-2">
              {tour.tags.map(tag => (
                <span key={tag} className="inline-flex items-center bg-blue-100 text-blue-900 px-2 py-1 rounded text-xs font-semibold shadow-sm">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
            {/* CTA close button */}
            <DialogClose asChild>
              <Button variant="outline" className="mt-4 w-full">Back to all tours</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
