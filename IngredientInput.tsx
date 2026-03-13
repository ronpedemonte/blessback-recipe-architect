import React, { useState, useRef } from 'react';
import { analyzeIngredientsFromImage } from './geminiService';
import { useLanguage } from './LanguageContext';

interface Props {
  onIngredientsUpdate: (ingredients: string[]) => void;
  isLoading: boolean;
}

const IngredientInput: React.FC<Props> = ({ onIngredientsUpdate, isLoading }) => {
  const { t, language } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddText = () => {
    if (!inputValue.trim()) return;
    const newItems = inputValue.split(',').map(i => i.trim()).filter(i => i !== '');
    onIngredientsUpdate(newItems);
    setInputValue('');
  };

  const processFile = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      try {
        const result = await analyzeIngredientsFromImage(base64, language);
        if (result.ingredients && result.ingredients.length > 0) {
          onIngredientsUpdate(result.ingredients);
        } else {
          setAnalysisError(t('noIngredientsIdentified'));
        }
      } catch (err: any) {
        setAnalysisError(err.message);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setIsCapturing(false);
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
        
        setIsAnalyzing(true);
        try {
          const result = await analyzeIngredientsFromImage(base64, language);
          if (result.ingredients && result.ingredients.length > 0) {
            onIngredientsUpdate(result.ingredients);
            stopCamera();
          }
        } catch (err: any) {
          setAnalysisError(err.message);
        } finally {
          setIsAnalyzing(false);
        }
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsCapturing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t('typeItems')}
          className="flex-1 px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button onClick={handleAddText} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">
          {t('add')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={startCamera} className="py-2 border-2 border-emerald-100 rounded-lg text-emerald-700 font-medium">
          <i className="fa-solid fa-camera mr-2"></i>{t('scan')}
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="py-2 border-2 border-slate-100 rounded-lg text-slate-600 font-medium">
          <i className="fa-solid fa-upload mr-2"></i>{t('upload')}
        </button>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />

      {isCapturing && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full max-w-md h-auto" />
          <div className="flex gap-4 mt-4">
            <button onClick={stopCamera} className="bg-white/20 text-white px-6 py-2 rounded-full">Cancel</button>
            <button onClick={capturePhoto} className="bg-white text-emerald-600 px-6 py-2 rounded-full font-bold">Capture</button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default IngredientInput;
