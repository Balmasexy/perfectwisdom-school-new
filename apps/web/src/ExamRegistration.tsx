import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  UserRound,
  BookOpen,
} from 'lucide-react'
import { apiRequest } from './api'

type ExamType = 'WAEC' | 'NECO'

type Branch = {
  id: string
  code?: string
  name: string
}

type StudentLookup = {
  id: string
  studentId: string
  firstName: string
  lastName: string
  otherName: string | null
  phoneNumber: string
  dateOfBirth: string | null
  gender: string | null
  branchId: string | null
  branchName: string | null
  branchCode: string | null
  classId: string | null
  className: string | null
  classCode: string | null
  parentId: string | null
  parentFirstName: string | null
  parentLastName: string | null
  parentPhoneNumber: string | null
  status: string
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
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-50'

const sectionSubjects: Record<ExamType, string[]> = {
  WAEC: [
    'English Language',
    'Mathematics',
    'Biology',
    'Chemistry',
    'Physics',
    'Economics',
    'Government',
    'Literature-in-English',
    'Geography',
    'Commerce',
    'Financial Accounting',
    'Agricultural Science',
    'Civic Education',
    'Christian Religious Studies',
    'Islamic Studies',
    'Computer Studies',
    'Data Processing',
    'Further Mathematics',
  ],
  NECO: [
    'English Language',
    'Mathematics',
    'Biology',
    'Chemistry',
    'Physics',
    'Economics',
    'Government',
    'Literature-in-English',
    'Geography',
    'Commerce',
    'Financial Accounting',
    'Agricultural Science',
    'Civic Education',
    'Christian Religious Studies',
    'Islamic Religious Studies',
    'Computer Studies',
    'Data Processing',
    'Further Mathematics',
  ],
}

const steps = [
  { id: 1, label: 'Candidate Profile', icon: UserRound },
  { id: 2, label: 'Examination', icon: GraduationCap },
  { id: 3, label: 'Subjects', icon: BookOpen },
  { id: 4, label: 'Passport', icon: Camera },
  { id: 5, label: 'Payment', icon: CreditCard },
  { id: 6, label: 'Confirmation', icon: CheckCircle2 },
]

export default function ExamRegistration({
  examType,
  initialStudentId,
}: {
  examType: ExamType
  initialStudentId?: string | null
}) {
  const [form, setForm] = useState<FormState>(createInitialForm())
  const [branches, setBranches] = useState<Branch[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [step, setStep] = useState(1)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [passportPreview, setPassportPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [studentSearch, setStudentSearch] = useState('')
  const [studentResults, setStudentResults] = useState<StudentLookup[]>([])
  const [selectedStudent, setSelectedStudent] =
    useState<StudentLookup | null>(null)
  const [studentSearching, setStudentSearching] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const title = examType === 'WAEC' ? 'WAEC Registration Centre' : 'NECO Registration Centre'
  const accent = examType === 'WAEC' ? 'WAEC' : 'NECO'
  const examDescription =
    examType === 'WAEC'
      ? 'Manage WAEC candidate registration, subject selection, passport review and payment records.'
      : 'Manage NECO candidate registration, subject selection, passport review and payment records.'

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const loadBranches = async () => {
    try {
      setBranches(await apiRequest<Branch[]>('/branches'))
    } catch {
      setBranches([])
    }
  }

  const searchStudents = async (value: string) => {
    setStudentSearch(value)

    if (value.trim().length < 2) {
      setStudentResults([])
      return
    }

    try {
      setStudentSearching(true)

      const response = await apiRequest<{
        students: StudentLookup[]
        total: number
      }>(`/students?search=${encodeURIComponent(value.trim())}`)

      setStudentResults(response.students || [])
    } catch (err) {
      setStudentResults([])
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to search students',
      )
    } finally {
      setStudentSearching(false)
    }
  }

  const selectStudent = (student: StudentLookup) => {
    setSelectedStudent(student)
    setStudentSearch('')
    setStudentResults([])

    setForm((current) => ({
      ...current,
      studentId: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      otherName: student.otherName || '',
      phoneNumber: student.phoneNumber || '',
      dateOfBirth: student.dateOfBirth || '',
      gender: student.gender || '',
      branchId: student.branchId || '',
    }))
  }

  useEffect(() => {
    if (!initialStudentId) return

    let cancelled = false

    async function loadInitialStudent() {
      try {
        const student = await apiRequest<StudentLookup>(
          `/students/${initialStudentId}`,
        )

        if (cancelled) return

        setSelectedStudent(student)
        setStudentSearch('')
        setStudentResults([])

        setForm((current) => ({
          ...current,
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          otherName: student.otherName || '',
          phoneNumber: student.phoneNumber || '',
          dateOfBirth: student.dateOfBirth || '',
          gender: student.gender || '',
          branchId: student.branchId || '',
        }))
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load selected student',
          )
        }
      }
    }

    void loadInitialStudent()

    return () => {
      cancelled = true
    }
  }, [initialStudentId])

  const loadRegistrations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('examType', examType)
      if (statusFilter) params.set('status', statusFilter)
      if (yearFilter) params.set('examYear', yearFilter)

      setRegistrations(
        await apiRequest<Registration[]>(
          `/exam-registrations?${params.toString()}`,
        ),
      )
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

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject],
    )
  }

  const goToStep = (nextStep: number) => {
    setError('')
    setStep(nextStep)
    window.setTimeout(() => {
      document.querySelector('.exam-workspace')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 0)
  }

  const continueFromCandidate = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.')
      goToStep(1)
      return
    }

    if (form.ninLast4 && !/^\d{4}$/.test(form.ninLast4)) {
      setError('NIN last 4 digits must contain exactly 4 numbers.')
      goToStep(1)
      return
    }

    if (!form.phoneNumber.trim()) {
      setError('Phone number is required.')
      goToStep(1)
      return
    }

    setError('')
    goToStep(2)
  }

  const continueFromExamination = () => {
    if (!form.examYear) {
      setError('Please select the examination year before continuing.')
      goToStep(2)
      return
    }

    setError('')
    goToStep(3)
  }

  const continueFromSubjects = () => {
    if (!selectedSubjects.length) {
      setError(`Select at least one ${examType} subject before continuing.`)
      goToStep(3)
      return
    }

    setError('')
    goToStep(4)
  }

  const continueFromPassport = () => {
    setError('')
    goToStep(5)
  }

  const continueFromPayment = () => {
    setError('')
    goToStep(6)
  }

  const handlePassport = (file?: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Passport must be an image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Passport image must not exceed 2MB.')
      return
    }

    setError('')

    const reader = new FileReader()
    reader.onload = () => {
      setPassportPreview(String(reader.result || ''))
    }
    reader.readAsDataURL(file)
  }

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.')
      setStep(1)
      setSaving(false)
      return
    }

    if (form.ninLast4 && !/^\d{4}$/.test(form.ninLast4)) {
      setError('NIN must contain exactly the last 4 digits.')
      setStep(1)
      setSaving(false)
      return
    }

    if (!form.phoneNumber.trim()) {
      setError('Phone number is required.')
      setStep(1)
      setSaving(false)
      return
    }

    if (!form.examYear) {
      setError('Examination year is required.')
      setStep(2)
      setSaving(false)
      return
    }

    if (!selectedSubjects.length) {
      setError(`Select at least one ${examType} subject.`)
      setStep(2)
      setSaving(false)
      return
    }

    try {
      const data = await apiRequest<{ registration: Registration }>(
        '/exam-registrations',
        {
          method: 'POST',
          body: {
            ...form,
            examType,
            examYear: Number(form.examYear),
            subjects: selectedSubjects.join(', '),
            amount: form.amount ? Number(form.amount) : 0,
          },
        },
      )

      setSuccess(
        `${examType} candidate ${data.registration.candidate_id} was registered successfully.`,
      )

      setForm(createInitialForm())
      setSelectedSubjects([])
      setPassportPreview('')
      setStep(1)

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

  const totalAmount = useMemo(
    () =>
      registrations.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      ),
    [registrations],
  )

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
        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
          styles[status] || 'bg-slate-100 text-slate-700'
        }`}
      >
        {status.replaceAll('_', ' ')}
      </span>
    )
  }

  return (
    <div className={`exam-registration-shell exam-${examType.toLowerCase()}`}>
      <div className="exam-container">

        {/* HEADER */}
        <header className="exam-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-green-100">
                <ClipboardCheck size={16} />
                Perfect Wisdom School
              </div>

              <h1 className="text-2xl font-black md:text-3xl">
                {title}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-green-50">
                {examDescription}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur">
              <div className="text-xs font-bold uppercase tracking-wider text-green-100">
                Examination
              </div>
              <div className="mt-1 text-2xl font-black">{accent}</div>
              <div className="mt-1 text-xs text-green-100">
                Internal PWS Registration Centre
              </div>
            </div>
          </div>
        </header>

        {/* NOTICE */}
        <div className="exam-notice">
          <strong>Important:</strong> This is an internal PWS workflow for
          recording and managing candidate registration information. It is
          not a direct official {examType} API or official examination portal.
        </div>

        {/* SUMMARY */}
        <div className="exam-summary">
          <div className="exam-summary-card">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Candidates
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {registrations.length}
            </p>
          </div>

          <div className="exam-summary-card">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Completed
            </p>
            <p className="mt-2 text-2xl font-black text-green-700">
              {registrations.filter((item) => item.status === 'COMPLETED').length}
            </p>
          </div>

          <div className="exam-summary-card">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Recorded Payments
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              ₦{totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              {success}
            </div>
          </div>
        )}

        {/* REGISTRATION WORKSPACE */}
        <form onSubmit={submitRegistration} className={`exam-workspace exam-workspace-${examType.toLowerCase()}`}>

          {/* STEPS */}
          <div className="exam-steps" aria-label={`${examType} registration progress`}>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
              {steps.map((item) => {
                const Icon = item.icon
                const active = step === item.id
                const completed = step > item.id
                const locked = item.id > step

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => item.id <= step && goToStep(item.id)}
                    disabled={locked}
                    aria-current={active ? 'step' : undefined}
                    className={`exam-step rounded-2xl p-3 text-left transition ${
                      active
                        ? 'exam-step-active bg-green-700 text-white shadow-sm'
                        : completed
                          ? 'exam-step-complete bg-green-50 text-green-800'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    } ${locked ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          active
                            ? 'bg-white/15'
                            : completed
                              ? 'bg-white'
                              : 'bg-white'
                        }`}
                      >
                        {completed ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                          Step {item.id}
                        </div>
                        <div className="text-xs font-bold md:text-sm">
                          {item.label}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="exam-section exam-section-card">
              <div className="exam-section-title">
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Step 1
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Candidate Profile
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the candidate's personal information and link the
                  registration to an existing PWS student where applicable.
                </p>
              </div>

              <div className="exam-form-grid exam-form-grid-profile grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <div className="md:col-span-2">
            <label className="exam-label">
              Search Existing Student
            </label>

            {selectedStudent ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Selected Student
                    </div>

                    <div className="mt-1 text-lg font-bold text-slate-900">
                      {selectedStudent.firstName}{' '}
                      {selectedStudent.otherName
                        ? `${selectedStudent.otherName} `
                        : ''}
                      {selectedStudent.lastName}
                    </div>

                    <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <span className="font-semibold">Student ID:</span>{' '}
                        {selectedStudent.studentId}
                      </div>

                      <div>
                        <span className="font-semibold">Class:</span>{' '}
                        {selectedStudent.className ||
                          selectedStudent.classCode ||
                          'Not assigned'}
                      </div>

                      <div>
                        <span className="font-semibold">Branch:</span>{' '}
                        {selectedStudent.branchName ||
                          selectedStudent.branchCode ||
                          'Not assigned'}
                      </div>

                      <div>
                        <span className="font-semibold">Parent:</span>{' '}
                        {selectedStudent.parentFirstName ||
                        selectedStudent.parentLastName
                          ? `${selectedStudent.parentFirstName || ''} ${
                              selectedStudent.parentLastName || ''
                            }`.trim()
                          : 'Not linked'}
                      </div>

                      <div>
                        <span className="font-semibold">Parent Phone:</span>{' '}
                        {selectedStudent.parentPhoneNumber ||
                          'Not available'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={() => {
                      setSelectedStudent(null)
                      setStudentSearch('')
                      setForm((current) => ({
                        ...current,
                        studentId: '',
                      }))
                    }}
                  >
                    Change Student
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  className={inputClass}
                  value={studentSearch}
                  onChange={(e) => void searchStudents(e.target.value)}
                  placeholder="Search by PWS Student ID, name or phone"
                />

                {studentSearching && (
                  <div className="mt-2 text-sm text-slate-500">
                    Searching students...
                  </div>
                )}

                {studentResults.length > 0 && (
                  <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {studentResults.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                        onClick={() => selectStudent(student)}
                      >
                        <div className="font-semibold text-slate-900">
                          {student.firstName}{' '}
                          {student.otherName
                            ? `${student.otherName} `
                            : ''}
                          {student.lastName}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {student.studentId}
                          {' • '}
                          {student.className ||
                            student.classCode ||
                            'No class'}
                          {' • '}
                          {student.branchName ||
                            student.branchCode ||
                            'No branch'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {studentSearch.trim().length >= 2 &&
                  !studentSearching &&
                  studentResults.length === 0 && (
                    <div className="mt-2 text-sm text-slate-500">
                      No matching students found.
                    </div>
                  )}
              </div>
            )}
          </div>

                <div>
                  <label className="exam-label">First Name *</label>
                  <input
                    required
                    className={inputClass}
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="exam-label">Last Name *</label>
                  <input
                    required
                    className={inputClass}
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="exam-label">Other Name</label>
                  <input
                    className={inputClass}
                    value={form.otherName}
                    onChange={(e) => updateField('otherName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="exam-label">Phone Number *</label>
                  <input
                    required
                    className={inputClass}
                    value={form.phoneNumber}
                    onChange={(e) => updateField('phoneNumber', e.target.value)}
                  />
                </div>

                <div>
                  <label className="exam-label">Email Address</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>

                <div>
                  <label className="exam-label">Date of Birth</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  />
                </div>

                <div>
                  <label className="exam-label">Gender</label>
                  <select
                    className={inputClass}
                    value={form.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="exam-label">State of Origin</label>
                  <input
                    className={inputClass}
                    value={form.stateOfOrigin}
                    onChange={(e) => updateField('stateOfOrigin', e.target.value)}
                  />
                </div>

                <div>
                  <label className="exam-label">Local Government Area</label>
                  <input
                    className={inputClass}
                    value={form.lga}
                    onChange={(e) => updateField('lga', e.target.value)}
                  />
                </div>

                <div>
                  <label className="exam-label">NIN Last 4 Digits</label>
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
                  <label className="exam-label">PWS Branch</label>
                  <select
                    className={inputClass}
                    value={form.branchId}
                    onChange={(e) => updateField('branchId', e.target.value)}
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.code ? `${branch.code} — ` : ''}
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={continueFromCandidate}
                  className="rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white hover:bg-green-800"
                >
                  Continue to Examination
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="exam-section exam-section-card">
              <div className="exam-section-title">
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Step 2
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Examination Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Configure the examination year, registration type and examination centre.
                </p>
              </div>

              <div className="exam-form-grid grid gap-5 md:grid-cols-3">
                <div>
                  <label className="exam-label">Examination Year *</label>
                  <input
                    required
                    type="number"
                    min="2020"
                    max="2100"
                    className={inputClass}
                    value={form.examYear}
                    onChange={(e) => updateField('examYear', e.target.value)}
                  />
                </div>

                <div>
                  <label className="exam-label">Registration Type *</label>
                  <select
                    className={inputClass}
                    value={form.registrationType}
                    onChange={(e) =>
                      updateField('registrationType', e.target.value)
                    }
                  >
                    <option value="SCHOOL_CANDIDATE">School Candidate</option>
                    <option value="PRIVATE_CANDIDATE">Private Candidate</option>
                  </select>
                </div>

                <div>
                  <label className="exam-label">Examination Centre</label>
                  <input
                    className={inputClass}
                    value={form.examinationCentre}
                    onChange={(e) =>
                      updateField('examinationCentre', e.target.value)
                    }
                    placeholder="Centre name / code"
                  />
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={continueFromExamination}
                  className="rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white hover:bg-green-800"
                >
                  Continue to Subjects
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="exam-section exam-section-card">
              <div className="exam-section-title">
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Step 3
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Subject Selection
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select the subjects being recorded for this candidate.
                </p>
              </div>

              <div className="mt-7">
                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Subject Selection
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Select the subjects being recorded for this candidate.
                    </p>
                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    {selectedSubjects.length} selected
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {sectionSubjects[examType].map((subject) => {
                    const selected = selectedSubjects.includes(subject)

                    return (
                      <label
                        key={subject}
                        className={`exam-subject-option ${
                          selected ? 'exam-subject-selected' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSubject(subject)}
                          className="exam-subject-checkbox"
                        />

                        <span className="exam-subject-box" aria-hidden="true">
                          {selected ? <CheckCircle2 size={18} /> : null}
                        </span>

                        <span className="exam-subject-name">{subject}</span>
                      </label>
                    )
                  })}
                </div>
              </div>



              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Back to Examination
                </button>

                <button
                  type="button"
                  onClick={continueFromSubjects}
                  className="rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white hover:bg-green-800"
                >
                  Continue to Passport
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="exam-section exam-section-card">
              <div className="exam-section-title">
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Step 4
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Passport Profile
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add the candidate passport image for registration review.
                </p>
              </div>

              <div className="exam-passport-layout grid gap-7 md:grid-cols-[220px_1fr]">
                <div className="flex justify-center">
                  <div className="relative flex h-56 w-44 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                    {passportPreview ? (
                      <img
                        src={passportPreview}
                        alt="Candidate passport preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <Camera className="mx-auto mb-2" size={34} />
                        <p className="text-xs font-semibold">Passport Preview</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="exam-label">Passport Photograph</label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePassport(e.target.files?.[0])}
                    className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                  />

                  <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                    <p className="font-bold text-slate-800">
                      Passport requirements
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      <li>Use a clear passport-style image.</li>
                      <li>Maximum file size: 2MB.</li>
                      <li>Image formats are handled locally by the browser.</li>
                    </ul>
                  </div>

                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
                    The current PWS registration API does not yet permanently
                    store passport files. This screen provides a working local
                    preview only until passport storage is added to the backend.
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={continueFromPassport}
                  className="rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white hover:bg-green-800"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="exam-section exam-section-card">
              <div className="exam-section-title">
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Step 5
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Payment Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Record the registration amount and payment information before confirmation.
                </p>
              </div>

              <div className="exam-form-grid grid gap-5 md:grid-cols-2">
                <div>
                  <label className="exam-label">Registration Amount</label>
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
                  <label className="exam-label">Payment Reference</label>
                  <input
                    className={inputClass}
                    value={form.paymentReference}
                    onChange={(e) =>
                      updateField('paymentReference', e.target.value)
                    }
                    placeholder="Receipt / transaction reference"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="exam-label">Registration Notes</label>
                  <textarea
                    rows={4}
                    className={inputClass}
                    value={form.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Additional registration information..."
                  />
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(4)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Back to Passport
                </button>

                <button
                  type="button"
                  onClick={continueFromPayment}
                  className="rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white hover:bg-green-800"
                >
                  Continue to Confirmation
                </button>
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {step === 6 && (
            <div className="exam-section exam-section-card">
              <div className="exam-section-title">
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Step 6
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Confirm Registration
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review the complete registration before submitting it.
                </p>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <h3 className="text-sm font-black text-slate-900">
                  Registration Summary
                </h3>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-slate-500">Candidate</span>
                    <p className="font-bold text-slate-900">
                      {form.firstName} {form.lastName}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Examination</span>
                    <p className="font-bold text-slate-900">
                      {examType} {form.examYear}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Subjects</span>
                    <p className="font-bold text-slate-900">
                      {selectedSubjects.length} selected
                    </p>
                  </div>

                  <div className="sm:col-span-2 exam-confirm-subjects">
                    <span className="text-slate-500">Selected Subjects</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedSubjects.map((subject) => (
                        <span
                          key={subject}
                          className="exam-confirm-subject"
                        >
                          <CheckCircle2 size={14} />
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500">Passport</span>
                    <p className="font-bold text-slate-900">
                      {passportPreview ? 'Preview added' : 'Not added'}
                    </p>
                  </div>
                </div>
              </div>



              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(5)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Back to Payment
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Registering...' : `Confirm & Register ${examType} Candidate`}
                </button>
              </div>
            </div>
          )}

        </form>

        {/* HISTORY */}
        <section className="exam-history-panel">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                Records
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-900">
                Registration History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review candidates already recorded through the PWS {examType} workspace.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className={inputClass}
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">All years</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>

              <select
                className={inputClass}
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
            <div className="rounded-2xl bg-slate-50 p-10 text-center text-sm text-slate-500">
              Loading {examType} registration records...
            </div>
          ) : registrations.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-10 text-center text-sm text-slate-500">
              No {examType} registrations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Candidate ID</th>
                    <th className="px-3 py-3">Candidate</th>
                    <th className="px-3 py-3">Phone</th>
                    <th className="px-3 py-3">Year</th>
                    <th className="px-3 py-3">Centre</th>
                    <th className="px-3 py-3">Branch</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Payment</th>
                  </tr>
                </thead>

                <tbody>
                  {registrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-3 py-4 font-black text-green-700">
                        {registration.candidate_id}
                      </td>

                      <td className="px-3 py-4 font-bold text-slate-900">
                        {registration.first_name} {registration.last_name}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {registration.phone_number}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {registration.exam_year}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {registration.examination_centre || '—'}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {registration.branch_code ||
                          registration.branch_name ||
                          '—'}
                      </td>

                      <td className="px-3 py-4">
                        {statusBadge(registration.status)}
                      </td>

                      <td className="px-3 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {registration.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs leading-5 text-slate-300">
          <FileText size={16} className="shrink-0" />
          PWS registration records should be reviewed before any official
          examination-board submission.
        </div>
      </div>
    </div>
  )
}
