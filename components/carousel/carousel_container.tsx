"use client";

import React from "react";
import { CarouselItem } from "@/utils/types/carousel_item";
import Carousel from "./carousel";

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
