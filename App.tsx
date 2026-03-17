
import React, { useState, useEffect } from 'react';
import IngredientInput from './IngredientInput';
import RecipeCard from './RecipeCard';
import { generateRecipe, translateRecipe } from './geminiService'; 
import { Recipe, InventoryItem } from './types';
import { useLanguage } from './LanguageContext';

const App: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [ingredients, setIngredients] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('blessback_inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetType, setTargetType] = useState<'Street Vendor' | 'Restaurant' | 'Home' | 'Cafe'>('Restaurant');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [translating, setTranslating] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSavedRecipesOpen, setIsSavedRecipesOpen] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('blessback_saved_recipes');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('blessback_selected_ingredients');
    if (saved) return JSON.parse(saved);
    const savedInv = localStorage.getItem('blessback_inventory');
    if (savedInv) {
      const inv: InventoryItem[] = JSON.parse(savedInv);
      return inv.map(i => i.id);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('blessback_inventory', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('blessback_saved_recipes', JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  useEffect(() => {
    localStorage.setItem('blessback_selected_ingredients', JSON.stringify(selectedIngredientIds));
  }, [selectedIngredientIds]);

  // Clean up selected IDs if ingredients are removed
  useEffect(() => {
    setSelectedIngredientIds(prev => prev.filter(id => ingredients.some(i => i.id === id)));
  }, [ingredients]);

  const toggleSaveRecipe = (recipe: Recipe) => {
    setSavedRecipes(prev => {
      const isSaved = prev.some(r => r.id === recipe.id);
      if (isSaved) {
        return prev.filter(r => r.id !== recipe.id);
      } else {
        return [...prev, recipe];
      }
    });
  };

  // Translate recipes when language or unit system changes
  useEffect(() => {
    const convertRecipes = async () => {
      const recipesToConvert = recipes.filter(
        r => r.language !== language || r.unitSystem !== unitSystem
      );
      
      if (recipesToConvert.length === 0) return;
      
      setTranslating(true);
      try {
        const convertedRecipes = await Promise.all(
          recipesToConvert.map(r => translateRecipe(r, language, unitSystem))
        );
        
        setRecipes(prev => prev.map(r => {
          const converted = convertedRecipes.find(cr => cr.id === r.id);
          return converted || r;
        }));
      } catch (err) {
        console.error("Translation error:", err);
      } finally {
        setTranslating(false);
      }
    };

    convertRecipes();
  }, [language, unitSystem]);

  const addIngredients = (newItems: string[]) => {
    const existingNames = ingredients.map(i => i.name.toLowerCase());
    const uniqueNewItems = newItems
      .filter(item => !existingNames.includes(item.toLowerCase()))
      .map(item => ({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        name: item,
        quantity: '1'
      }));
    
    setIngredients(prev => [...prev, ...uniqueNewItems]);
    setSelectedIngredientIds(prev => [...prev, ...uniqueNewItems.map(i => i.id)]);
  };

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: string) => {
    setIngredients(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const handleGenerate = async () => {
    const selectedItems = ingredients.filter(i => selectedIngredientIds.includes(i.id));
    if (selectedItems.length === 0) return;
    setLoading(true);
    try {
      const ingredientStrings = selectedItems.map(i => `${i.quantity} ${i.name}`);
      const newRecipe = await generateRecipe(ingredientStrings, targetType, language, unitSystem);
      setRecipes(prev => [newRecipe, ...prev]);
    } catch (err) {
      console.error("Generation error:", err);
      alert(t('errorGeneration'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-xl">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-inner">
              <i className="fa-solid fa-hat-chef"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('appTitle')}</h1>
              <p className="text-emerald-400 text-sm font-medium">{t('appSubtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsSavedRecipesOpen(true)} 
               className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
             >
               <i className="fa-solid fa-heart"></i>
               {t('mySavedRecipes')}
             </button>
             <button 
               onClick={() => setIsInventoryOpen(true)} 
               className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
             >
               <i className="fa-solid fa-boxes-stacked"></i>
               {t('inventoryManager')}
             </button>
             <div className="flex items-center bg-slate-800 rounded-lg p-1">
               <button 
                 onClick={() => setUnitSystem('metric')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${unitSystem === 'metric' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 {t('metric')}
               </button>
               <button 
                 onClick={() => setUnitSystem('imperial')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${unitSystem === 'imperial' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 {t('imperial')}
               </button>
             </div>
             <div className="flex items-center bg-slate-800 rounded-lg p-1">
               <button 
                 onClick={() => setLanguage('en')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${language === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 EN
               </button>
               <button 
                 onClick={() => setLanguage('es')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${language === 'es' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 ES
               </button>
             </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold mb-4">{t('recipeSettings')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('businessModel')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Street Vendor', 'Restaurant', 'Home', 'Cafe'] as const).map(type => {
                      const typeKey = type === 'Street Vendor' ? 'streetVendor' : type.toLowerCase() as any;
                      return (
                        <button
                          key={type}
                          onClick={() => setTargetType(type)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                            targetType === type 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {t(typeKey)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                   <div className="flex justify-between items-end mb-2">
                     <label className="text-xs font-bold text-slate-500 uppercase">{t('selectIngredients')}</label>
                     {ingredients.length > 0 && (
                       <button 
                         onClick={() => {
                           if (selectedIngredientIds.length === ingredients.length) {
                             setSelectedIngredientIds([]);
                           } else {
                             setSelectedIngredientIds(ingredients.map(i => i.id));
                           }
                         }}
                         className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                       >
                         {selectedIngredientIds.length === ingredients.length ? t('deselectAll') : t('selectAll')}
                       </button>
                     )}
                   </div>
                   
                   <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-[300px] overflow-y-auto flex flex-col gap-2">
                     {ingredients.length === 0 ? (
                       <div className="text-center py-6">
                         <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
                           <i className="fa-solid fa-boxes-stacked"></i>
                         </div>
                         <p className="text-slate-500 text-sm mb-3">{t('noItemsAdded')}</p>
                         <button 
                           onClick={() => setIsInventoryOpen(true)}
                           className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                         >
                           {t('inventoryManager')}
                         </button>
                       </div>
                     ) : (
                       ingredients.map(item => (
                         <label key={item.id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-colors ${selectedIngredientIds.includes(item.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-200'}`}>
                           <input 
                             type="checkbox" 
                             checked={selectedIngredientIds.includes(item.id)}
                             onChange={(e) => {
                               if (e.target.checked) setSelectedIngredientIds(prev => [...prev, item.id]);
                               else setSelectedIngredientIds(prev => prev.filter(id => id !== item.id));
                             }}
                             className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                           />
                           <span className="flex-1 text-sm font-medium text-slate-700 truncate" title={item.name}>{item.name}</span>
                           <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{item.quantity}</span>
                         </label>
                       ))
                     )}
                   </div>
                   {ingredients.length > 0 && (
                     <button 
                       onClick={() => setIsInventoryOpen(true)}
                       className="w-full py-2 mt-3 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                     >
                       <i className="fa-solid fa-pen-to-square"></i>
                       {t('inventoryManager')}
                     </button>
                   )}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading || selectedIngredientIds.length === 0}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                    loading || selectedIngredientIds.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-emerald-200 active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      {t('consultingChef')}
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      {t('generateRecipe')}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Educational Prompt */}
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-2 text-sm uppercase tracking-wide">
                <i className="fa-solid fa-graduation-cap"></i>
                {t('blessBackInsight')}
              </h3>
              <p className="text-amber-700 text-sm leading-relaxed">
                {t('insightText')}
              </p>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8" id="recipes-section">
            {translating && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 animate-pulse">
                <i className="fa-solid fa-language fa-bounce"></i>
                <span className="font-medium">{t('translatingUnits')}</span>
              </div>
            )}
            {recipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-400 text-center px-4">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-4xl mb-6 opacity-50">
                  <i className="fa-solid fa-kitchen-set"></i>
                </div>
                <h2 className="text-2xl font-bold text-slate-600 mb-2">{t('readyToCreate')}</h2>
                <p className="max-w-md mx-auto">{t('uploadPrompt')}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {recipes.map(recipe => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    isSaved={savedRecipes.some(r => r.id === recipe.id)}
                    onToggleSave={() => toggleSaveRecipe(recipe)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Inventory Modal */}
      {isInventoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <i className="fa-solid fa-boxes-stacked text-emerald-600"></i>
                {t('inventoryManager')}
              </h2>
              <button onClick={() => setIsInventoryOpen(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <IngredientInput onIngredientsUpdate={addIngredients} isLoading={loading} />
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <h3 className="text-lg font-bold mb-4 text-slate-800">{t('currentInventory')}</h3>
                 <div className="flex flex-col gap-2">
                   {ingredients.length === 0 ? (
                     <p className="text-slate-400 text-sm italic text-center py-4">{t('noItemsAdded')}</p>
                   ) : (
                     ingredients.map(item => (
                       <div key={item.id} className="bg-emerald-50 text-emerald-800 px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between border border-emerald-100 animate-popIn">
                         <span className="flex-1 truncate mr-2 font-bold" title={item.name}>{item.name}</span>
                         <div className="flex items-center gap-3">
                           <input 
                             type="text" 
                             value={item.quantity} 
                             onChange={(e) => updateQuantity(item.id, e.target.value)}
                             className="w-20 px-2 py-1.5 text-sm border border-emerald-200 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                             placeholder={t('quantity')}
                           />
                           <button onClick={() => removeIngredient(item.id)} className="text-emerald-600 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-100">
                             <i className="fa-solid fa-trash-can"></i>
                           </button>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
              </div>
            </div>
            
            <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setIsInventoryOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                {t('done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Recipes Modal */}
      {isSavedRecipesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <i className="fa-solid fa-heart text-rose-500"></i>
                {t('mySavedRecipes')}
              </h2>
              <button onClick={() => setIsSavedRecipesOpen(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100">
              {savedRecipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
                  <i className="fa-regular fa-heart text-6xl mb-4 opacity-30"></i>
                  <p className="text-lg font-medium">{t('noSavedRecipes')}</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {savedRecipes.map(recipe => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe} 
                      isSaved={true}
                      onToggleSave={() => toggleSaveRecipe(recipe)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setIsSavedRecipesOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Floating Bar */}
      {ingredients.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-8 z-40 animate-bounce-subtle">
           <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-widest">{t('selected')}</span>
              <span className="text-sm font-bold">{selectedIngredientIds.length} {t('ingredients')}</span>
           </div>
           <div className="h-8 w-px bg-white/20"></div>
           <button 
             onClick={() => setSelectedIngredientIds([])}
             className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
           >
             {t('deselectAll')}
           </button>
           <button 
             onClick={handleGenerate}
             disabled={loading || selectedIngredientIds.length === 0}
             className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
           >
             {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : t('generate')}
           </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-popIn {
          animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -8px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
