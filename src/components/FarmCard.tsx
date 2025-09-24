import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MapPin, Users, Star, Waves, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export interface FarmProps {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  image: string;
  governorate: string;
  category: "youth" | "family";
  features: string[];
  hasPool: boolean;
  poolSanitized: boolean;
  cleanlinessRating: number;
  averageRating?: number;
  reviewCount?: number;
}

interface FarmCardProps {
  farm: FarmProps;
}

export default function FarmCard({ farm }: FarmCardProps) {
  const categoryColors = {
    youth: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    family: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
      <CardHeader className="p-0">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img 
            src={farm.image} 
            alt={farm.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className={categoryColors[farm.category]}>
              {farm.category === "youth" ? "Youth" : "Family"}
            </Badge>
            {farm.poolSanitized && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Waves className="w-3 h-3 mr-1" />
                Sanitized Pool
              </Badge>
            )}
          </div>
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-white/90 text-gray-800">
              <Shield className="w-3 h-3 mr-1" />
              {farm.cleanlinessRating}/5
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
            {farm.name}
          </h3>
          {farm.averageRating && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{farm.averageRating}</span>
              {farm.reviewCount && <span>({farm.reviewCount})</span>}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4" />
          <span>{farm.governorate}</span>
          <Users className="w-4 h-4 ml-2" />
          <span>Up to {farm.capacity} guests</span>
        </div>
        
        <p className="text-muted-foreground mb-4 line-clamp-2">
          {farm.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {farm.features.slice(0, 3).map((feature, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
          {farm.features.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{farm.features.length - 3} more
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-primary">
              ${farm.price}
            </span>
            <span className="text-muted-foreground ml-1">/ day</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full btn-primary">
          <Link to={`/farms/${farm.id}`}>
            View Details & Book
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}