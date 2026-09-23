import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { apiRequest } from './api'

type Branch = {
  id: string
  code?: string
  branch_code?: string
  name: string
}

type JambRegistration = {
  id: string
  candidate_id: string
  first_name: string
  last_name: string
  other_name?: string | null
  phone_number: string
  email?: string | null
  exam_year: number
  registration_type: string
  preferred_course?: string | null
  first_choice_institution?: string | null
  branch_id?: string | null
  branch_name?: string | null
  status: string
  payment_status: string
  amount: string | number
  payment_reference?: string | null
  created_at: string
}

type FormState = {
  firstName: string
  lastName: string
  otherName: string
  phoneNumber: string
  email: string
  dateOfBirth: string
  gender: string
  stateOfOrigin: string
  lga: string
  ninLast4: string
  examYear: string
  registrationType: string
  preferredCourse: string
  firstChoiceInstitution: string
  secondChoiceInstitution: string
  thirdChoiceInstitution: string
  branchId: string
  amount: string
  paymentReference: string
  notes: string
}

const initialForm: FormState = {
  firstName: '',
  lastName: '',
  otherName: '',
  phoneNumber: '',
  email: '',
  dateOfBirth: '',
  gender: '',
  stateOfOrigin: '',
  lga: '',
  ninLast4: '',
  examYear: String(new Date().getFullYear()),
  registrationType: 'UTME',
  preferredCourse: '',
  firstChoiceInstitution: '',
  secondChoiceInstitution: '',
  thirdChoiceInstitution: '',
  branchId: '',
  amount: '',
  paymentReference: '',
  notes: '',
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100'

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700'

export default function JambRegistration() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [branches, setBranches] = useState<Branch[]>([])
  const [registrations, setRegistrations] = useState<JambRegistration[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const loadBranches = async () => {
    try {
      const data = await apiRequest<Branch[]>('/branches')
      setBranches(data)
    } catch {
      setBranches([])
    }
  }

  const loadRegistrations = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()

      if (statusFilter) params.set('status', statusFilter)
      if (yearFilter) params.set('examYear', yearFilter)

      const query = params.toString()
      const data = await apiRequest<JambRegistration[]>(
        `/jamb/registrations${query ? `?${query}` : ''}`,
      )

      setRegistrations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load JAMB registrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBranches()
  }, [])

  useEffect(() => {
    void loadRegistrations()
  }, [statusFilter, yearFilter])

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    if (form.ninLast4 && !/^\d{4}$/.test(form.ninLast4)) {
      setError('NIN must contain exactly the last 4 digits.')
      setSaving(false)
      return
    }

    try {
      const data = await apiRequest<{
        registration: JambRegistration
      }>('/jamb/registrations', {
        method: 'POST',
        body: {
          ...form,
          examYear: Number(form.examYear),
          amount: form.amount ? Number(form.amount) : 0,
        },
      })

      setSuccess(
        `Candidate ${data.registration.candidate_id} was registered successfully.`,
      )

      setForm(initialForm)
      await loadRegistrations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save registration')
    } finally {
      setSaving(false)
    }
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-700',
      IN_PROGRESS: 'bg-amber-100 text-amber-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }

    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          styles[status] || 'bg-slate-100 text-slate-700'
        }`}
      >
        {status.replaceAll('_', ' ')}
      </span>
    )
  }

  return (
    <div className="relative isolate space-y-6 bg-slate-50/40 p-1 md:p-2">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex w-fit items-center rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-700">
                Perfect Wisdom School
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                JAMB Registration Centre
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage candidate registration, payment records and registration
                history.
              </p>
            </div>

            <div className="max-w-md rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 ring-1 ring-amber-100">
              Internal PWS workflow — this is not a direct official JAMB API or
              JAMB portal integration.
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form
          onSubmit={submitRegistration}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
        >
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              New Candidate Registration
            </h2>
            <p className="text-sm text-slate-500">
              Enter the candidate information below.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>First Name *</label>
              <input
                className={inputClass}
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Last Name *</label>
              <input
                className={inputClass}
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Other Name</label>
              <input
                className={inputClass}
                value={form.otherName}
                onChange={(e) => updateField('otherName', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Phone Number *</label>
              <input
                className={inputClass}
                value={form.phoneNumber}
                onChange={(e) => updateField('phoneNumber', e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Date of Birth</label>
              <input
                type="date"
                className={inputClass}
                value={form.dateOfBirth}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Gender</label>
              <select
                className={inputClass}
                value={form.gender}
                onChange={(e) => updateField('gender', e.target.value)}
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>State of Origin</label>
              <input
                className={inputClass}
                value={form.stateOfOrigin}
                onChange={(e) => updateField('stateOfOrigin', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>LGA</label>
              <input
                className={inputClass}
                value={form.lga}
                onChange={(e) => updateField('lga', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>NIN Last 4 Digits</label>
              <input
                inputMode="numeric"
                maxLength={4}
                className={inputClass}
                value={form.ninLast4}
                onChange={(e) =>
                  updateField(
                    'ninLast4',
                    e.target.value.replace(/\D/g, '').slice(0, 4),
                  )
                }
                placeholder="1234"
              />
            </div>

            <div>
              <label className={labelClass}>Exam Year *</label>
              <input
                type="number"
                min="2020"
                max="2100"
                className={inputClass}
                value={form.examYear}
                onChange={(e) => updateField('examYear', e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Registration Type *</label>
              <select
                className={inputClass}
                value={form.registrationType}
                onChange={(e) =>
                  updateField('registrationType', e.target.value)
                }
              >
                <option value="UTME">UTME</option>
                <option value="DIRECT_ENTRY">Direct Entry</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Preferred Course</label>
              <input
                className={inputClass}
                value={form.preferredCourse}
                onChange={(e) =>
                  updateField('preferredCourse', e.target.value)
                }
                placeholder="e.g. Computer Science"
              />
            </div>

            <div>
              <label className={labelClass}>First Choice Institution</label>
              <input
                className={inputClass}
                value={form.firstChoiceInstitution}
                onChange={(e) =>
                  updateField('firstChoiceInstitution', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Second Choice Institution</label>
              <input
                className={inputClass}
                value={form.secondChoiceInstitution}
                onChange={(e) =>
                  updateField('secondChoiceInstitution', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Third Choice Institution</label>
              <input
                className={inputClass}
                value={form.thirdChoiceInstitution}
                onChange={(e) =>
                  updateField('thirdChoiceInstitution', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Branch</label>
              <select
                className={inputClass}
                value={form.branchId}
                onChange={(e) => updateField('branchId', e.target.value)}
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.code || branch.branch_code ? `${branch.code || branch.branch_code} — ` : ''}
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className={labelClass}>Payment Reference</label>
              <input
                className={inputClass}
                value={form.paymentReference}
                onChange={(e) =>
                  updateField('paymentReference', e.target.value)
                }
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className={labelClass}>Notes</label>
              <textarea
                rows={3}
                className={inputClass}
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Register Candidate'}
            </button>
          </div>
        </form>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Registration History
              </h2>
              <p className="text-sm text-slate-500">
                Search and monitor JAMB candidates registered through PWS.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="number"
                placeholder="Exam year"
                className={`${inputClass} sm:w-32`}
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              />

              <select
                className={`${inputClass} sm:w-44`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Loading registration history...
            </div>
          ) : registrations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              No JAMB registrations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Candidate ID</th>
                    <th className="px-3 py-3">Candidate</th>
                    <th className="px-3 py-3">Phone</th>
                    <th className="px-3 py-3">Year</th>
                    <th className="px-3 py-3">Course</th>
                    <th className="px-3 py-3">Branch</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Payment</th>
                  </tr>
                </thead>

                <tbody>
                  {registrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-4 font-semibold text-green-700">
                        {registration.candidate_id}
                      </td>
                      <td className="px-3 py-4 font-medium text-slate-900">
                        {registration.first_name} {registration.last_name}
                        {registration.other_name
                          ? ` ${registration.other_name}`
                          : ''}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {registration.phone_number}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {registration.exam_year}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {registration.preferred_course || '—'}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {registration.branch_name || '—'}
                      </td>
                      <td className="px-3 py-4">
                        {statusBadge(registration.status)}
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-xs font-semibold text-slate-700">
                          {registration.payment_status}
                        </span>
                        <div className="text-xs text-slate-500">
                          ₦{Number(registration.amount || 0).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
