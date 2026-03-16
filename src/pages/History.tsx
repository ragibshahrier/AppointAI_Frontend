import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, SymptomLog, CommunicationThread, Appointment } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { ArrowLeft, FileText, MessageSquare, User as UserIcon } from 'lucide-react';

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [threads, setThreads] = useState<CommunicationThread[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const [logsData, threadsData, aptData] = await Promise.all([
          api.history.getSymptomLogs(),
          api.history.getCommunicationThreads(),
          api.appointments.get()
        ]);
        setSymptomLogs(logsData);
        setThreads(threadsData);
        setPastAppointments(aptData.filter(a => a.status === 'past'));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans text-slate-800">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-slate-900">
          {user?.language === 'bn' ? 'ইতিহাস' : 'History & Profile'}
        </h1>
      </header>

      <main className="px-6 py-8 space-y-10">
        {/* Symptom Logs */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            {user?.language === 'bn' ? 'লক্ষণ লগ' : 'Symptom Logs'}
          </h2>
          
          {isLoading ? (
            <div className="animate-pulse h-24 bg-slate-200 rounded-2xl"></div>
          ) : symptomLogs.length > 0 ? (
            <div className="space-y-4">
              {symptomLogs.map(log => (
                <Card key={log.id} className="border-0 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2 flex-wrap">
                        {log.symptoms.map((sym, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                            {sym}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{log.date}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{log.notes}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Severity:</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        log.severity === 'high' ? 'bg-red-100 text-red-700' :
                        log.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {log.severity}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
             <p className="text-slate-500 text-sm">No symptom logs found.</p>
          )}
        </section>

        {/* Communication Threads */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            {user?.language === 'bn' ? 'যোগাযোগের থ্রেড' : 'Communication Threads'}
          </h2>
          
          {isLoading ? (
            <div className="animate-pulse h-24 bg-slate-200 rounded-2xl"></div>
          ) : threads.length > 0 ? (
            <div className="space-y-4">
              {threads.map(thread => (
                <Card key={thread.id} className="border-0 shadow-sm bg-indigo-50/50 rounded-2xl overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-slate-800 text-sm">AI Consultation</h3>
                      <span className="text-xs text-slate-400">{thread.date}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{thread.summary}</p>
                    <div className="text-xs font-medium text-indigo-700 bg-indigo-100/50 p-2 rounded-xl">
                      Outcome: {thread.outcome}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No communication threads found.</p>
          )}
        </section>

        {/* Past Appointments */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-slate-400" />
            {user?.language === 'bn' ? 'পূর্ববর্তী অ্যাপয়েন্টমেন্ট' : 'Past Appointments'}
          </h2>
          
          {isLoading ? (
             <div className="animate-pulse h-24 bg-slate-200 rounded-2xl"></div>
          ) : pastAppointments.length > 0 ? (
            <div className="space-y-4 opacity-75">
              {pastAppointments.map(apt => (
                <Card key={apt.id} className="border-0 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-5 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-900">{apt.doctorName}</h3>
                      <p className="text-sm text-slate-500">{apt.specialty}</p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p>{apt.date}</p>
                      <p>{apt.time}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No past appointments found.</p>
          )}
        </section>
      </main>
    </div>
  );
}
