import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, Appointment } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Calendar, Clock, MapPin, User as UserIcon, History, ChevronRight, Activity, Mic, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileToaster, setShowProfileToaster] = useState(false);
  const [showAppointmentToast, setShowAppointmentToast] = useState(false);
  const [profileData, setProfileData] = useState({
    age: '',
    gender: 'Male',
    bloodType: 'A+'
  });

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileData);
      setShowProfileToaster(false);
    } catch (error) {
      console.error('Failed to save profile', error);
      setShowProfileToaster(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const aptData = await api.appointments.get();
        setAppointments(aptData);
        if (aptData.filter(a => a.status === 'upcoming').length > 0) {
          setShowAppointmentToast(true);
          // Hide after 6 seconds
          setTimeout(() => {
            setShowAppointmentToast(false);
          }, 6000);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // Check if new user for profile completion toaster
    if (localStorage.getItem('isNewUser') === 'true') {
      setShowProfileToaster(true);
      localStorage.removeItem('isNewUser');
    }
  }, []);

  const upcoming = appointments.filter(a => a.status === 'upcoming');
  const nextAppointment = upcoming.length > 0 ? upcoming[0] : null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="relative min-h-screen pb-32 font-sans text-slate-800 flex flex-col overflow-hidden bg-white"
    >
      {/* 1. The Seamless "Circuit & Pulse" Pattern */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 60 h30 l15 -30 l30 60 l15 -30 h30' stroke='%2310b981' stroke-width='1.5' fill='none' opacity='0.2'/%3E%3Ccircle cx='30' cy='60' r='2.5' fill='%2310b981' opacity='0.3'/%3E%3Ccircle cx='90' cy='60' r='2.5' fill='%2310b981' opacity='0.3'/%3E%3Cpath d='M0 15 h120 M0 105 h120 M15 0 v120 M105 0 v120' stroke='%2310b981' stroke-width='0.5' fill='none' opacity='0.1'/%3E%3Cpath d='M60 0 v120 M0 60 h120' stroke='%2310b981' stroke-width='0.5' fill='none' opacity='0.05' stroke-dasharray='4 4'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px'
        }}
        animate={{
          backgroundPosition: ['0px 0px', '120px 120px'],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "linear"
        }}
      />

      {/* Navigation */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="relative z-10 px-6 pt-12 pb-6 flex justify-between items-center"
      >
        <button 
          onClick={() => navigate('/profile')} 
          className="p-3 bg-emerald-50/60 backdrop-blur-md border border-emerald-100/50 shadow-sm rounded-full text-emerald-700 hover:bg-emerald-100/60 transition-colors"
        >
          <UserIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={() => navigate('/history')} 
          className="p-3 bg-emerald-50/60 backdrop-blur-md border border-emerald-100/50 shadow-sm rounded-full text-emerald-700 hover:bg-emerald-100/60 transition-colors"
        >
          <History className="w-5 h-5" />
        </button>
      </motion.header>

      <main className="relative z-10 flex-1 px-6 flex flex-col justify-center items-center space-y-12">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, type: "spring", bounce: 0.4 }}
          className="w-full max-w-md space-y-6"
        >
          <h1 className="text-3xl font-semibold text-emerald-950 text-center">
            {user?.language === 'bn' ? 'শুভ সকাল,' : 'Good morning,'} <br />
            <span className="text-emerald-600">{user?.name}</span>
          </h1>
        </motion.div>

        {/* The Focus Area (Center) - Living Agent Orb */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6, type: "spring", bounce: 0.5 }}
          className="flex flex-col items-center justify-center w-full max-w-sm mx-auto mt-8"
        >
          <button
            onClick={() => navigate('/agent')}
            className="relative w-48 h-48 rounded-full flex items-center justify-center focus:outline-none group"
          >
            {/* Concentric Ripples */}
            <motion.div
              layoutId="ai-orb-glow-1"
              className="absolute inset-0 rounded-full bg-emerald-400/20"
              animate={{
                scale: [1, 2],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            <motion.div
              layoutId="ai-orb-glow-2"
              className="absolute inset-0 rounded-full bg-teal-500/20"
              animate={{
                scale: [1, 1.8],
                opacity: [0.8, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut",
                delay: 1,
              }}
            />
            <motion.div
              layoutId="ai-orb-glow-3"
              className="absolute inset-0 rounded-full bg-emerald-300/20"
              animate={{
                scale: [1, 1.6],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut",
                delay: 2,
              }}
            />
            
            {/* Inner Core */}
            <motion.div 
              layoutId="ai-orb-core"
              className="relative w-32 h-32 rounded-full shadow-[0_0_60px_rgba(16,185,129,0.5)] bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center border border-white/40 z-10 group-hover:scale-105 transition-transform duration-300"
            >
              <motion.div layoutId="ai-orb-icon">
                <Mic className="w-12 h-12 text-white drop-shadow-md" />
              </motion.div>
            </motion.div>
          </button>
          <p className="mt-12 text-emerald-800/60 font-medium tracking-wide">
            {user?.language === 'bn' ? 'কথা বলতে ট্যাপ করুন' : 'Tap to speak'}
          </p>
        </motion.div>
      </main>

      {/* Disappearing Appointment Toast */}
      <AnimatePresence>
        {showAppointmentToast && nextAppointment && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className="fixed bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none"
          >
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md pointer-events-auto">
              <div className="p-4 flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="bg-emerald-500/20 p-3 rounded-xl h-fit">
                    <Calendar className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{nextAppointment.doctorName}</h4>
                    <p className="text-emerald-400 text-sm font-medium mb-2">{nextAppointment.specialty}</p>
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {nextAppointment.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {nextAppointment.clinicName}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAppointmentToast(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Progress Bar */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 6, ease: "linear" }}
                className="h-1 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Basic Info Setup Modal (Pop-up after signup) */}
      <AnimatePresence>
        {showProfileToaster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 bg-emerald-50 border-b border-emerald-100">
                <h3 className="text-xl font-bold text-emerald-950">Basic Information</h3>
                <p className="text-sm text-emerald-700 mt-1">Please complete your profile for better AI assistance.</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 30" 
                    value={profileData.age}
                    onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select 
                    value={profileData.gender}
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Blood Type</label>
                  <select 
                    value={profileData.bloodType}
                    onChange={(e) => setProfileData({ ...profileData, bloodType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white"
                  >
                    <option>A+</option><option>A-</option>
                    <option>B+</option><option>B-</option>
                    <option>O+</option><option>O-</option>
                    <option>AB+</option><option>AB-</option>
                  </select>
                </div>
                <button 
                  onClick={handleSaveProfile}
                  className="w-full mt-4 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20"
                >
                  Save & Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
