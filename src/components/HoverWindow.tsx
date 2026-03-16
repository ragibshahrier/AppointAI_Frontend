import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Doctor } from '../services/api';
import { Stethoscope, MapPin, Star, Clock } from 'lucide-react';

interface HoverWindowProps {
  doctors: Doctor[];
  liveTranscript: string;
  onClose: () => void;
  onSelect: (doctor: Doctor) => void;
  language: 'en' | 'bn';
}

export function HoverWindow({ doctors, liveTranscript, onClose, onSelect, language }: HoverWindowProps) {
  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(null);

  // The "Glowing Sync" Magic (Transcript Matching)
  useEffect(() => {
    if (!liveTranscript) return; // Don't clear if transcript is empty

    const lowerTranscript = liveTranscript.toLowerCase();
    
    // Find if any doctor's name is in the transcript
    for (const doctor of doctors) {
      // Extract last name for better matching, e.g., "Dr. Jenkins" -> "jenkins"
      const nameParts = doctor.name.toLowerCase().split(' ');
      const lastName = nameParts[nameParts.length - 1];
      const firstName = nameParts.length > 1 ? nameParts[1] : '';
      
      if (
        lowerTranscript.includes(doctor.name.toLowerCase()) || 
        lowerTranscript.includes(lastName) ||
        (firstName && lowerTranscript.includes(firstName))
      ) {
        setActiveDoctorId(doctor.id);
        break; // Stop at the first match to avoid flickering
      }
    }
  }, [liveTranscript, doctors]);

  // Only show top 2 doctors
  const displayDoctors = doctors.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-4xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {language === 'bn' ? 'প্রস্তাবিত বিশেষজ্ঞ' : 'Recommended Specialists'}
          </h2>
          <p className="text-slate-300">
            {language === 'bn' ? 'আপনার জন্য সেরা দুটি বিকল্প' : 'The top two options for your needs'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-h-[70vh] overflow-y-auto p-2">
          {displayDoctors.map((doctor) => {
            const isActive = activeDoctorId === doctor.id;
            
            return (
              <motion.div
                key={doctor.id}
                variants={{
                  idle: { 
                    scale: 1, 
                    boxShadow: '0px 0px 0px 0px rgba(16, 185, 129, 0)',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  active: { 
                    scale: 1.05, 
                    boxShadow: '0px 0px 30px 5px rgba(16, 185, 129, 0.4)',
                    borderColor: 'rgba(16, 185, 129, 0.8)'
                  }
                }}
                initial="idle"
                animate={isActive ? "active" : "idle"}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-slate-900 rounded-2xl p-6 border border-white/10 cursor-pointer relative overflow-hidden group"
                onClick={() => onSelect(doctor)}
              >
                {/* Active Indicator Background */}
                <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{doctor.name}</h3>
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                        <Stethoscope className="w-4 h-4" />
                        {doctor.specialty}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-white font-bold text-sm">{doctor.rating}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{doctor.clinicName}</p>
                        <p className="text-slate-400">{doctor.distance} away</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Next Available</p>
                        <p className="text-slate-400">{doctor.availableSlots[0]}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trade-off Highlight */}
                  <div className={`p-4 rounded-xl border transition-colors duration-300 ${isActive ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
                    <p className={`text-sm font-medium text-center ${isActive ? 'text-emerald-300' : 'text-slate-300'}`}>
                      "{doctor.tradeoff}"
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
