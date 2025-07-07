"use client";

import type { SVGProps } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "./ui/button";

const FacebookIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TelegramIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>
  </svg>
);

/**
 * Renders the contact section with social media links.
 * This section encourages users to get in touch and provides links to social profiles.
 * It animates into view on scroll.
 */
export function Contact() {
  return (
    <motion.section
      id="contact"
      className="py-24 px-4 bg-card/50"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4 text-foreground">Get In Touch</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Have a project in mind or just want to say hello? Feel free to reach out.
        </p>
        <div className="flex justify-center items-center space-x-6">
          <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
            <Link href="https://facebook.com/ryanwez0" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="w-16 h-16 rounded-full border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-300">
                <FacebookIcon className="w-8 h-8" />
              </Button>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
            <Link href="https://t.me/RyanWez" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="w-16 h-16 rounded-full border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-300">
                <TelegramIcon className="w-8 h-8" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
