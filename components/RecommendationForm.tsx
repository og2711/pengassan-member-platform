'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function RecommendationForm() {
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message.trim() || !name.trim()) return
    setStatus('loading')

    const { error } = await supabase.from('recommendations').insert({
      name: name.trim(),
      department: department.trim() || null,
      message: message.trim(),
    })

    if (error) {
      setStatus('error')
    } else {
      setStatus('success')
      setName('')
      setDepartment('')
      setMessage('')
    }
  }

  return (
    <section className="mt-16 border-t border-gray-200 pt-10">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Submit a Recommendation</h2>
        <p className="text-sm text-gray-500 mb-6">
          Have a suggestion or concern? Submit it below. The executive team will review all submissions.
        </p>

        {status === 'success' ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <svg className="w-10 h-10 text-green-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold text-green-800">Recommendation submitted!</p>
            <p className="text-sm text-green-600 mt-1">Thank you. The executive team will review it shortly.</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-4 text-sm text-green-700 underline hover:no-underline"
            >
              Submit another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Department / Unit</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">Select department…</option>
                  <option value="DSSRI">DSSRI</option>
                  <option value="HPPITI">HPPITI</option>
                  <option value="MDGIF">MDGIF</option>
                  <option value="HSSC">HSSC</option>
                  <option value="CS&A">CS&A</option>
                  <option value="ESRP">ESRP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Recommendation *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                placeholder="Share your recommendation or concern in detail..."
                required
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors disabled:opacity-60"
              >
                {status === 'loading' ? 'Submitting...' : 'Submit Recommendation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
