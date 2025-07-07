"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "./ui/button";

/**
 * Renders the hero section of the portfolio.
 * It displays the user's name, tagline, a brief introduction, and a call-to-action button.
 * The section features animations using Framer Motion.
 */
export function Hero() {
  return (
    <section id="hero" className="min-h-screen flex items-center justify-center text-center px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl"
      >
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-4">
          RyanWez
        </h1>
        <p className="text-2xl md:text-3xl text-primary font-semibold mb-6">
          AI Enthusiast & Project Creator
        </p>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg text-muted-foreground mb-8">
          I'm RyanWez, an innovator passionate about leveraging Artificial Intelligence to create practical digital solutions. I specialize in orchestrating AI to build functional web apps and intelligent chatbots.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link href="#contact">
            <Button size="lg" className="text-lg px-8 py-6">Get In Touch</Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
