import React, { useState } from 'react';
import { Recipe } from './types';
import { useLanguage } from './LanguageContext';

interface Props {
  recipe: Recipe;
  onToggleSave?: () => void;
  isSaved?: boolean;
}

const RecipeCard: React.FC<Props> = ({ recipe, onToggleSave, isSaved }) => {
  const { t } = useLanguage();
  const [scale, setScale] = useState(1);
  const scales = [1, 5, 10, 25, 50, 100];

  const parseAmount = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? amount : (num * scale).toFixed(1).replace(/\.0$/, '');
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden mb-8 animate-fadeIn">
      {/* Marketing Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white relative">
        {onToggleSave && (
          <button 
            onClick={onToggleSave}
            className={`absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isSaved 
                ? 'bg-white text-rose-500 shadow-md scale-110' 
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
            }`}
            title={isSaved ? t('unsaveRecipe') : t('saveRecipe')}
          >
            <i className={`fa-heart text-lg ${isSaved ? 'fa-solid' : 'fa-regular'}`}></i>
          </button>
        )}
        <div className="flex justify-between items-start pr-12">
          <div>
            <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">
              {t('businessStrategy')}
            </span>
            <h1 className="text-3xl font-bold mb-2">{recipe.marketingName}</h1>
            <p className="text-emerald-50 italic text-lg">"{recipe.marketingBlurb}"</p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-200 mb-1">{t('scale')}</span>
              <select
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="bg-transparent text-2xl font-bold outline-none cursor-pointer border-b border-white/40"
              >
                {scales.map(s => (
                  <option key={s} value={s} className="text-slate-900">{s}x {t('portions')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex gap-6 mt-6">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-clock opacity-70"></i>
            <span>{recipe.prepTime} {t('prep')}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-fire-burner opacity-70"></i>
            <span>{recipe.cookTime} {t('cook')}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-gauge-high opacity-70"></i>
            <span>{recipe.difficulty}</span>
          </div>
        </div>
      </div>

      <div className="p-8 grid md:grid-cols-3 gap-8">
        {/* Ingredients Column */}
        <div className="md:col-span-1">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
            <i className="fa-solid fa-list-check text-emerald-600"></i>
            {t('ingredients')} ({recipe.servings * scale} {t('servings')})
          </h3>
          <ul className="space-y-3">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-700 font-medium">{ing.name}</span>
                <span className="text-emerald-700 font-bold">
                  {parseAmount(ing.amount)} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
          
          {recipe.scalingNotes && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="text-blue-800 font-bold text-sm mb-1 uppercase tracking-wider flex items-center gap-1">
                <i className="fa-solid fa-circle-info"></i> {t('batchNote')}
              </h4>
              <p className="text-sm text-blue-700">{recipe.scalingNotes}</p>
            </div>
          )}
        </div>

        {/* Instructions Column */}
        <div className="md:col-span-2">
          <h3 className="text-xl font-bold mb-4 text-slate-800">{t('prepSteps')}</h3>
          <div className="space-y-6">
            {recipe.instructions.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <p className="text-slate-600 leading-relaxed pt-1">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 text-slate-800">{t('chefTips')}</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recipe.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-600 text-sm italic">
                  <i className="fa-solid fa-star text-amber-400 mt-1"></i>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Nutritional Info */}
        <div className="md:col-span-3 mt-4 pt-6 border-t border-slate-100">
          <h3 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-leaf text-emerald-600"></i>
            {t('nutritionalInfo')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{t('calories')}</span>
              <span className="text-2xl font-bold text-slate-800">{recipe.nutritionalInfo?.calories || 0}</span>
              <span className="text-sm text-slate-500 ml-1">{t('kcal')}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{t('protein')}</span>
              <span className="text-2xl font-bold text-slate-800">{recipe.nutritionalInfo?.protein || 0}</span>
              <span className="text-sm text-slate-500 ml-1">{t('g')}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{t('carbs')}</span>
              <span className="text-2xl font-bold text-slate-800">{recipe.nutritionalInfo?.carbohydrates || 0}</span>
              <span className="text-sm text-slate-500 ml-1">{t('g')}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{t('fats')}</span>
              <span className="text-2xl font-bold text-slate-800">{recipe.nutritionalInfo?.fats || 0}</span>
              <span className="text-sm text-slate-500 ml-1">{t('g')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
