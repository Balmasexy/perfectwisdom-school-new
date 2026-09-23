import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { apiRequest } from './api'

type ExamType = 'WAEC' | 'NECO'

type Branch = {
  id: string
  code?: string
  name: string
}

type Registration = {
  id: string
  candidate_id: string
  exam_type: string
  first_name: string
  last_name: string
  other_name?: string | null
  phone_number: string
  email?: string | null
  exam_year: number
  registration_type: string
  examination_centre?: string | null
  subjects?: string | null
  branch_code?: string | null
  branch_name?: string | null
  status: string
  payment_status: string
  amount: string | number
  payment_reference?: string | null
  created_at: string
}

type FormState = {
  studentId: string
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
  examinationCentre: string
  subjects: string
  branchId: string
  amount: string
  paymentReference: string
  notes: string
}

const createInitialForm = (): FormState => ({
  studentId: '',
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
  registrationType: 'SCHOOL_CANDIDATE',
  examinationCentre: '',
  subjects: '',
  branchId: '',
  amount: '',
  paymentReference: '',
  notes: '',
})

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100'

const labelClass =
  'mb-1.5 block text-sm font-medium text-slate-700'

export default function ExamRegistration({
  examType,
}: {
  examType: ExamType
}) {
  const [form, setForm] = useState<FormState>(
    createInitialForm(),
  )

  const [branches, setBranches] = useState<Branch[]>([])
  const [registrations, setRegistrations] =
    useState<Registration[]>([])

  const [statusFilter, setStatusFilter] =
    useState('')

  const [yearFilter, setYearFilter] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const title =
    examType === 'WAEC'
      ? 'WAEC Registration Centre'
      : 'NECO Registration Centre'

  const description =
    examType === 'WAEC'
      ? 'Manage WAEC candidate registration, subjects, payments and registration history.'
      : 'Manage NECO candidate registration, subjects, payments and registration history.'

  const updateField = (
    field: keyof FormState,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const loadBranches = async () => {
    try {
      const data =
        await apiRequest<Branch[]>('/branches')

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

      params.set('examType', examType)

      if (statusFilter) {
        params.set('status', statusFilter)
      }

      if (yearFilter) {
        params.set('examYear', yearFilter)
      }

      const data =
        await apiRequest<Registration[]>(
          `/exam-registrations?${params.toString()}`,
        )

      setRegistrations(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to load ${examType} registrations`,
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBranches()
  }, [])

  useEffect(() => {
    void loadRegistrations()
  }, [examType, statusFilter, yearFilter])

  const submitRegistration = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    if (
      form.ninLast4 &&
      !/^\d{4}$/.test(form.ninLast4)
    ) {
      setError(
        'NIN must contain exactly the last 4 digits.',
      )
      setSaving(false)
      return
    }

    if (
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      setError(
        'First name and last name are required.',
      )
      setSaving(false)
      return
    }

    try {
      const data =
        await apiRequest<{
          registration: Registration
        }>('/exam-registrations', {
          method: 'POST',
          body: {
            ...form,
            examType,
            examYear: Number(form.examYear),
            amount: form.amount
              ? Number(form.amount)
              : 0,
          },
        })

      setSuccess(
        `${examType} candidate ${data.registration.candidate_id} was registered successfully.`,
      )

      setForm(createInitialForm())

      await loadRegistrations()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to save ${examType} registration`,
      )
    } finally {
      setSaving(false)
    }
  }

  const statusBadge = (
    status: string,
  ) => {
    const styles: Record<string, string> = {
      DRAFT:
        'bg-slate-100 text-slate-700',
      IN_PROGRESS:
        'bg-amber-100 text-amber-800',
      SUBMITTED:
        'bg-blue-100 text-blue-800',
      COMPLETED:
        'bg-green-100 text-green-800',
      CANCELLED:
        'bg-red-100 text-red-800',
    }

    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          styles[status] ||
          'bg-slate-100 text-slate-700'
        }`}
      >
        {status.replaceAll('_', ' ')}
      </span>
    )
  }

  const totalAmount = useMemo(
    () =>
      registrations.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0,
      ),
    [registrations],
  )

  return (
    <div className="relative isolate space-y-6 bg-slate-50/40 p-1 md:p-2">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex w-fit items-center rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-700">
                Perfect Wisdom School
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                {title}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>

            <div className="max-w-md rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 ring-1 ring-amber-100">
              Internal PWS workflow — this module records and
              manages school registration information. It is
              not a direct official {examType} API or portal
              integration.
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Candidates
            </p>
            <strong className="mt-2 block text-2xl text-slate-900">
              {registrations.length}
            </strong>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Completed
            </p>
            <strong className="mt-2 block text-2xl text-green-700">
              {
                registrations.filter(
                  (item) =>
                    item.status === 'COMPLETED',
                ).length
              }
            </strong>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recorded Payments
            </p>
            <strong className="mt-2 block text-2xl text-slate-900">
              ₦{totalAmount.toLocaleString()}
            </strong>
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
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-green-700">
              Candidate Registration
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              New {examType} Candidate
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter accurate candidate information before
              saving the registration.
            </p>
          </div>

          <div className="mb-6 rounded-xl bg-slate-50 p-4">
            <h3 className="mb-4 text-sm font-bold text-slate-900">
              Candidate Information
            </h3>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              <div>
                <label className={labelClass}>
                  Student ID
                </label>

                <input
                  className={inputClass}
                  value={form.studentId}
                  onChange={(e) =>
                    updateField(
                      'studentId',
                      e.target.value,
                    )
                  }
                  placeholder="Optional PWS student UUID"
                />
              </div>

              <div>
                <label className={labelClass}>
                  First Name *
                </label>

                <input
                  className={inputClass}
                  value={form.firstName}
                  onChange={(e) =>
                    updateField(
                      'firstName',
                      e.target.value,
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Last Name *
                </label>

                <input
                  className={inputClass}
                  value={form.lastName}
                  onChange={(e) =>
                    updateField(
                      'lastName',
                      e.target.value,
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Other Name
                </label>

                <input
                  className={inputClass}
                  value={form.otherName}
                  onChange={(e) =>
                    updateField(
                      'otherName',
                      e.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Phone Number *
                </label>

                <input
                  className={inputClass}
                  value={form.phoneNumber}
                  onChange={(e) =>
                    updateField(
                      'phoneNumber',
                      e.target.value,
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Email
                </label>

                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) =>
                    updateField(
                      'email',
                      e.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Date of Birth
                </label>

                <input
                  type="date"
                  className={inputClass}
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    updateField(
                      'dateOfBirth',
                      e.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Gender
                </label>

                <select
                  className={inputClass}
                  value={form.gender}
                  onChange={(e) =>
                    updateField(
                      'gender',
                      e.target.value,
                    )
                  }
                >
                  <option value="">
                    Select gender
                  </option>
                  <option value="MALE">
                    Male
                  </option>
                  <option value="FEMALE">
                    Female
                  </option>
                  <option value="OTHER">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  State of Origin
                </label>

                <input
                  className={inputClass}
                  value={form.stateOfOrigin}
                  onChange={(e) =>
                    updateField(
                      'stateOfOrigin',
                      e.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  LGA
                </label>

                <input
                  className={inputClass}
                  value={form.lga}
                  onChange={(e) =>
                    updateField(
                      'lga',
                      e.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  NIN Last 4 Digits
                </label>

                <input
                  inputMode="numeric"
                  maxLength={4}
                  className={inputClass}
                  value={form.ninLast4}
                  onChange={(e) =>
                    updateField(
                      'ninLast4',
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 4),
                    )
                  }
                  placeholder="1234"
                />
              </div>

            </div>
          </div>

          <div className="mb-6 rounded-xl bg-slate-50 p-4">
            <h3 className="mb-4 text-sm font-bold text-slate-900">
              Examination Details
            </h3>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              <div>
                <label className={labelClass}>
                  Exam Year *
                </label>

                <input
                  type="number"
                  min="2020"
                  max="2100"
                  className={inputClass}
                  value={form.examYear}
                  onChange={(e) =>
                    updateField(
                      'examYear',
                      e.target.value,
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Registration Type *
                </label>

                <select
                  className={inputClass}
                  value={form.registrationType}
                  onChange={(e) =>
                    updateField(
                      'registrationType',
                      e.target.value,
                    )
                  }
                >
                  <option value="SCHOOL_CANDIDATE">
                    School Candidate
                  </option>
                  <option value="PRIVATE_CANDIDATE">
                    Private Candidate
                  </option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Examination Centre
                </label>

                <input
                  className={inputClass}
                  value={form.examinationCentre}
                  onChange={(e) =>
                    updateField(
                      'examinationCentre',
                      e.target.value,
                    )
                  }
                  placeholder="Examination centre"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className={labelClass}>
                  Subjects
                </label>

                <textarea
                  rows={4}
                  className={inputClass}
                  value={form.subjects}
                  onChange={(e) =>
                    updateField(
                      'subjects',
                      e.target.value,
                    )
                  }
                  placeholder="English Language, Mathematics, Biology, Chemistry..."
                />

                <p className="mt-1 text-xs text-slate-400">
                  Separate subjects with commas.
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  PWS Branch
                </label>

                <select
                  className={inputClass}
                  value={form.branchId}
                  onChange={(e) =>
                    updateField(
                      'branchId',
                      e.target.value,
                    )
                  }
                >
                  <option value="">
                    Select branch
                  </option>

                  {branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.code
                        ? `${branch.code} — `
                        : ''}
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          <div className="mb-6 rounded-xl bg-slate-50 p-4">
            <h3 className="mb-4 text-sm font-bold text-slate-900">
              Payment & Records
            </h3>

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className={labelClass}>
                  Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={form.amount}
                  onChange={(e) =>
                    updateField(
                      'amount',
                      e.target.value,
                    )
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Payment Reference
                </label>

                <input
                  className={inputClass}
                  value={form.paymentReference}
                  onChange={(e) =>
                    updateField(
                      'paymentReference',
                      e.target.value,
                    )
                  }
                  placeholder="Payment reference"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  Notes
                </label>

                <textarea
                  rows={3}
                  className={inputClass}
                  value={form.notes}
                  onChange={(e) =>
                    updateField(
                      'notes',
                      e.target.value,
                    )
                  }
                  placeholder="Additional registration notes"
                />
              </div>

            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? 'Saving...'
                : `Register ${examType} Candidate`}
            </button>
          </div>
        </form>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                Records
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {examType} Registration History
              </h2>

              <p className="text-sm text-slate-500">
                Search and monitor {examType} registrations
                created through PWS.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className={inputClass}
                value={yearFilter}
                onChange={(e) =>
                  setYearFilter(e.target.value)
                }
              >
                <option value="">
                  All years
                </option>
                <option value="2026">
                  2026
                </option>
                <option value="2027">
                  2027
                </option>
                <option value="2028">
                  2028
                </option>
              </select>

              <select
                className={inputClass}
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
              >
                <option value="">
                  All statuses
                </option>
                <option value="DRAFT">
                  Draft
                </option>
                <option value="IN_PROGRESS">
                  In Progress
                </option>
                <option value="SUBMITTED">
                  Submitted
                </option>
                <option value="COMPLETED">
                  Completed
                </option>
                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading {examType} registration records...
            </div>
          ) : registrations.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
              No {examType} registrations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">
                      Candidate ID
                    </th>
                    <th className="px-3 py-3">
                      Candidate
                    </th>
                    <th className="px-3 py-3">
                      Phone
                    </th>
                    <th className="px-3 py-3">
                      Year
                    </th>
                    <th className="px-3 py-3">
                      Centre
                    </th>
                    <th className="px-3 py-3">
                      Branch
                    </th>
                    <th className="px-3 py-3">
                      Status
                    </th>
                    <th className="px-3 py-3">
                      Payment
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {registrations.map(
                    (registration) => (
                      <tr
                        key={registration.id}
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-4 font-semibold text-green-700">
                          {registration.candidate_id}
                        </td>

                        <td className="px-3 py-4 font-medium text-slate-900">
                          {registration.first_name}{' '}
                          {registration.last_name}
                        </td>

                        <td className="px-3 py-4 text-slate-600">
                          {registration.phone_number}
                        </td>

                        <td className="px-3 py-4 text-slate-600">
                          {registration.exam_year}
                        </td>

                        <td className="px-3 py-4 text-slate-600">
                          {registration.examination_centre ||
                            '—'}
                        </td>

                        <td className="px-3 py-4 text-slate-600">
                          {registration.branch_code ||
                            registration.branch_name ||
                            '—'}
                        </td>

                        <td className="px-3 py-4">
                          {statusBadge(
                            registration.status,
                          )}
                        </td>

                        <td className="px-3 py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {registration.payment_status}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
