import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, User, Activity, MapPin, Stethoscope } from 'lucide-react';

export interface AppointmentDetails {
  doctorName: string;
  hospital: string;
  patientName: string;
  age: string;
  gender: string;
  bloodType: string;
  symptoms: string;
  date: string;
  time: string;
}

interface AppointmentInfoWindowProps {
  details: AppointmentDetails;
  onConfirm: () => void;
  onCancel: () => void;
  language: 'en' | 'bn';
  onChange: (details: AppointmentDetails) => void;
}

export function AppointmentInfoWindow({ details, onConfirm, onCancel, language, onChange }: AppointmentInfoWindowProps) {
  const handleChange = (field: keyof AppointmentDetails, value: string) => {
    onChange({ ...details, [field]: value });
  };

  return (
    <div className="w-full h-full bg-white rounded-xl overflow-y-auto text-slate-800 font-sans text-sm border border-slate-200 shadow-inner p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          {language === 'bn' ? 'অ্যাপয়েন্টমেন্টের বিবরণ' : 'Appointment Details'}
        </h2>
        <p className="text-slate-500">
          {language === 'bn' ? 'অনুগ্রহ করে তথ্য যাচাই করুন' : 'Please verify the information below'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Stethoscope className="w-3 h-3" /> Doctor
            </label>
            <input 
              value={details.doctorName} 
              onChange={(e) => handleChange('doctorName', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all bg-slate-50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Hospital
            </label>
            <input 
              value={details.hospital} 
              onChange={(e) => handleChange('hospital', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all bg-slate-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Date
            </label>
            <input 
              type="date"
              value={details.date} 
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3" /> Time
            </label>
            <input 
              type="time"
              value={details.time} 
              onChange={(e) => handleChange('time', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-500" /> Patient Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Name</label>
              <input 
                value={details.patientName} 
                onChange={(e) => handleChange('patientName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Age</label>
                <input 
                  value={details.age} 
                  onChange={(e) => handleChange('age', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Gender</label>
                <input 
                  value={details.gender} 
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Blood</label>
                <input 
                  value={details.bloodType} 
                  onChange={(e) => handleChange('bloodType', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1 mt-4">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Activity className="w-3 h-3" /> Symptoms / Reason for Visit
            </label>
            <textarea 
              value={details.symptoms} 
              onChange={(e) => handleChange('symptoms', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button 
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
        >
          {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
        </button>
        <button 
          onClick={onConfirm}
          className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors shadow-md shadow-teal-600/20"
        >
          {language === 'bn' ? 'নিশ্চিত করুন' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  );
}
