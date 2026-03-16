import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, Doctor } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Booking() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const doctor = location.state?.doctor as Doctor;

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="text-center p-8 max-w-md w-full">
          <CardTitle className="text-xl text-slate-900 mb-4">Doctor not found</CardTitle>
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Generate next 5 days
  const dates = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      full: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
    };
  });

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return;
    
    setIsBooking(true);
    try {
      await api.appointments.book(doctor.id, selectedDate, selectedTime);
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsBooking(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {user?.language === 'bn' ? 'বুকিং সফল হয়েছে!' : 'Booking Confirmed!'}
          </h2>
          <p className="text-slate-500 mb-8">
            {user?.language === 'bn' 
              ? 'আপনার অ্যাপয়েন্টমেন্ট সফলভাবে বুক করা হয়েছে। আপনি ড্যাশবোর্ডে এটি দেখতে পারেন।' 
              : 'Your appointment has been successfully booked. You can view it in your dashboard.'}
          </p>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="w-full h-14 text-lg"
          >
            {user?.language === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Go to Dashboard'}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white px-4 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          {user?.language === 'bn' ? 'অ্যাপয়েন্টমেন্ট বুক করুন' : 'Book Appointment'}
        </h1>
      </header>

      <main className="p-6 max-w-2xl mx-auto space-y-8">
        {/* Doctor Info */}
        <Card className="border-0 shadow-md shadow-slate-200/50 overflow-hidden">
          <div className="bg-emerald-600 h-24"></div>
          <CardContent className="px-6 pb-6 pt-0 relative">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-md border-4 border-white absolute -top-10 flex items-center justify-center text-3xl font-bold text-emerald-600">
              {doctor.name.charAt(4)}
            </div>
            <div className="mt-14">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{doctor.name}</h2>
              <p className="text-emerald-600 font-medium mb-4">{doctor.specialty}</p>
              
              <div className="space-y-3 text-slate-600">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <span>{doctor.clinicName} • {doctor.distance}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    ★ {doctor.rating}
                  </div>
                  <span className="text-slate-400">|</span>
                  <span>100+ Reviews</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Selection */}
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            {user?.language === 'bn' ? 'তারিখ নির্বাচন করুন' : 'Select Date'}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
            {dates.map(d => (
              <button
                key={d.full}
                onClick={() => setSelectedDate(d.full)}
                className={`flex-shrink-0 snap-start w-20 h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                  selectedDate === d.full 
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm' 
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200'
                }`}
              >
                <span className="text-sm font-medium mb-1">{d.day}</span>
                <span className="text-2xl font-bold">{d.date}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Time Selection */}
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            {user?.language === 'bn' ? 'সময় নির্বাচন করুন' : 'Select Time'}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {doctor.availableSlots.map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`h-12 rounded-xl border-2 font-medium transition-all ${
                  selectedTime === time 
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-md' 
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </section>

        {/* Confirm Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 pb-safe">
          <div className="max-w-2xl mx-auto">
            <Button 
              onClick={handleBook}
              disabled={!selectedDate || !selectedTime || isBooking}
              className="w-full h-16 text-lg shadow-xl shadow-emerald-200/50"
            >
              {isBooking ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                user?.language === 'bn' ? 'নিশ্চিত করুন' : 'Confirm Booking'
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
