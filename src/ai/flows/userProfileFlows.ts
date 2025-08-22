
'use server';
/**
 * @fileOverview User profile related Genkit flows, e.g., for managing profile images.
 *
 * - saveUserProfileImage - Saves or updates a user's profile image.
 * - UserProfileImageInput - Input type for saving a profile image.
 * - getUserProfileImage - Retrieves a user's profile image.
 * - GetUserProfileImageInput - Input type for retrieving a profile image.
 * - UserProfileImageOutput - Output type for profile image operations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod'; // Corrected import path
import { getMongoClient } from '@/lib/mongodb';

const USER_PROFILE_COLLECTION = 'userProfiles';
// For now, use a default user ID as there's no authentication system
const DEFAULT_USER_ID = 'default_user';

const UserProfileImageInputSchema = z.object({
  userId: z.string().default(DEFAULT_USER_ID).describe("The ID of the user whose profile image is being saved."),
  imageDataUri: z.string().describe("The profile image as a data URI (e.g., 'data:image/png;base64,...')."),
});
export type UserProfileImageInput = z.infer<typeof UserProfileImageInputSchema>;

const GetUserProfileImageInputSchema = z.object({
  userId: z.string().default(DEFAULT_USER_ID).describe("The ID of the user whose profile image is being retrieved."),
});
export type GetUserProfileImageInput = z.infer<typeof GetUserProfileImageInputSchema>;

const UserProfileImageOutputSchema = z.object({
  success: z.boolean().describe("Indicates if the operation was successful."),
  message: z.string().optional().describe("A message describing the outcome of the operation."),
  imageDataUri: z.string().optional().describe("The profile image as a data URI, if found or applicable."),
});
export type UserProfileImageOutput = z.infer<typeof UserProfileImageOutputSchema>;


const saveUserProfileImageFlow = ai.defineFlow(
  {
    name: 'saveUserProfileImageFlow',
    inputSchema: UserProfileImageInputSchema,
    outputSchema: UserProfileImageOutputSchema,
  },
  async (input) => {
    try {
      const client = await getMongoClient();
      const db = client.db(); // Assumes DB name is in the MONGODB_URI or uses default
      const collection = db.collection(USER_PROFILE_COLLECTION);

      await collection.updateOne(
        { userId: input.userId },
        { $set: { userId: input.userId, imageDataUri: input.imageDataUri, updatedAt: new Date() } },
        { upsert: true } // Creates the document if it doesn't exist
      );
      return { success: true, message: 'Profile image saved successfully.', imageDataUri: input.imageDataUri };
    } catch (error) {
      console.error('Error saving profile image to MongoDB:', error);
      // Check if error is an instance of Error to safely access message
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { success: false, message: `Failed to save profile image: ${errorMessage}` };
    }
  }
);
export async function saveUserProfileImage(input: UserProfileImageInput): Promise<UserProfileImageOutput> {
  return saveUserProfileImageFlow(input);
}


const getUserProfileImageFlow = ai.defineFlow(
  {
    name: 'getUserProfileImageFlow',
    inputSchema: GetUserProfileImageInputSchema,
    outputSchema: UserProfileImageOutputSchema,
  },
  async (input) => {
    try {
      const client = await getMongoClient();
      const db = client.db();
      const collection = db.collection(USER_PROFILE_COLLECTION);

      const profile = await collection.findOne({ userId: input.userId });
      
      if (profile && profile.imageDataUri) {
        return { success: true, imageDataUri: profile.imageDataUri as string };
      }
      return { success: true, message: 'Profile image not found.' }; // Success true, but no image
    } catch (error) {
      console.error('Error fetching profile image from MongoDB:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { success: false, message: `Failed to fetch profile image: ${errorMessage}` };
    }
  }
);
export async function getUserProfileImage(input: GetUserProfileImageInput): Promise<UserProfileImageOutput> {
  return getUserProfileImageFlow(input);
}

