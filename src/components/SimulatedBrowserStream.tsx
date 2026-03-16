import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MousePointer2 } from 'lucide-react';

interface SimulatedBrowserStreamProps {
  doctorName: string;
  hospital: string;
  onComplete: () => void;
}

export function SimulatedBrowserStream({ doctorName, hospital, onComplete }: SimulatedBrowserStreamProps) {
  const [cursorPos, setCursorPos] = useState({ x: 150, y: 300 });
  const [formState, setFormState] = useState({
    specialty: '',
    doctor: '',
    name: '',
    date: ''
  });
  const [isClicking, setIsClicking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const moveCursor = async (x: number, y: number, duration: number = 800) => {
      if (!isMounted) return;
      setCursorPos({ x, y });
      await wait(duration);
    };

    const click = async () => {
      if (!isMounted) return;
      setIsClicking(true);
      await wait(150);
      setIsClicking(false);
      await wait(200);
    };

    const typeText = async (field: keyof typeof formState, text: string) => {
      for (let i = 0; i <= text.length; i++) {
        if (!isMounted) return;
        setFormState(prev => ({ ...prev, [field]: text.slice(0, i) }));
        await wait(50 + Math.random() * 50);
      }
      await wait(300);
    };

    const runSimulation = async () => {
      await wait(1000);

      // Move to Specialty
      await moveCursor(100, 80);
      await click();
      await typeText('specialty', 'Cardiology');

      // Move to Doctor
      await moveCursor(100, 150);
      await click();
      await typeText('doctor', doctorName || 'Dr. Smith');

      // Move to Patient Name
      await moveCursor(100, 220);
      await click();
      await typeText('name', 'John Doe');

      // Move to Date
      await moveCursor(100, 290);
      await click();
      await typeText('date', '2026-03-20');

      // Move to Submit Button
      await moveCursor(150, 360);
      await click();

      if (!isMounted) return;
      setShowSuccess(true);
      await wait(2000);
      
      if (isMounted) {
        onComplete();
      }
    };

    runSimulation();

    return () => {
      isMounted = false;
    };
  }, [doctorName, onComplete]);

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden text-slate-800 font-sans text-sm select-none border border-slate-200">
      {/* Browser Chrome */}
      <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="ml-4 bg-white px-3 py-1 rounded text-xs text-slate-500 w-full max-w-[200px] truncate border border-slate-200">
          https://{hospital.toLowerCase().replace(/\s+/g, '')}.com/book
        </div>
      </div>

      {/* Page Content */}
      <div className="p-6 relative h-[400px]">
        {showSuccess ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Appointment Confirmed!</h2>
            <p className="text-slate-500 mt-2">Your booking has been secured.</p>
          </div>
        ) : (
          <div className="max-w-sm mx-auto">
            <h2 className="text-xl font-bold text-blue-600 mb-6">{hospital} Portal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Specialty</label>
                <div className={`w-full border rounded px-3 py-2 bg-slate-50 min-h-[38px] ${formState.specialty ? 'text-slate-800' : 'text-slate-400'}`}>
                  {formState.specialty || 'Select specialty...'}
                  <span className="animate-pulse inline-block ml-1 w-0.5 h-4 bg-blue-500 align-middle" style={{ opacity: formState.specialty ? 1 : 0 }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Doctor</label>
                <div className={`w-full border rounded px-3 py-2 bg-slate-50 min-h-[38px] ${formState.doctor ? 'text-slate-800' : 'text-slate-400'}`}>
                  {formState.doctor || 'Select doctor...'}
                  <span className="animate-pulse inline-block ml-1 w-0.5 h-4 bg-blue-500 align-middle" style={{ opacity: formState.doctor ? 1 : 0 }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Patient Name</label>
                <div className={`w-full border rounded px-3 py-2 bg-slate-50 min-h-[38px] ${formState.name ? 'text-slate-800' : 'text-slate-400'}`}>
                  {formState.name || 'Enter full name'}
                  <span className="animate-pulse inline-block ml-1 w-0.5 h-4 bg-blue-500 align-middle" style={{ opacity: formState.name ? 1 : 0 }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Date</label>
                <div className={`w-full border rounded px-3 py-2 bg-slate-50 min-h-[38px] ${formState.date ? 'text-slate-800' : 'text-slate-400'}`}>
                  {formState.date || 'YYYY-MM-DD'}
                  <span className="animate-pulse inline-block ml-1 w-0.5 h-4 bg-blue-500 align-middle" style={{ opacity: formState.date ? 1 : 0 }} />
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded hover:bg-blue-700 transition-colors mt-2">
                Confirm Booking
              </button>
            </div>
          </div>
        )}

        {/* Ghost Cursor */}
        {!showSuccess && (
          <motion.div
            className="absolute z-50 pointer-events-none"
            animate={{ 
              x: cursorPos.x, 
              y: cursorPos.y,
              scale: isClicking ? 0.8 : 1
            }}
            transition={{ 
              type: "spring", 
              stiffness: 150, 
              damping: 20,
              mass: 0.5
            }}
          >
            <div className="relative">
              <MousePointer2 className="w-6 h-6 text-red-500 fill-red-500/20 drop-shadow-md" />
              {isClicking && (
                <div className="absolute top-0 left-0 w-6 h-6 bg-red-400/40 rounded-full animate-ping" />
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Overlay to simulate video stream look */}
      <div className="absolute inset-0 pointer-events-none border-[4px] border-red-500/20 mix-blend-overlay" />
      <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
        <div className="w-1.5 h-1.5 bg-white rounded-full" />
        Live
      </div>
    </div>
  );
}
