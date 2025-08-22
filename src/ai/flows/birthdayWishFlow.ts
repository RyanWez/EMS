
'use server';
/**
 * @fileOverview A Genkit flow to generate birthday wishes for employees.
 *
 * - generateBirthdayWish - A function that generates a birthday wish.
 * - BirthdayWishInput - The input type for the generateBirthdayWish function.
 * - BirthdayWishOutput - The return type for the generateBirthdayWish function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BirthdayWishInputSchema = z.object({
  employeeName: z.string().describe("The name of the employee for whom to generate a birthday wish."),
});
export type BirthdayWishInput = z.infer<typeof BirthdayWishInputSchema>;

const BirthdayWishOutputSchema = z.object({
  wish: z.string().describe("The generated birthday wish."),
});
export type BirthdayWishOutput = z.infer<typeof BirthdayWishOutputSchema>;

export async function generateBirthdayWish(input: BirthdayWishInput): Promise<BirthdayWishOutput> {
  return generateBirthdayWishFlow(input);
}

const prompt = ai.definePrompt({
  name: 'birthdayWishPrompt',
  input: { schema: BirthdayWishInputSchema },
  output: { schema: BirthdayWishOutputSchema },
  prompt: `You are a friendly and creative HR assistant. Generate a short, warm, and professional birthday wish for an employee named {{{employeeName}}}.

Make the wish sound genuine and celebratory. Keep it concise, ideally 1-2 sentences.

Example: "Happy Birthday, {{{employeeName}}}! Wishing you a fantastic day filled with joy and celebration. All the best for the year ahead!"

Generate a unique wish for: {{{employeeName}}}`,
});

const generateBirthdayWishFlow = ai.defineFlow(
  {
    name: 'generateBirthdayWishFlow',
    inputSchema: BirthdayWishInputSchema,
    outputSchema: BirthdayWishOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return { wish: "Could not generate a birthday wish at this time. Please try again." };
    }
    return output;
  }
);
