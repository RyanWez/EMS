
'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { saveUserProfileImage, UserProfileImageInput } from '@/ai/flows/userProfileFlows';
import { Loader2 } from 'lucide-react';

interface ChangeImageDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userId: string;
  onImageChanged: (newImageUrl: string) => void;
}

export function ChangeImageDialog({ isOpen, onOpenChange, userId, onImageChanged }: ChangeImageDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!acceptedImageTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid image file (JPG, PNG, GIF, WEBP, SVG).",
          variant: "destructive",
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        if(event.target) event.target.value = ""; 
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
         toast({
          title: "File Too Large",
          description: "Image size should not exceed 5MB.",
          variant: "destructive",
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        if(event.target) event.target.value = ""; 
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !previewUrl) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const input: UserProfileImageInput = {
        userId: userId,
        imageDataUri: previewUrl,
      };
      const result = await saveUserProfileImage(input);

      if (result.success) {
        toast({
          title: "Success",
          description: "Profile image updated successfully.",
          variant: 'success',
        });
        onImageChanged(previewUrl); 
        onOpenChange(false); 
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update profile image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving profile image:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenChangeWithReset = (open: boolean) => {
    if (!open) {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    onOpenChange(open);
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeWithReset}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Profile Image</DialogTitle>
          <DialogDescription>
            Select a new image for your profile. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture">Picture</Label>
            <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} disabled={isLoading} />
          </div>
          {previewUrl && (
            <div className="mt-4 relative w-full h-64 rounded-md border overflow-hidden bg-muted">
              <Image src={previewUrl} alt="Selected preview" layout="fill" objectFit="contain" />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedFile}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
