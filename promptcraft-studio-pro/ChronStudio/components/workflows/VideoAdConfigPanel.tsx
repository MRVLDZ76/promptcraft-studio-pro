import React, { useState } from 'react';
import { MegaphoneIcon, ArrowRightIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { ProjectData, ContentProcessingMode } from '../../types';
import { VideoAdConfig } from '../../services/workflowService';
import ContentProcessingModeSelector from '../ContentProcessingModeSelector';

interface Props {
  projectData: ProjectData;
  updateProject: (data: Partial<ProjectData>) => void;
  onNext: () => void;
}

const VideoAdConfigPanel: React.FC<Props> = ({ projectData, updateProject, onNext }) => {
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [tagline, setTagline] = useState('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [duration, setDuration] = useState(30);
  const [cta, setCta] = useState('Learn More');
  const [productImage, setProductImage] = useState<string>('');
  const [backgroundImage, setBackgroundImage] = useState<string>('');

  const ctaOptions = [
    'Learn More', 'Shop Now', 'Get Started', 'Try Free', 
    'Download Now', 'Sign Up', 'Buy Now', 'Contact Us'
  ];

  const handleAddFeature = () => {
    if (features.length < 5) {
      setFeatures([...features, '']);
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const handleContinue = () => {
    if (!productName.trim()) {
      alert('Please enter a product name');
      return;
    }

    const config: VideoAdConfig = {
      product_name: productName.trim(),
      brand: brand.trim() || undefined,
      tagline: tagline.trim() || undefined,
      features: features.filter(f => f.trim()),
      duration,
      cta: cta.trim(),
      productImageUrl: productImage || undefined,
      backgroundImageUrl: backgroundImage || undefined,
    };

    // Generate content structure manually for VIDEO_ADS
    const contentParts = [
      `Opening Hook:\n${tagline || `Introducing ${productName}`}`,
      `Product Showcase:\n${productName}${brand ? ` by ${brand}` : ''}`,
    ];

    features.filter(f => f.trim()).forEach((feature, idx) => {
      contentParts.push(`Feature ${idx + 1}:\n${feature}`);
    });

    contentParts.push(`Call to Action:\n${cta}`);

    const content = contentParts.join('\n\n---\n\n');
    const title = `Video Ad: ${productName}`;

    updateProject({
      title,
      content,
      workflow_config: config,
    });

    onNext();
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center space-x-4 pb-6 border-b border-neutral-200 dark:border-zinc-800">
        <div className="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 flex items-center justify-center">
          <MegaphoneIcon className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Video Ad Creator</h2>
          <p className="text-sm text-neutral-600 dark:text-zinc-400">Create promotional videos with product showcase and CTA</p>
        </div>
      </div>

      {/* Product Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="e.g., SmartWatch Pro, EcoBottle, Premium Coffee"
          className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Brand Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          Brand Name (Optional)
        </label>
        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="e.g., TechCo, GreenLife, Artisan"
          className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Tagline */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          Tagline / Hook (Optional)
        </label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g., Innovation Meets Style, Sustainability Made Simple"
          className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Content Processing Mode */}
      <ContentProcessingModeSelector
        mode={projectData.processingMode || ContentProcessingMode.CREATIVE}
        onChange={(mode) => updateProject({ processingMode: mode })}
        onReimagineParamsChange={(params) => updateProject({ reimagineParams: params })}
        reimagineParams={projectData.reimagineParams}
      />

      {/* Product Image Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          Product Image (Optional)
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={productImage}
            onChange={(e) => setProductImage(e.target.value)}
            placeholder="Paste image URL or upload"
            className="flex-1 px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <label className="px-4 py-3 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors flex items-center space-x-2">
            <PhotoIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Upload</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setProductImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </div>
        {productImage && (
          <div className="mt-2">
            <img src={productImage} alt="Product preview" className="w-32 h-32 object-cover rounded-lg border-2 border-orange-500" />
          </div>
        )}
      </div>

      {/* Background/Style Image Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          Background / Style Reference (Optional)
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={backgroundImage}
            onChange={(e) => setBackgroundImage(e.target.value)}
            placeholder="Paste background image URL or upload"
            className="flex-1 px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <label className="px-4 py-3 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors flex items-center space-x-2">
            <PhotoIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Upload</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setBackgroundImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </div>
        {backgroundImage && (
          <div className="mt-2">
            <img src={backgroundImage} alt="Background preview" className="w-full h-24 object-cover rounded-lg border-2 border-orange-500" />
          </div>
        )}
        <p className="text-xs text-neutral-500 dark:text-zinc-500">Upload a background or style reference image to guide the visual aesthetic</p>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
            Key Features
          </label>
          <button
            onClick={handleAddFeature}
            disabled={features.length >= 5}
            className="text-sm text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Feature
          </button>
        </div>
        <div className="space-y-2">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureChange(idx, e.target.value)}
                placeholder={`Feature ${idx + 1}`}
                className="flex-1 px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {features.length > 1 && (
                <button
                  onClick={() => handleRemoveFeature(idx)}
                  className="px-3 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          Video Duration: {duration} seconds
        </label>
        <input
          type="range"
          min="15"
          max="60"
          step="5"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-neutral-500 dark:text-zinc-500">
          <span>Quick (15s)</span>
          <span>Standard (30s)</span>
          <span>Extended (60s)</span>
        </div>
      </div>

      {/* Call to Action */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          Call to Action
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ctaOptions.map((option) => (
            <button
              key={option}
              onClick={() => setCta(option)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                cta === option
                  ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-2 border-orange-500'
                  : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 border-2 border-transparent hover:border-neutral-300 dark:hover:border-zinc-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={cta}
          onChange={(e) => setCta(e.target.value)}
          placeholder="Custom CTA"
          className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Preview */}
      {productName && (
        <div className="p-6 rounded-xl bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 space-y-3">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-zinc-300">Ad Preview</h3>
          <div className="space-y-2 text-sm">
            <div className="p-3 rounded bg-white dark:bg-zinc-800">
              <span className="font-medium text-orange-600 dark:text-orange-400">Opening:</span>
              <p className="text-neutral-700 dark:text-zinc-300 mt-1">
                {tagline || `Introducing ${productName}`}
              </p>
            </div>
            <div className="p-3 rounded bg-white dark:bg-zinc-800">
              <span className="font-medium text-orange-600 dark:text-orange-400">Product:</span>
              <p className="text-neutral-700 dark:text-zinc-300 mt-1">
                {productName}{brand ? ` by ${brand}` : ''}
              </p>
            </div>
            {features.filter(f => f.trim()).map((feature, idx) => (
              <div key={idx} className="p-3 rounded bg-white dark:bg-zinc-800">
                <span className="font-medium text-orange-600 dark:text-orange-400">Feature {idx + 1}:</span>
                <p className="text-neutral-700 dark:text-zinc-300 mt-1">{feature}</p>
              </div>
            ))}
            <div className="p-3 rounded bg-white dark:bg-zinc-800">
              <span className="font-medium text-orange-600 dark:text-orange-400">CTA:</span>
              <p className="text-neutral-700 dark:text-zinc-300 mt-1">{cta}</p>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!productName.trim()}
        className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-neutral-300 dark:disabled:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
      >
        <span>Continue with This Ad</span>
        <ArrowRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default VideoAdConfigPanel;
