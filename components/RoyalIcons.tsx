import React from "react";
import {
  Crown,
  Sparkles,
  User,
  GraduationCap,
  Landmark,
  Hash,
  Mail,
  Phone,
  Trophy,
  HeartPulse,
  Lightbulb,
  Calendar,
  MapPin,
  Lock,
  Target,
  Swords,
  Bird,
  Scale,
  Flower2,
  Check,
  Plus,
  AlertCircle,
  Shield,
  MessageCircle,
} from "lucide-react";

export {
  Crown,
  Sparkles,
  User,
  GraduationCap,
  Landmark,
  Hash,
  Mail,
  Phone,
  Trophy,
  HeartPulse,
  Lightbulb,
  Calendar,
  MapPin,
  Lock,
  Target,
  Swords,
  Bird,
  Scale,
  Flower2,
  Check,
  Plus,
  AlertCircle,
  Shield,
  MessageCircle,
};

export function TribeLucideIcon({
  tribe,
  className = "w-5 h-5",
}: {
  tribe: string;
  className?: string;
}) {
  switch (tribe) {
    case "jael":
      // Jael: Bold courage, valor, victory
      return <Swords className={className} />;
    case "abigail":
      // Abigail: Peace, wisdom, grace
      return <Bird className={className} />;
    case "esther":
      // Esther: Royalty, divine favor, beauty
      return <Crown className={className} />;
    case "deborah":
      // Deborah: Justice, strength, leadership
      return <Scale className={className} />;
    case "priscilla":
      // Priscilla: Hospitality, love, radiant devotion
      return <Flower2 className={className} />;
    default:
      return <Crown className={className} />;
  }
}
