
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, AnalysisResult } from "../types";

/**
 * Analyzes an image to identify food ingredients.
 * Uses gemini-2.5-flash-image for specialized multimodal processing.
 */
export const analyzeIngredientsFromImage = async (base64Image: string, language: string = 'en'): Promise<AnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: `List every food ingredient you see in this photo. Return the result in a JSON object with an 'ingredients' array. Translate the ingredient names to ${language === 'es' ? 'Spanish' : 'English'}.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            }
          },
          required: ["ingredients"]
        }
      }
    });

    if (!response.text) throw new Error("The AI returned an empty response.");
    return JSON.parse(response.text) as AnalysisResult;
  } catch (e: any) {
    console.error("Vision API Error:", e);
    throw new Error(e.message || "Could not reach the Vision API. Please ensure your internet is active.");
  }
};

/**
 * Generates a business-optimized recipe using professional reasoning.
 * Uses gemini-3-pro-preview for advanced business logic.
 */
export const generateRecipe = async (ingredients: string[], targetType: string, language: string = 'en', unitSystem: string = 'metric'): Promise<Recipe> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Business Type: ${targetType}.
Available Ingredients: ${ingredients.join(', ')}.
Unit System: ${unitSystem} (Use ${unitSystem === 'metric' ? 'Celsius and grams/ml' : 'Fahrenheit and ounces/cups'} for all temperatures and measurements).

Instructions: Create a high-profit, professional-grade recipe.
Respond entirely in ${language === 'es' ? 'Spanish' : 'English'}.
Include:
1. A creative marketing name and blurb to sell the dish.
2. Exact measurements for a standard serving.
3. Scaling notes for batch cooking (how to scale to 50+ portions).
4. Tips on ingredient substitution and food cost management.
5. Estimated nutritional information per serving (calories, protein, carbohydrates, fats in grams).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            marketingName: { type: Type.STRING },
            marketingBlurb: { type: Type.STRING },
            prepTime: { type: Type.STRING },
            cookTime: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            servings: { type: Type.NUMBER },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  unit: { type: Type.STRING }
                },
                required: ["name", "amount", "unit"]
              }
            },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            scalingNotes: { type: Type.STRING },
            nutritionalInfo: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbohydrates: { type: Type.NUMBER },
                fats: { type: Type.NUMBER }
              },
              required: ["calories", "protein", "carbohydrates", "fats"]
            }
          },
          required: ["title", "marketingName", "ingredients", "instructions", "nutritionalInfo"]
        }
      }
    });

    const recipe = JSON.parse(response.text || '{}');
    return { ...recipe, id: Math.random().toString(36).substr(2, 9), language, unitSystem } as Recipe;
  } catch (e: any) {
    console.error("Chef API Error:", e);
    throw new Error(e.message || "Recipe generation failed. Try adding more ingredients.");
  }
};

/**
 * Translates and converts a recipe to a new language and unit system.
 */
export const translateRecipe = async (recipe: Recipe, language: string, unitSystem: string): Promise<Recipe> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Translate and convert the following recipe.
Target Language: ${language === 'es' ? 'Spanish' : 'English'}
Target Unit System: ${unitSystem} (Use ${unitSystem === 'metric' ? 'Celsius and grams/ml' : 'Fahrenheit and ounces/cups'} for all temperatures and measurements).

Recipe to convert:
${JSON.stringify(recipe)}

Return the EXACT SAME JSON structure, just translated and with converted units/temperatures. Do not change the id.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            marketingName: { type: Type.STRING },
            marketingBlurb: { type: Type.STRING },
            prepTime: { type: Type.STRING },
            cookTime: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            servings: { type: Type.NUMBER },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  unit: { type: Type.STRING }
                },
                required: ["name", "amount", "unit"]
              }
            },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            scalingNotes: { type: Type.STRING },
            nutritionalInfo: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbohydrates: { type: Type.NUMBER },
                fats: { type: Type.NUMBER }
              },
              required: ["calories", "protein", "carbohydrates", "fats"]
            }
          },
          required: ["title", "marketingName", "ingredients", "instructions", "nutritionalInfo"]
        }
      }
    });

    const translatedRecipe = JSON.parse(response.text || '{}');
    return { ...translatedRecipe, id: recipe.id, language, unitSystem } as Recipe;
  } catch (e: any) {
    console.error("Translation API Error:", e);
    throw new Error(e.message || "Recipe translation failed.");
  }
};
