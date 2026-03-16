import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ArrowLeft, User as UserIcon, Activity, FileText, Settings, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { user, logout, setLanguage } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [age, setAge] = useState(user?.profile?.age || '32');
  const [gender, setGender] = useState(user?.profile?.gender || 'Male');
  const [bloodType, setBloodType] = useState(user?.profile?.bloodType || 'O+');
  const [emergencyContact, setEmergencyContact] = useState(user?.profile?.emergencyContact || '+1 (555) 123-4567');
  const [activeSymptoms, setActiveSymptoms] = useState('None');
  const [allergies, setAllergies] = useState(user?.profile?.allergies || 'Penicillin');
  const [chronicConditions, setChronicConditions] = useState(user?.profile?.chronicConditions || 'Asthma');
  const [medications, setMedications] = useState('Albuterol Inhaler');
  const [radius, setRadius] = useState('10 km');
  const [isSaving, setIsSaving] = useState(false);

  const { updateProfile } = useAuth();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        age,
        gender,
        bloodType,
        emergencyContact,
        allergies,
        chronicConditions
      });
      // Optionally show a success toast here
    } catch (error) {
      console.error('Failed to save profile', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-800"
    >
      <header className="px-6 pt-12 pb-6 flex items-center justify-between bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-slate-900">
            {user?.language === 'bn' ? 'প্রোফাইল' : 'Patient Profile'}
          </h1>
        </div>
        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-2xl mx-auto">
        {/* Basic Details */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-teal-500" />
            {user?.language === 'bn' ? 'প্রাথমিক বিবরণ' : 'Basic Details'}
          </h2>
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                <Input value={user?.name || ''} readOnly className="bg-slate-50 border-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Age</label>
                  <Input value={age} onChange={(e) => setAge(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</label>
                  <Input value={gender} onChange={(e) => setGender(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Blood Type</label>
                  <Input value={bloodType} onChange={(e) => setBloodType(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Emergency Contact</label>
                  <Input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Current Health State */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500" />
            {user?.language === 'bn' ? 'বর্তমান স্বাস্থ্য অবস্থা' : 'Current Health State'}
          </h2>
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Symptoms</label>
                <Input value={activeSymptoms} onChange={(e) => setActiveSymptoms(e.target.value)} placeholder="E.g., Mild headache, fatigue" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Medical History */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            {user?.language === 'bn' ? 'চিকিৎসা ইতিহাস' : 'Medical History'}
          </h2>
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Known Allergies</label>
                <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chronic Conditions</label>
                <Input value={chronicConditions} onChange={(e) => setChronicConditions(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ongoing Medications</label>
                <Input value={medications} onChange={(e) => setMedications(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Preferences */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            {user?.language === 'bn' ? 'পছন্দসমূহ' : 'Preferences'}
          </h2>
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preferred Language</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="lang" 
                      value="en" 
                      checked={user?.language === 'en'} 
                      onChange={() => setLanguage('en')} 
                      className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                    />
                    <span>English</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="lang" 
                      value="bn" 
                      checked={user?.language === 'bn'} 
                      onChange={() => setLanguage('bn')} 
                      className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                    />
                    <span>বাংলা</span>
                  </label>
                </div>
              </div>
              <div className="space-y-1 pt-4">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preferred Hospital Radius</label>
                <Input value={radius} onChange={(e) => setRadius(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </section>

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 rounded-xl"
        >
          {isSaving ? 'Saving...' : (user?.language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Profile')}
        </Button>
      </main>
    </motion.div>
  );
}
