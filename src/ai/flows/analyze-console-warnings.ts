'use server';

/**
 * @fileOverview A Genkit flow to analyze console warnings and suggest potential causes and solutions.
 *
 * - analyzeConsoleWarnings - A function that analyzes console warnings.
 * - AnalyzeConsoleWarningsInput - The input type for the analyzeConsoleWarnings function.
 * - AnalyzeConsoleWarningsOutput - The return type for the analyzeConsoleWarnings function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeConsoleWarningsInputSchema = z.object({
  consoleWarnings: z.string().describe('The console warnings to analyze.'),
});
export type AnalyzeConsoleWarningsInput = z.infer<typeof AnalyzeConsoleWarningsInputSchema>;

const AnalyzeConsoleWarningsOutputSchema = z.object({
  summary: z.string().describe('A summary of potential causes and solutions for the console warnings.'),
});
export type AnalyzeConsoleWarningsOutput = z.infer<typeof AnalyzeConsoleWarningsOutputSchema>;

export async function analyzeConsoleWarnings(input: AnalyzeConsoleWarningsInput): Promise<AnalyzeConsoleWarningsOutput> {
  return analyzeConsoleWarningsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeConsoleWarningsPrompt',
  input: { schema: AnalyzeConsoleWarningsInputSchema },
  output: { schema: AnalyzeConsoleWarningsOutputSchema },
  prompt: `You are a helpful assistant that analyzes console warnings and suggests potential causes and solutions.

Analyze the following console warnings and provide a summary of potential causes and solutions:

Console Warnings:
{{consoleWarnings}}

Summary: `,
});

const analyzeConsoleWarningsFlow = ai.defineFlow(
  {
    name: 'analyzeConsoleWarningsFlow',
    inputSchema: AnalyzeConsoleWarningsInputSchema,
    outputSchema: AnalyzeConsoleWarningsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return { summary: 'Could not analyze console warnings at this time. Please try again.' };
    }
    return output;
  }
);
