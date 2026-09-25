import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  HeartHandshake,
  UserRound,
  Users,
} from 'lucide-react'
import { apiRequest } from './api'

type SchoolClass = {
  id: string
  name: string
  code: string
  branchId: string | null
  branchName: string | null
  studentCount: number
}

type Student = {
  id: string
  studentId: string
  firstName: string
  lastName: string
  otherName: string | null
  phoneNumber: string
  dateOfBirth: string | null
  gender: string | null
  address: string | null
  branchId: string | null
  branchName: string | null
  branchCode: string | null
  classId: string | null
  className: string | null
  classCode: string | null
  parentFirstName: string | null
  parentLastName: string | null
  parentPhoneNumber: string | null
  status: string
}

type ExamRegistration = {
  id: string
  candidate_id: string
  exam_type: string
  exam_year: number
  status: string
  payment_status: string
  amount: string | number
  payment_reference?: string | null
  created_at: string
}

type Props = {
  studentId: string
  onBack: () => void
  onRegisterExam?: (
    examType: 'WAEC' | 'NECO',
    studentId: string,
  ) => void
}

export default function StudentProfile({
  studentId,
  onBack,
  onRegisterExam,
}: Props) {
  const [student, setStudent] = useState<Student | null>(null)
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingClass, setSavingClass] = useState(false)
  const [error, setError] = useState('')
  const [classMessage, setClassMessage] = useState('')
  const [examRegistrations, setExamRegistrations] =
    useState<ExamRegistration[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError('')

        const [data, classData, waecData, necoData] =
          await Promise.all([
            apiRequest<Student>(`/students/${studentId}`),
            apiRequest<SchoolClass[]>('/classes'),
            apiRequest<ExamRegistration[]>(
              `/exam-registrations?examType=WAEC&studentId=${encodeURIComponent(studentId)}`,
            ),
            apiRequest<ExamRegistration[]>(
              `/exam-registrations?examType=NECO&studentId=${encodeURIComponent(studentId)}`,
            ),
          ])

        if (!cancelled) {
          setStudent(data)
          setClasses(classData || [])
          setSelectedClassId(data.classId || '')
          setExamRegistrations([
            ...(waecData || []),
            ...(necoData || []),
          ])
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load student profile',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [studentId])

  async function saveClassAssignment() {
    if (!student) return

    try {
      setSavingClass(true)
      setClassMessage('')
      setError('')

      const updated = await apiRequest<Student>(`/students/${student.id}`, {
        method: 'PATCH',
        body: {
          classId: selectedClassId || undefined,
        },
      })

      setStudent(updated)
      setSelectedClassId(updated.classId || '')
      setClassMessage(
        selectedClassId
          ? 'Student class assignment saved successfully.'
          : 'Student removed from the current class.',
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save class assignment',
      )
    } finally {
      setSavingClass(false)
    }
  }

  if (loading) {
    return (
      <div className="module-placeholder">
        <GraduationCap size={30} />
        <h3>Loading student profile</h3>
        <p>Retrieving the complete school record...</p>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="module-placeholder">
        <h3>Student profile unavailable</h3>
        <p>{error || 'Student record was not found.'}</p>
        <button type="button" className="module-action" onClick={onBack}>
          Back to Students
        </button>
      </div>
    )
  }

  const fullName = [
    student.firstName,
    student.otherName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="module-workspace">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={17} />
        Back to Students
      </button>

      <div className="module-header">
        <div className="module-title">
          <div className="module-icon">
            <GraduationCap size={26} />
          </div>

          <div>
            <div className="module-eyebrow">{student.studentId}</div>
            <h1>{fullName}</h1>
            <p>
              Complete student record, family connection and school activity
              workspace.
            </p>
          </div>
        </div>

        <span className={`status-pill ${student.status.toLowerCase()}`}>
          {student.status}
        </span>
      </div>

      <div className="student-profile-tabs">
        <button type="button">
          <UserRound size={17} />
          Personal Information
        </button>

        <button type="button">
          <HeartHandshake size={17} />
          Parent / Guardian
        </button>

        <button type="button">
          <BookOpen size={17} />
          Academic Records
        </button>

        <button type="button">
          <CalendarCheck size={17} />
          Attendance
        </button>

        <button type="button">
          <ClipboardList size={17} />
          Assignments
        </button>

        <button type="button">
          <CreditCard size={17} />
          Fees & Payments
        </button>

        <button type="button">
          <FileText size={17} />
          Documents
        </button>
      </div>

      <div className="student-profile-grid">
        <section className="module-panel">
          <div className="module-panel-heading">
            <div>
              <h2>Personal Information</h2>
              <p>Core identity and contact details.</p>
            </div>
          </div>

          <div className="student-detail-grid">
            <div>
              <span>Student ID</span>
              <strong>{student.studentId}</strong>
            </div>

            <div>
              <span>Gender</span>
              <strong>{student.gender || 'Not provided'}</strong>
            </div>

            <div>
              <span>Date of Birth</span>
              <strong>{student.dateOfBirth || 'Not provided'}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{student.phoneNumber || 'Not provided'}</strong>
            </div>

            <div className="full-width">
              <span>Address</span>
              <strong>{student.address || 'Not provided'}</strong>
            </div>
          </div>
        </section>

        <section className="module-panel">
          <div className="module-panel-heading">
            <div>
              <h2>Parent / Guardian</h2>
              <p>Family connection for this student.</p>
            </div>

            <HeartHandshake size={20} />
          </div>

          <div className="student-detail-grid">
            <div>
              <span>Name</span>
              <strong>
                {student.parentFirstName
                  ? `${student.parentFirstName} ${student.parentLastName || ''}`
                  : 'Not linked'}
              </strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>
                {student.parentPhoneNumber || 'Not provided'}
              </strong>
            </div>
          </div>
        </section>

        <section className="module-panel">
          <div className="module-panel-heading">
            <div>
              <h2>School Placement</h2>
              <p>Current school structure.</p>
            </div>

            <Users size={20} />
          </div>

          <div className="student-detail-grid">
            <div>
              <span>Branch</span>
              <strong>{student.branchName || 'Not assigned'}</strong>
            </div>

            <div>
              <span>Branch Code</span>
              <strong>{student.branchCode || '—'}</strong>
            </div>

            <div>
              <span>Current Class</span>
              <strong>
                {student.className
                  ? `${student.className}${student.classCode ? ` (${student.classCode})` : ''}`
                  : 'Not assigned'}
              </strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{student.status}</strong>
            </div>
          </div>

          <div className="student-class-assignment">
            <div>
              <strong>Assign Student to Class</strong>
              <p>
                Select the student's current class. The assignment is saved
                directly to the student record.
              </p>
            </div>

            <div className="student-class-assignment-row">
              <select
                value={selectedClassId}
                onChange={(event) => {
                  setSelectedClassId(event.target.value)
                  setClassMessage('')
                }}
              >
                <option value="">No class assigned</option>
                {classes
                  .filter(
                    (schoolClass) =>
                      !student.branchId ||
                      !schoolClass.branchId ||
                      schoolClass.branchId === student.branchId,
                  )
                  .map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name} ({schoolClass.code})
                      {schoolClass.branchName
                        ? ` — ${schoolClass.branchName}`
                        : ''}
                    </option>
                  ))}
              </select>

              <button
                type="button"
                className="primary-button"
                onClick={() => void saveClassAssignment()}
                disabled={savingClass}
              >
                {savingClass ? 'Saving...' : 'Save Class'}
              </button>
            </div>

            {classMessage && (
              <div className="module-success">{classMessage}</div>
            )}
          </div>
        </section>

        <section className="module-panel">
          <div className="module-panel-heading">
            <div>
              <h2>Examination Registration</h2>
              <p>
                Register this student for WAEC or NECO and view previous
                examination registrations.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="module-action"
                onClick={() =>
                  onRegisterExam?.('WAEC', student.id)
                }
              >
                Register WAEC
              </button>

              <button
                type="button"
                className="module-action"
                onClick={() =>
                  onRegisterExam?.('NECO', student.id)
                }
              >
                Register NECO
              </button>
            </div>
          </div>

          {examRegistrations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No WAEC or NECO registration has been recorded for this
              student.
            </div>
          ) : (
            <div className="space-y-3">
              {examRegistrations
                .slice()
                .sort(
                  (a, b) =>
                    Number(b.exam_year) - Number(a.exam_year),
                )
                .map((registration) => (
                  <div
                    key={registration.id}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-slate-900">
                            {registration.exam_type}
                          </strong>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {registration.exam_year}
                          </span>
                        </div>

                        <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                          <div>
                            <span className="font-semibold">
                              Candidate ID:
                            </span>{' '}
                            {registration.candidate_id}
                          </div>

                          <div>
                            <span className="font-semibold">
                              Registration:
                            </span>{' '}
                            {registration.status}
                          </div>

                          <div>
                            <span className="font-semibold">
                              Payment:
                            </span>{' '}
                            {registration.payment_status}
                          </div>

                          <div>
                            <span className="font-semibold">
                              Amount:
                            </span>{' '}
                            ₦
                            {Number(
                              registration.amount || 0,
                            ).toLocaleString()}
                          </div>

                          {registration.payment_reference && (
                            <div className="sm:col-span-2">
                              <span className="font-semibold">
                                Payment Reference:
                              </span>{' '}
                              {registration.payment_reference}
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="text-xs text-slate-400">
                        {new Date(
                          registration.created_at,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        <section className="module-panel">
          <div className="module-panel-heading">
            <div>
              <h2>Academic & Activity Record</h2>
              <p>Connected areas for the student's school history.</p>
            </div>

            <BookOpen size={20} />
          </div>

          <div className="profile-empty-links">
            <div>
              <BookOpen size={18} />
              <span>Class & academic history</span>
              <strong>Open</strong>
            </div>

            <div>
              <CalendarCheck size={18} />
              <span>Attendance history</span>
              <strong>Open</strong>
            </div>

            <div>
              <ClipboardList size={18} />
              <span>Assignments</span>
              <strong>Open</strong>
            </div>

            <div>
              <CreditCard size={18} />
              <span>Fees and payments</span>
              <strong>Open</strong>
            </div>

            <div>
              <FileText size={18} />
              <span>Student documents</span>
              <strong>Open</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
