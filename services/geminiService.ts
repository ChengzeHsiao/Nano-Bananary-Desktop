
import { GoogleGenAI, Modality } from "@google/genai";
import type { GeneratedContent } from '../types';
import { getApiKey } from './settingsStore';

let aiInstance: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

async function getAI(): Promise<GoogleGenAI> {
  const key = await getApiKey();
  if (!key) {
    throw new Error("API Key is not configured. Please set your Gemini API Key in Settings.");
  }
  
  // Reuse instance if key hasn't changed
  if (aiInstance && currentApiKey === key) {
    return aiInstance;
  }
  
  currentApiKey = key;
  aiInstance = new GoogleGenAI({ apiKey: key });
  return aiInstance;
}

export async function editImage(
    base64ImageData: string, 
    mimeType: string, 
    prompt: string,
    maskBase64: string | null,
    secondaryImage: { base64: string; mimeType: string } | null
): Promise<GeneratedContent> {
  try {
    let fullPrompt = prompt;
    const parts: any[] = [
      {
        inlineData: {
          data: base64ImageData,
          mimeType: mimeType,
        },
      },
    ];

    if (maskBase64) {
      parts.push({
        inlineData: {
          data: maskBase64,
          mimeType: 'image/png',
        },
      });
      fullPrompt = `Apply the following instruction only to the masked area of the image: "${prompt}". Preserve the unmasked area.`;
    }
    
    if (secondaryImage) {
        parts.push({
            inlineData: {
                data: secondaryImage.base64,
                mimeType: secondaryImage.mimeType,
            },
        });
    }

    parts.push({ text: fullPrompt });

    const ai = await getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const result: GeneratedContent = { imageUrl: null, text: null };
    const responseParts = response.candidates?.[0]?.content?.parts;

    if (responseParts) {
      for (const part of responseParts) {
        if (part.text) {
          result.text = (result.text ? result.text + "\n" : "") + part.text;
        } else if (part.inlineData) {
          result.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    if (!result.imageUrl) {
        let errorMessage;
        if (result.text) {
            errorMessage = `The model responded: "${result.text}"`;
        } else {
            const finishReason = response.candidates?.[0]?.finishReason;
            const safetyRatings = response.candidates?.[0]?.safetyRatings;
            errorMessage = "The model did not return an image. It might have refused the request. Please try a different image or prompt.";
            
            if (finishReason === 'SAFETY') {
                const blockedCategories = safetyRatings?.filter(r => r.blocked).map(r => r.category).join(', ');
                errorMessage = `The request was blocked for safety reasons. Categories: ${blockedCategories || 'Unknown'}. Please modify your prompt or image.`;
            }
        }
        throw new Error(errorMessage);
    }

    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        let errorMessage = error.message;
        try {
            const parsedError = JSON.parse(errorMessage);
            if (parsedError.error && parsedError.error.message) {
                if (parsedError.error.status === 'RESOURCE_EXHAUSTED') {
                    errorMessage = "You've likely exceeded the request limit. Please wait a moment before trying again.";
                } else if (parsedError.error.code === 500 || parsedError.error.status === 'UNKNOWN') {
                    errorMessage = "An unexpected server error occurred. This might be a temporary issue. Please try again in a few moments.";
                } else {
                    errorMessage = parsedError.error.message;
                }
            }
        } catch (e) {}
        throw new Error(errorMessage);
    }
    throw new Error("An unknown error occurred while communicating with the API.");
  }
}

export async function generateVideo(
    prompt: string,
    image: { base64: string; mimeType: string } | null,
    aspectRatio: '16:9' | '9:16',
    onProgress: (message: string) => void
): Promise<string> {
    try {
        onProgress("Initializing video generation...");

        // FIX: The `request` object was explicitly typed as `any`, which caused a loss of type
        // information for the `operation` variable returned by `generateVideos`. This could lead
        // to a TypeScript error. By allowing TypeScript to infer the type, we ensure
        // `operation` is correctly typed, resolving the error.
        const request = {
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                aspectRatio: aspectRatio
            },
            ...(image && {
                image: {
                    imageBytes: image.base64,
                    mimeType: image.mimeType
                }
            })
        };
        
        const ai = await getAI();
        let operation = await ai.models.generateVideos(request);
        
        onProgress("Polling for results, this may take a few minutes...");

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.error) {
            throw new Error(operation.error.message || "Video generation failed during operation.");
        }

        // Debug: log the response structure
        console.log("Video generation response:", JSON.stringify(operation, null, 2));

        // Try multiple possible paths for the download link
        let downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        // Alternative paths that might exist in different API versions
        if (!downloadLink) {
            downloadLink = (operation as any).response?.videos?.[0]?.uri;
        }
        if (!downloadLink) {
            downloadLink = (operation as any).result?.generatedVideos?.[0]?.video?.uri;
        }
        if (!downloadLink) {
            downloadLink = (operation as any).metadata?.generatedVideos?.[0]?.video?.uri;
        }

        if (!downloadLink) {
            // Provide more details about what we received
            const responseStr = JSON.stringify(operation.response || operation, null, 2);
            console.error("Full operation response:", responseStr);
            throw new Error(`Video generation completed, but no download link was found. Response: ${responseStr.substring(0, 500)}`);
        }

        // Handle URLs that might already have query parameters
        const separator = downloadLink.includes('?') ? '&' : '?';
        return `${downloadLink}${separator}key=${currentApiKey}`;

    } catch (error) {
        console.error("Error calling Video Generation API:", error);
        if (error instanceof Error) {
            let errorMessage = error.message;
            try {
                const parsedError = JSON.parse(errorMessage);
                if (parsedError.error && parsedError.error.message) {
                    errorMessage = parsedError.error.message;
                }
            } catch (e) {}
            throw new Error(errorMessage);
        }
        throw new Error("An unknown error occurred during video generation.");
    }
}
