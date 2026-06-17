import React from 'react'
import { Phone } from 'lucide-react'

const emergencyContacts = [
  {
    name: 'Ambulance',
    number: '108',
    description: 'For immediate medical emergencies and trauma care'
  },
  {
    name: 'Health Helpline',
    number: '104',
    description: 'For free medical advice and information on government schemes'
  },
  {
    name: 'Women Helpline',
    number: '1091',
    description: 'For safety, support, and protection services'
  },
  {
    name: 'Disaster Management',
    number: '1078',
    description: 'For natural disasters and civic emergencies assistance'
  },
  {
    name: 'NIMHANS Mental Health',
    number: '080-46110007',
    description: 'For free 24/7 mental health and psychological support helpline'
  }
]

export default function EmergencyNumbers() {
  return (
    <div className="w-full bg-gradient-to-br from-rose-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/80 border border-rose-100 dark:border-rose-950/40 rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md shadow-rose-500/20">
          <Phone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">🚨 Emergency Helplines</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Quick access to essential 24/7 toll-free helpline numbers in India.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {emergencyContacts.map((contact) => (
          <div
            key={contact.number}
            className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-rose-100/50 dark:border-slate-700/40 hover:border-rose-300 dark:hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0 mt-0.5">
              <Phone className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{contact.name}</span>
                <a
                  href={`tel:${contact.number}`}
                  className="inline-flex items-center justify-center font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/20 px-3 py-1 rounded-full text-sm border border-rose-200/30 dark:border-rose-900/30 hover:underline select-all transition-all duration-200"
                >
                  {contact.number}
                </a>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-normal">
                {contact.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
