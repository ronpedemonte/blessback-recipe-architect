
import React, { useState, useRef } from 'react';
import { analyzeIngredientsFromImage } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleAddText = () => {
    if (!inputValue.trim()) return;
    const newItems = inputValue.split(',').map(i => i.trim()).filter(i => i !== '');
    onIngredientsUpdate(newItems);
    setInputValue('');
  };

  const processFile = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Use a reader to get base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        try {
          const result = await analyzeIngredientsFromImage(base64, language);
          if (result.ingredients && result.ingredients.length > 0) {
            onIngredientsUpdate(result.ingredients);
            setAnalysisError(null);
          } else {
            setAnalysisError(t('noIngredientsIdentified'));
          }
        } catch (err: any) {
          setAnalysisError(err.message);
        } finally {
          setIsAnalyzing(false);
          setIsCapturing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setAnalysisError(t('failedToProcess'));
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const startCamera = async () => {
    setAnalysisError(null);
    setPreviewImage(null);
    
    // Check if secure context
    if (!window.isSecureContext) {
      setAnalysisError(t('cameraRequiresHttps'));
      fileInputRef.current?.click();
      return;
    }

    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1024 }, height: { ideal: 1024 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setIsCapturing(false);
      setAnalysisError(t('cameraRestricted'));
      // Auto-trigger fallback
      setTimeout(() => fileInputRef.current?.click(), 1000);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Downscale for mobile performance
        const width = 800;
        const height = (videoRef.current.videoHeight / videoRef.current.videoWidth) * width;
        
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        context.drawImage(videoRef.current, 0, 0, width, height);
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.7);
        setPreviewImage(dataUrl);
        const base64 = dataUrl.split(',')[1];
        
        setIsAnalyzing(true);
        try {
          const result = await analyzeIngredientsFromImage(base64, language);
          if (result.ingredients && result.ingredients.length > 0) {
            onIngredientsUpdate(result.ingredients);
            closeCamera();
          } else {
            setAnalysisError(t('couldNotSeeIngredients'));
            setIsAnalyzing(false);
          }
        } catch (err: any) {
          setAnalysisError(err.message);
          setIsAnalyzing(false);
        }
      }
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsCapturing(false);
    setIsAnalyzing(false);
    setPreviewImage(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('typeItems')}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            onKeyPress={(e) => e.key === 'Enter' && handleAddText()}
          />
          <button
            onClick={handleAddText}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold"
          >
            {t('add')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={startCamera}
            className="flex items-center justify-center gap-2 py-3 border-2 border-emerald-100 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-all font-medium"
          >
            <i className="fa-solid fa-camera"></i>
            {t('scan')}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 border-2 border-slate-100 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-medium"
          >
            <i className="fa-solid fa-upload"></i>
            {t('upload')}
          </button>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />

        {analysisError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
            <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
            <span>{analysisError}</span>
          </div>
        )}
      </div>

      {isCapturing && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold animate-pulse">{t('identifyingStock')}</p>
              </div>
            )}

            {!isAnalyzing && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8">
                <button onClick={closeCamera} className="w-12 h-12 rounded-full bg-white/20 text-white"><i className="fa-solid fa-xmark"></i></button>
                <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-slate-200 bg-emerald-600"></div></button>
                <div className="w-12"></div>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {isAnalyzing && !isCapturing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
           <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></div>
           <span className="text-emerald-800 font-bold text-sm">{t('processingImage')}</span>
        </div>
      )}
    </div>
  );
};

export default IngredientInput;

