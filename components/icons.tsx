/**
 * One consistent icon family for the whole app: lucide-react.
 * Named wrappers keep sizing and stroke weight uniform. Geometry (route-diagram
 * nodes, line rails) is drawn with CSS, never with icons.
 */
import {
  ArrowLeftRight, Search, MapPin, Waypoints, Repeat, ChevronRight, ChevronLeft,
  X, TriangleAlert, LoaderCircle, ArrowRight, House, Briefcase,
  GraduationCap, Heart, Route, CircleDot, Map as LucideMap,
} from "lucide-react";

type P = { size?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" };

function make(El: typeof Search) {
  return function Icon({ size = 20, className, ...rest }: P) {
    return <El size={size} strokeWidth={1.75} className={className} aria-hidden {...rest} />;
  };
}

export const IconSwap = make(ArrowLeftRight);
export const IconSearch = make(Search);
export const IconPin = make(MapPin);
export const IconWaypoints = make(Waypoints);
export const IconRepeat = make(Repeat);
export const IconChevronRight = make(ChevronRight);
export const IconChevronLeft = make(ChevronLeft);
export const IconClose = make(X);
export const IconAlert = make(TriangleAlert);
export const IconSpinner = make(LoaderCircle);
export const IconArrowRight = make(ArrowRight);
export const IconHouse = make(House);
export const IconBriefcase = make(Briefcase);
export const IconGraduationCap = make(GraduationCap);
export const IconHeart = make(Heart);
export const IconRoute = make(Route);
export const IconNode = make(CircleDot);
export const IconMap = make(LucideMap);
