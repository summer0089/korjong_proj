"use client";

import React from "react";
import { CarouselItem } from "@/components/carousel/type";
import Carousel from "@/components/carousel/CarouselCard";

interface CarouselContainerProps {
  items: CarouselItem[];
  className?: string;
}

export default function CarouselContainer({
  items,
  className = "",
}: CarouselContainerProps) {

  return (
    <div className={className}>
      <Carousel items={items} />
    </div>
  );
}
