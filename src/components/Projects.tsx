"use client";

import { motion } from "framer-motion";
import { ProjectCard } from "./ProjectCard";

/**
 * Renders the projects section in a Bento Grid layout.
 * Each project is an animated card that displays project information.
 * The section and its items are animated on scroll.
 */
export function Projects() {
  const projects = [
    { title: "SayarKaung", href: "https://sayarkaung.vercel.app", className: "md:col-span-2" },
    { title: "Employee-MM", href: "https://employee-mm.vercel.app", className: "md:col-span-1" },
    { title: "MiYanMar AI", href: "https://t.me/miyanmarChatBot", className: "md:col-span-3" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <section id="projects" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center mb-12 text-foreground"
        >
          My Projects
        </motion.h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {projects.map((project) => (
            <ProjectCard key={project.title} {...project} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
