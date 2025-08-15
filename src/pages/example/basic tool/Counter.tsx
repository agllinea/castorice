import { Minus, Plus, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

const Counter: React.FC = () => {
    const [count, setCount] = useState<number>(0);
    const [step, setStep] = useState<number>(1);

    const increment = () => setCount(prev => prev + step);
    const decrement = () => setCount(prev => prev - step);
    const reset = () => setCount(0);

    return (
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Interactive Counter</h2>
                <p className="text-gray-600">A simple counter tool with customizable step size</p>
            </div>

            {/* Counter Display */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full border-4 border-blue-200">
                    <span className="text-4xl font-bold text-blue-700">{count}</span>
                </div>
            </div>

            {/* Step Size Control */}
            <div className="mb-6">
                <label htmlFor="step-input" className="block text-sm font-medium text-gray-700 mb-2">
                    Step Size
                </label>
                <input
                    id="step-input"
                    type="number"
                    min="1"
                    value={step}
                    onChange={(e) => setStep(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter step size"
                />
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3 mb-4">
                <button
                    onClick={decrement}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                    <Minus className="w-5 h-5" />
                    Decrease
                </button>
                
                <button
                    onClick={increment}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <Plus className="w-5 h-5" />
                    Increase
                </button>
            </div>

            {/* Reset Button */}
            <button
                onClick={reset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
                <RotateCcw className="w-4 h-4" />
                Reset
            </button>

            {/* Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                    Current value: <span className="font-medium text-gray-800">{count}</span>
                    <br />
                    Step size: <span className="font-medium text-gray-800">{step}</span>
                </p>
            </div>
        </div>
    );
};

export default Counter;