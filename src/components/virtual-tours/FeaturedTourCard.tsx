
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, MapPin, Eye } from 'lucide-react';

interface FeaturedTourCardProps {
  title: string;
  country: string;
  tourTypes: string[];
  duration: string;
  image: string;
  ctaText: string;
  format?: string;
  description?: string;
}

const FeaturedTourCard = ({ 
  title, 
  country, 
  tourTypes, 
  duration, 
  image, 
  ctaText, 
  format,
  description 
}: FeaturedTourCardProps) => {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
          360° VR
        </div>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Play className="w-12 h-12 text-white" />
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold leading-tight">{title}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          {country}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {tourTypes.map((type, index) => (
            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
              {type}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {duration}
          </div>
          {format && (
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {format}
            </div>
          )}
        </div>

        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}
        
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          <Play className="mr-2 h-4 w-4" />
          {ctaText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FeaturedTourCard;
