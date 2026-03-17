import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'en' | 'es';

interface Translations {
  [key: string]: {
    en: string;
    es: string;
  };
}

export const translations: Translations = {
  appTitle: { en: "BlessBack Business Academy", es: "Academia de Negocios BlessBack" },
  appSubtitle: { en: "Culinary Trade School • Recipe Architect", es: "Escuela de Oficios Culinarios • Arquitecto de Recetas" },
  curriculum: { en: "Curriculum", es: "Plan de Estudios" },
  successStories: { en: "Success Stories", es: "Casos de Éxito" },
  inventoryManager: { en: "Inventory Manager", es: "Gestor de Inventario" },
  mySavedRecipes: { en: "My Saved Recipes", es: "Mis Recetas Guardadas" },
  recipeSettings: { en: "Recipe Settings", es: "Configuración de Receta" },
  businessModel: { en: "Business Model", es: "Modelo de Negocio" },
  streetVendor: { en: "Street Vendor", es: "Vendedor Ambulante" },
  restaurant: { en: "Restaurant", es: "Restaurante" },
  home: { en: "Home", es: "Casa" },
  cafe: { en: "Cafe", es: "Cafetería" },
  currentInventory: { en: "Current Inventory", es: "Inventario Actual" },
  noItemsAdded: { en: "No items added yet...", es: "Aún no se han añadido artículos..." },
  consultingChef: { en: "Consulting Chef...", es: "Consultando al Chef..." },
  generateRecipe: { en: "Generate Recipe", es: "Generar Receta" },
  blessBackInsight: { en: "BlessBack Insight", es: "Consejo BlessBack" },
  insightText: { 
    en: "As a business owner, your \"Cost of Goods Sold\" is your most critical metric. Identifying ingredients through the lens of seasonal availability helps you maintain healthy margins even as a street vendor.", 
    es: "Como dueño de negocio, tu \"Costo de Bienes Vendidos\" es tu métrica más crítica. Identificar ingredientes a través de la lente de la disponibilidad estacional te ayuda a mantener márgenes saludables incluso como vendedor ambulante." 
  },
  readyToCreate: { en: "Ready to Create?", es: "¿Listo para Crear?" },
  uploadPrompt: { 
    en: "Upload an image of your inventory or type your available ingredients on the left to generate unique business-ready recipes.", 
    es: "Sube una imagen de tu inventario o escribe tus ingredientes disponibles a la izquierda para generar recetas únicas listas para el negocio." 
  },
  selectIngredients: { en: "Select Ingredients", es: "Seleccionar Ingredientes" },
  selectAll: { en: "Select All", es: "Seleccionar Todo" },
  deselectAll: { en: "Deselect All", es: "Deseleccionar Todo" },
  translatingUnits: { en: "Translating and converting units...", es: "Traduciendo y convirtiendo unidades..." },
  done: { en: "Done", es: "Hecho" },
  readyForRecipe: { en: "Ready for recipe generation", es: "Listo para generar receta" },
  selected: { en: "Selected", es: "Seleccionado" },
  ingredients: { en: "Ingredients", es: "Ingredientes" },
  quantity: { en: "Qty", es: "Cant" },
  metric: { en: "Metric", es: "Métrico" },
  imperial: { en: "Imperial", es: "Imperial" },
  clearAll: { en: "Clear All", es: "Borrar Todo" },
  generate: { en: "Generate", es: "Generar" },
  typeItems: { en: "Type items (e.g. Flour, Milk)...", es: "Escribe artículos (ej. Harina, Leche)..." },
  add: { en: "Add", es: "Añadir" },
  scan: { en: "Scan", es: "Escanear" },
  upload: { en: "Upload", es: "Subir" },
  noIngredientsIdentified: { en: "No ingredients were identified in that image.", es: "No se identificaron ingredientes en esa imagen." },
  failedToProcess: { en: "Failed to process the uploaded image.", es: "Error al procesar la imagen subida." },
  cameraRequiresHttps: { en: "Camera requires a secure HTTPS connection. Please use the 'Upload' option instead.", es: "La cámara requiere una conexión HTTPS segura. Por favor, usa la opción 'Subir' en su lugar." },
  cameraRestricted: { en: "Direct camera access is restricted. Switching to manual upload...", es: "El acceso directo a la cámara está restringido. Cambiando a subida manual..." },
  couldNotSeeIngredients: { en: "Could not see any ingredients. Try a clearer angle.", es: "No se pudo ver ningún ingrediente. Intenta un ángulo más claro." },
  identifyingStock: { en: "Identifying Stock...", es: "Identificando Inventario..." },
  processingImage: { en: "Processing Image...", es: "Procesando Imagen..." },
  businessStrategy: { en: "Business Strategy Suggestion", es: "Sugerencia de Estrategia de Negocio" },
  scale: { en: "Scale", es: "Escala" },
  portions: { en: "Portions", es: "Porciones" },
  prep: { en: "prep", es: "prep" },
  cook: { en: "cook", es: "cocción" },
  servings: { en: "servings", es: "porciones" },
  batchNote: { en: "Batch Production Note", es: "Nota de Producción en Lote" },
  prepSteps: { en: "Preparation Steps", es: "Pasos de Preparación" },
  chefTips: { en: "Chef's Tips for Profitability", es: "Consejos del Chef para Rentabilidad" },
  nutritionalInfo: { en: "Nutritional Information (per serving)", es: "Información Nutricional (por porción)" },
  calories: { en: "Calories", es: "Calorías" },
  protein: { en: "Protein", es: "Proteína" },
  carbs: { en: "Carbs", es: "Carbohidratos" },
  fats: { en: "Fats", es: "Grasas" },
  errorGeneration: { en: "Something went wrong generating the recipe. Please try again.", es: "Algo salió mal al generar la receta. Por favor, inténtalo de nuevo." },
  kcal: { en: "kcal", es: "kcal" },
  g: { en: "g", es: "g" },
  saveRecipe: { en: "Save Recipe", es: "Guardar Receta" },
  unsaveRecipe: { en: "Remove from Saved", es: "Eliminar de Guardadas" },
  noSavedRecipes: { en: "No saved recipes yet.", es: "Aún no hay recetas guardadas." },
  close: { en: "Close", es: "Cerrar" }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');

  const t = (key: keyof typeof translations) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
