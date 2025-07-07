"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  title: string;
  href: string;
  className?: string;
};

/**
 * A card component for displaying a project in a Bento Grid.
 * It features a glassmorphic design and hover animations.
 * @param {ProjectCardProps} props - The properties for the project card.
 */
export const ProjectCard = ({ title, href, className }: ProjectCardProps) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={cardVariants}
      className={cn("relative rounded-xl overflow-hidden group", className)}
    >
      <Link href={href} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
        <div className="absolute inset-0 bg-secondary/40 backdrop-blur-sm border border-white/10 transition-colors duration-300 group-hover:bg-secondary/60"></div>
        <div className="relative z-10 p-6 flex justify-between items-end h-full min-h-[150px]">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <ArrowUpRight className="text-foreground/70 group-hover:text-primary transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" size={24} />
        </div>
      </Link>
    </motion.div>
  );
};
