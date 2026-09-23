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
  branchName: string | null
  branchCode: string | null
  parentFirstName: string | null
  parentLastName: string | null
  parentPhoneNumber: string | null
  status: string
}

type Props = {
  studentId: string
  onBack: () => void
}

export default function StudentProfile({ studentId, onBack }: Props) {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError('')

        const data = await apiRequest<Student>(`/students/${studentId}`)

        if (!cancelled) {
          setStudent(data)
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
              <span>Status</span>
              <strong>{student.status}</strong>
            </div>
          </div>
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
