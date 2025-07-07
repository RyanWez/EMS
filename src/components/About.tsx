"use client";

import { motion } from "framer-motion";

/**
 * Renders the About Me section of the portfolio.
 * It includes a title and a detailed biography, animated on scroll.
 */
export function About() {
  return (
    <motion.section
      id="about"
      className="py-24 px-4"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6 text-foreground">
          About Me
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          I'm RyanWez, an innovator passionate about leveraging Artificial Intelligence to create practical digital solutions. I specialize in orchestrating AI to build functional web apps and intelligent chatbots that are not only intelligent but also intuitive and user-friendly. My goal is to bridge the gap between complex AI capabilities and everyday applications, making technology more accessible and impactful.
        </p>
      </div>
    </motion.section>
  );
}
