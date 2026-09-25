import React, { useEffect, useState } from 'react'
import { apiRequest } from './api'
import {
  Activity,
  CheckCircle2,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  MessageSquare,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  Baby,
  BarChart3,
  Clock3,
  CalendarDays,
  CalendarPlus,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react'

type ModuleWorkspaceProps = {
  role: 'Admin' | 'Staff' | 'Parent'
  section: string
}

type ModuleConfig = {
  title: string
  description: string
  icon: React.ElementType
  actions: string[]
  cards: Array<{
    label: string
    value: string
    detail: string
  }>
}

const modules: Record<string, ModuleConfig> = {
  Students: {
    title: 'Student Management',
    description: 'Manage student records, admissions, class placement and parent relationships.',
    icon: GraduationCap,
    actions: ['Add Student', 'Search Students', 'Export Records'],
    cards: [
      { label: 'Total Students', value: '0', detail: 'Registered students' },
      { label: 'Active Students', value: '0', detail: 'Currently enrolled' },
      { label: 'New Admissions', value: '0', detail: 'This session' },
      { label: 'Pending Records', value: '0', detail: 'Require attention' },
    ],
  },

  'My Students': {
    title: 'My Students',
    description: 'View and manage students assigned to your staff account.',
    icon: Users,
    actions: ['Search Students', 'View Classes', 'Attendance'],
    cards: [
      { label: 'My Students', value: '0', detail: 'Assigned students' },
      { label: 'Present Today', value: '0', detail: 'Attendance' },
      { label: 'Assignments', value: '0', detail: 'Pending work' },
      { label: 'Messages', value: '0', detail: 'Unread messages' },
    ],
  },

  Attendance: {
    title: 'Attendance Management',
    description: 'Record, review and monitor student attendance.',
    icon: CalendarCheck,
    actions: ['Take Attendance', 'View Today', 'Attendance Report'],
    cards: [
      { label: 'Today', value: '0%', detail: 'Attendance rate' },
      { label: 'Present', value: '0', detail: 'Students present' },
      { label: 'Absent', value: '0', detail: 'Students absent' },
      { label: 'Pending', value: '0', detail: 'Classes to record' },
    ],
  },

  Classes: {
    title: 'Classes & Academic Structure',
    description: 'Manage classes, streams, subjects and class assignments.',
    icon: BookOpen,
    actions: ['Add Class', 'Manage Subjects', 'Assign Teachers'],
    cards: [
      { label: 'Classes', value: '0', detail: 'Active classes' },
      { label: 'Subjects', value: '0', detail: 'Registered subjects' },
      { label: 'Teachers', value: '0', detail: 'Assigned teachers' },
      { label: 'Students', value: '0', detail: 'Class enrolments' },
    ],
  },

  Assignments: {
    title: 'Assignments',
    description: 'Create, distribute and monitor academic assignments.',
    icon: ClipboardList,
    actions: ['Create Assignment', 'View Submissions', 'Assignment Reports'],
    cards: [
      { label: 'Assignments', value: '0', detail: 'Created assignments' },
      { label: 'Pending', value: '0', detail: 'Awaiting submission' },
      { label: 'Submitted', value: '0', detail: 'Student submissions' },
      { label: 'Overdue', value: '0', detail: 'Past due date' },
    ],
  },

  Messages: {
    title: 'Messages',
    description: 'Communicate with staff, students and parents through the school system.',
    icon: MessageSquare,
    actions: ['New Message', 'Inbox', 'Sent Messages'],
    cards: [
      { label: 'Inbox', value: '0', detail: 'Messages received' },
      { label: 'Unread', value: '0', detail: 'Require attention' },
      { label: 'Sent', value: '0', detail: 'Messages sent' },
      { label: 'Announcements', value: '0', detail: 'School announcements' },
    ],
  },

  Profile: {
    title: 'My Profile',
    description: 'View and manage your school account information.',
    icon: UserCircle,
    actions: ['Edit Profile', 'Change Password', 'Security'],
    cards: [
      { label: 'Account', value: 'Active', detail: 'Account status' },
      { label: 'Role', value: 'Verified', detail: 'Access level' },
      { label: 'Profile', value: 'Ready', detail: 'Profile information' },
      { label: 'Security', value: 'Protected', detail: 'Account security' },
    ],
  },

  'My Children': {
    title: 'My Children',
    description: "Monitor your children's school activities, attendance and academic records.",
    icon: Baby,
    actions: ['View Children', 'Attendance', 'Academic Records'],
    cards: [
      { label: 'Children', value: '0', detail: 'Linked children' },
      { label: 'Present Today', value: '0', detail: 'Attendance' },
      { label: 'Assignments', value: '0', detail: 'Pending assignments' },
      { label: 'Messages', value: '0', detail: 'Unread messages' },
    ],
  },

  Results: {
    title: 'Academic Results',
    description: 'View examination results and academic performance.',
    icon: BarChart3,
    actions: ['View Results', 'Term Summary', 'Download Report'],
    cards: [
      { label: 'Current Term', value: '—', detail: 'Result status' },
      { label: 'Subjects', value: '0', detail: 'Subjects recorded' },
      { label: 'Average', value: '—', detail: 'Current average' },
      { label: 'Position', value: '—', detail: 'Class position' },
    ],
  },

  Reports: {
    title: 'School Reports',
    description: 'Review operational, academic, attendance and financial reports.',
    icon: FileBarChart,
    actions: ['Attendance Report', 'Academic Report', 'Financial Report'],
    cards: [
      { label: 'Academic', value: '—', detail: 'Academic reports' },
      { label: 'Attendance', value: '—', detail: 'Attendance reports' },
      { label: 'Finance', value: '—', detail: 'Financial reports' },
      { label: 'Operations', value: '—', detail: 'Operational reports' },
    ],
  },

  Settings: {
    title: 'School Settings',
    description: 'Configure school-wide settings and system preferences.',
    icon: Settings,
    actions: ['School Information', 'Academic Session', 'System Preferences'],
    cards: [
      { label: 'School', value: 'Configured', detail: 'School information' },
      { label: 'Session', value: 'Active', detail: 'Academic session' },
      { label: 'System', value: 'Ready', detail: 'System settings' },
      { label: 'Security', value: 'Protected', detail: 'Security settings' },
    ],
  },
}




type AcademicSessionRecord = {
  id: string
  name: string
  startDate?: string | null
  endDate?: string | null
  active: boolean
  activeTerm?: string | null
}

function AcademicSessionWorkspace({
  role,
}: {
  role: 'Admin' | 'Staff' | 'Parent'
}) {
  const [sessions, setSessions] = useState<AcademicSessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    active: true,
    activeTerm: 'First Term',
  })

  const canEdit = role === 'Admin'

  async function loadSessions() {
    setLoading(true)
    setError('')

    try {
      const data = await apiRequest<AcademicSessionRecord[]>(
        '/settings/sessions'
      )
      setSessions(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load academic sessions.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSessions()
  }, [])

  function updateForm(
    field: 'name' | 'startDate' | 'endDate' | 'activeTerm',
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function createSession(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!canEdit) {
      setError('Only an administrator can manage academic sessions.')
      return
    }

    setError('')
    setMessage('')

    if (!form.name.trim()) {
      setError('Please enter an academic session name.')
      return
    }

    if (
      form.startDate &&
      form.endDate &&
      form.endDate < form.startDate
    ) {
      setError('End date cannot be earlier than the start date.')
      return
    }

    setSaving(true)

    try {
      await apiRequest('/settings/sessions', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          active: form.active,
          activeTerm: form.activeTerm,
        },
      })

      setForm({
        name: '',
        startDate: '',
        endDate: '',
        active: false,
        activeTerm: 'First Term',
      })

      setMessage('Academic session created successfully.')
      await loadSessions()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create academic session.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function updateSession(
    id: string,
    body: { active?: boolean; activeTerm?: string }
  ) {
    if (!canEdit) {
      setError('Only an administrator can manage academic sessions.')
      return
    }

    setError('')
    setMessage('')
    setUpdating(id)

    try {
      await apiRequest(`/settings/sessions/${id}`, {
        method: 'PATCH',
        body,
      })

      setMessage(
        body.active
          ? 'Academic session is now active.'
          : 'Academic session updated successfully.'
      )

      await loadSessions()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update academic session.'
      )
    } finally {
      setUpdating(null)
    }
  }

  const activeSession = sessions.find((session) => session.active)

  return (
    <section className="academic-session-workspace">
      <div className="academic-session-hero">
        <div>
          <span className="module-eyebrow">{role} Workspace</span>
          <h1>Academic Session</h1>
          <p>
            Manage academic sessions, terms and the school&apos;s
            current academic period.
          </p>
        </div>

        <div className="academic-session-hero-icon">
          <CalendarDays size={24} />
        </div>
      </div>

      {error && (
        <div
          className="academic-session-alert academic-session-alert-error"
          role="alert"
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div
          className="academic-session-alert academic-session-alert-success"
          role="status"
        >
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      <div className="academic-session-current">
        <div>
          <span className="academic-session-label">
            CURRENT ACTIVE SESSION
          </span>

          {activeSession ? (
            <>
              <h2>{activeSession.name}</h2>
              <p>
                {activeSession.activeTerm || 'First Term'}
                {activeSession.startDate
                  ? ` • Starts ${new Date(
                      activeSession.startDate
                    ).toLocaleDateString()}`
                  : ''}
                {activeSession.endDate
                  ? ` • Ends ${new Date(
                      activeSession.endDate
                    ).toLocaleDateString()}`
                  : ''}
              </p>
            </>
          ) : (
            <>
              <h2>No active session</h2>
              <p>Create a session and mark it as active.</p>
            </>
          )}
        </div>

        <div className="academic-session-current-badge">
          <CheckCircle2 size={18} />
          {activeSession ? 'Active' : 'Not configured'}
        </div>
      </div>

      {canEdit && (
        <form
          className="academic-session-create"
          onSubmit={createSession}
        >
          <div className="academic-session-section-heading">
            <div>
              <span className="module-eyebrow">
                SESSION MANAGEMENT
              </span>
              <h2>Create Academic Session</h2>
            </div>
            <CalendarPlus size={22} />
          </div>

          <div className="academic-session-form-grid">
            <label>
              <span>Academic Session</span>
              <input
                value={form.name}
                onChange={(event) =>
                  updateForm('name', event.target.value)
                }
                placeholder="e.g. 2026/2027"
                required
              />
            </label>

            <label>
              <span>Active Term</span>
              <select
                value={form.activeTerm}
                onChange={(event) =>
                  updateForm('activeTerm', event.target.value)
                }
              >
                <option>First Term</option>
                <option>Second Term</option>
                <option>Third Term</option>
              </select>
            </label>

            <label>
              <span>Start Date</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  updateForm('startDate', event.target.value)
                }
              />
            </label>

            <label>
              <span>End Date</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  updateForm('endDate', event.target.value)
                }
              />
            </label>
          </div>

          <label className="academic-session-active-option">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  active: event.target.checked,
                }))
              }
            />
            <span>
              <strong>Make this the active session</strong>
              <small>
                The active session becomes the school&apos;s
                current academic period.
              </small>
            </span>
          </label>

          <button
            type="submit"
            className="academic-session-primary-button"
            disabled={saving}
          >
            <Plus size={18} />
            {saving
              ? 'Creating Session...'
              : 'Create Academic Session'}
          </button>
        </form>
      )}

      <div className="academic-session-list">
        <div className="academic-session-section-heading">
          <div>
            <span className="module-eyebrow">
              ACADEMIC CALENDAR
            </span>
            <h2>Academic Sessions</h2>
          </div>

          <span className="academic-session-count">
            {sessions.length}{' '}
            {sessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>

        {loading ? (
          <div className="academic-session-empty">
            <Loader2
              size={22}
              className="academic-session-spin"
            />
            <span>Loading academic sessions...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="academic-session-empty">
            <CalendarDays size={26} />
            <strong>No academic sessions yet</strong>
            <span>Create the first academic session above.</span>
          </div>
        ) : (
          <div className="academic-session-cards">
            {sessions.map((session) => (
              <article
                key={session.id}
                className={`academic-session-card ${
                  session.active ? 'is-active' : ''
                }`}
              >
                <div className="academic-session-card-top">
                  <div>
                    <div className="academic-session-title-row">
                      <h3>{session.name}</h3>

                      {session.active && (
                        <span className="academic-session-status">
                          <CheckCircle2 size={14} />
                          Active
                        </span>
                      )}
                    </div>

                    <p>
                      {session.startDate
                        ? new Date(
                            session.startDate
                          ).toLocaleDateString()
                        : 'Start date not set'}
                      {' — '}
                      {session.endDate
                        ? new Date(
                            session.endDate
                          ).toLocaleDateString()
                        : 'End date not set'}
                    </p>
                  </div>

                  <GraduationCap size={24} />
                </div>

                <div className="academic-session-card-details">
                  <div>
                    <span>Current Term</span>
                    <strong>
                      {session.activeTerm || 'First Term'}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong>
                      {session.active ? 'Active' : 'Inactive'}
                    </strong>
                  </div>
                </div>

                {canEdit && (
                  <div className="academic-session-card-actions">
                    <label>
                      <span>Change Term</span>
                      <select
                        value={
                          session.activeTerm || 'First Term'
                        }
                        disabled={updating === session.id}
                        onChange={(event) =>
                          updateSession(session.id, {
                            activeTerm: event.target.value,
                          })
                        }
                      >
                        <option>First Term</option>
                        <option>Second Term</option>
                        <option>Third Term</option>
                      </select>
                    </label>

                    {!session.active && (
                      <button
                        type="button"
                        className="academic-session-set-active"
                        disabled={updating === session.id}
                        onClick={() =>
                          updateSession(session.id, {
                            active: true,
                          })
                        }
                      >
                        {updating === session.id ? (
                          <>
                            <Loader2
                              size={16}
                              className="academic-session-spin"
                            />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} />
                            Set Active
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ReportsWorkspace({ role }: { role: 'Admin' | 'Staff' | 'Parent' }) {
  const [report, setReport] = useState<'attendance' | 'academic' | 'financial'>('attendance')
  const [generated, setGenerated] = useState(false)

  const reports = [
    { id: 'attendance', label: 'Attendance Report', icon: CalendarCheck },
    { id: 'academic', label: 'Academic Report', icon: GraduationCap },
    { id: 'financial', label: 'Financial Report', icon: BarChart3 },
  ] as const

  const current = reports.find((item) => item.id === report)!

  const fields =
    report === 'attendance'
      ? ['Class', 'Student', 'From', 'To']
      : report === 'academic'
        ? ['Session', 'Term', 'Class', 'Student']
        : ['Report Type', 'Class', 'From', 'To']

  const kpis =
    report === 'attendance'
      ? ['Attendance Rate', 'Present', 'Absent', 'Late']
      : report === 'academic'
        ? ['Students', 'Average Score', 'Pass Rate', 'Subjects']
        : ['Total Payments', 'Collected', 'Outstanding', 'Transactions']

  return (
    <div className="reports-workspace">
      <div className="reports-hero">
        <div>
          <span className="module-eyebrow">{role} Workspace</span>
          <h1>School Reports</h1>
          <p>Generate clear attendance, academic and financial reports.</p>
        </div>

        <div className="reports-hero-badge">
          <FileBarChart size={20} />
          Reports Centre
        </div>
      </div>

      <div className="reports-nav" role="tablist">
        {reports.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={report === id ? 'active' : ''}
            onClick={() => {
              setReport(id)
              setGenerated(false)
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="reports-summary">
        <div>
          <span>Report Type</span>
          <strong>{current.label}</strong>
          <small>Current workspace</small>
        </div>

        <div>
          <span>Period</span>
          <strong>Selected Range</strong>
          <small>Use the filters below</small>
        </div>

        <div>
          <span>Status</span>
          <strong>{generated ? 'Generated' : 'Ready'}</strong>
          <small>{generated ? 'Preview updated' : 'Awaiting filters'}</small>
        </div>
      </div>

      <section className="reports-panel">
        <div className="reports-panel-heading">
          <div>
            <span className="reports-kicker">
              {current.label.toUpperCase()}
            </span>

            <h2>{current.label}</h2>

            <p>
              {report === 'attendance'
                ? 'Review attendance by student, class and date range.'
                : report === 'academic'
                  ? 'Review results, grades and academic performance by term.'
                  : 'Review payments, balances and school income.'}
            </p>
          </div>

          <button
            type="button"
            className="reports-primary"
            onClick={() => setGenerated(true)}
          >
            Generate Report
          </button>
        </div>

        <div className="reports-filters">
          {fields.map((field) => (
            <label key={field}>
              {field}

              {field === 'Student' ? (
                <input placeholder="Search student" />
              ) : (
                <select>
                  <option>
                    {field === 'Term'
                      ? 'First Term'
                      : field === 'Session'
                        ? 'Current session'
                        : field === 'Report Type'
                          ? 'Payment Summary'
                          : field === 'From' || field === 'To'
                            ? 'Select date'
                            : 'All classes'}
                  </option>
                  <option>All classes</option>
                  <option>JSS 1</option>
                  <option>JSS 2</option>
                  <option>JSS 3</option>
                  <option>SS 1</option>
                  <option>SS 2</option>
                  <option>SS 3</option>
                </select>
              )}
            </label>
          ))}
        </div>

        <div className="reports-kpi-grid">
          {kpis.map((label) => (
            <div key={label}>
              <span>{label}</span>
              <strong>—</strong>
            </div>
          ))}
        </div>

        <div className="reports-preview">
          <current.icon size={30} />

          <h3>
            {generated
              ? `${current.label} generated`
              : `${current.label} preview`}
          </h3>

          <p>
            {generated
              ? 'The workspace is ready for live records when the corresponding backend data is connected.'
              : 'Choose your filters and generate the report.'}
          </p>
        </div>
      </section>
    </div>
  )
}

function AttendanceWorkspace({ role }: { role: 'Admin' | 'Staff' | 'Parent' }) {
  const [view, setView] = useState<'take' | 'view' | 'today' | 'report'>('take')
  const [className, setClassName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [saved, setSaved] = useState(false)

  const views = [
    ['take', 'Take Attendance'],
    ['view', 'View Attendance'],
    ['today', "Today's Attendance"],
    ['report', 'Attendance Report'],
  ] as const

  const students = [
    ['PW-001', 'Student 001', 'Present'],
    ['PW-002', 'Student 002', 'Present'],
    ['PW-003', 'Student 003', 'Absent'],
    ['PW-004', 'Student 004', 'Late'],
    ['PW-005', 'Student 005', 'Present'],
  ]

  return (
    <div className="attendance-workspace">
      <div className="attendance-hero">
        <div>
          <span className="module-eyebrow">{role} Workspace</span>
          <h1>Attendance Management</h1>
          <p>Take attendance, review today's records and generate attendance reports.</p>
        </div>

        <div className="attendance-date-card">
          <CalendarCheck size={20} />
          <span>
            {new Date().toLocaleDateString('en-NG', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      <div className="attendance-nav" role="tablist">
        {views.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={view === id ? 'active' : ''}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="attendance-summary">
        <div><span>Present</span><strong>3</strong><small>Students</small></div>
        <div><span>Absent</span><strong>1</strong><small>Students</small></div>
        <div><span>Late</span><strong>1</strong><small>Students</small></div>
        <div><span>Attendance Rate</span><strong>60%</strong><small>Today's record</small></div>
      </div>

      {view === 'take' && (
        <section className="attendance-panel">
          <div className="attendance-panel-heading">
            <div>
              <span className="attendance-kicker">DAILY REGISTER</span>
              <h2>Take Attendance</h2>
              <p>Select a class and date, then record each student's status.</p>
            </div>

            <button
              type="button"
              className="attendance-save-button"
              onClick={() => setSaved(true)}
            >
              {saved ? 'Attendance Saved' : 'Save Attendance'}
            </button>
          </div>

          {saved && (
            <div className="attendance-success">
              <CheckCircle2 size={18} />
              Attendance for {date} has been saved.
            </div>
          )}

          <div className="attendance-filters">
            <label>
              Class
              <select value={className} onChange={(e) => setClassName(e.target.value)}>
                <option value="">Select class</option>
                <option>JSS 1</option>
                <option>JSS 2</option>
                <option>JSS 3</option>
                <option>SS 1</option>
                <option>SS 2</option>
                <option>SS 3</option>
              </select>
            </label>

            <label>
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>

            <button
              type="button"
              className="attendance-secondary-button"
              onClick={() => setSaved(false)}
            >
              Mark All Present
            </button>
          </div>

          <div className="attendance-table-wrap">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {students.map(([id, name, status]) => (
                  <tr key={id}>
                    <td><strong>{name}</strong></td>
                    <td>{id}</td>
                    <td>
                      <select
                        defaultValue={status}
                        aria-label={`Attendance status for ${name}`}
                      >
                        <option>Present</option>
                        <option>Absent</option>
                        <option>Late</option>
                        <option>Excused</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {view === 'view' && (
        <section className="attendance-panel">
          <div className="attendance-panel-heading">
            <div>
              <span className="attendance-kicker">ATTENDANCE HISTORY</span>
              <h2>View Attendance</h2>
              <p>Search and review recorded attendance by date and class.</p>
            </div>
          </div>

          <div className="attendance-filters">
            <label>
              Class
              <select>
                <option>All classes</option>
                <option>JSS 1</option>
                <option>JSS 2</option>
                <option>SS 1</option>
              </select>
            </label>

            <label>From<input type="date" /></label>
            <label>To<input type="date" /></label>

            <button type="button" className="attendance-secondary-button">
              Search Records
            </button>
          </div>

          <div className="attendance-empty">
            <CalendarCheck size={30} />
            <h3>Attendance records</h3>
            <p>Recorded attendance will appear here when live attendance data is connected.</p>
          </div>
        </section>
      )}

      {view === 'today' && (
        <section className="attendance-panel">
          <div className="attendance-panel-heading">
            <div>
              <span className="attendance-kicker">TODAY</span>
              <h2>Today's Attendance</h2>
              <p>A quick overview of attendance recorded today.</p>
            </div>
          </div>

          <div className="attendance-today-grid">
            <div><strong>5</strong><span>Total students</span></div>
            <div><strong>3</strong><span>Present</span></div>
            <div><strong>1</strong><span>Absent</span></div>
            <div><strong>1</strong><span>Late</span></div>
          </div>

          <div className="attendance-empty">
            <BarChart3 size={30} />
            <h3>Class summary</h3>
            <p>Class-by-class attendance summaries will appear here.</p>
          </div>
        </section>
      )}

      {view === 'report' && (
        <section className="attendance-panel">
          <div className="attendance-panel-heading">
            <div>
              <span className="attendance-kicker">REPORTING</span>
              <h2>Attendance Report</h2>
              <p>Build a report using class, student and date filters.</p>
            </div>

            <button type="button" className="attendance-save-button">
              Generate Report
            </button>
          </div>

          <div className="attendance-filters">
            <label>
              Class
              <select>
                <option>All classes</option>
                <option>JSS 1</option>
                <option>JSS 2</option>
                <option>JSS 3</option>
              </select>
            </label>

            <label>From<input type="date" /></label>
            <label>To<input type="date" /></label>
            <label>Student<input placeholder="Search student" /></label>
          </div>

          <div className="attendance-empty">
            <FileBarChart size={30} />
            <h3>Report preview</h3>
            <p>Choose your filters and generate an attendance report.</p>
          </div>
        </section>
      )}
    </div>
  )
}

export default function ModuleWorkspace({
  role,
  section,
}: ModuleWorkspaceProps) {
  const config = modules[section]

  if (section === 'Academic Session') {
    return <AcademicSessionWorkspace role={role} />
  }

  if (section === 'Attendance') {
    return <AttendanceWorkspace role={role} />
  }

  if (section === 'Reports') {
    return <ReportsWorkspace role={role} />
  }

  if (!config) {
    return (
      <div className="module-workspace">
        <div className="module-empty">
          <Activity size={28} />
          <h2>{section}</h2>
          <p>This module is not configured yet.</p>
        </div>
      </div>
    )
  }

  const Icon = config.icon

  return (
    <div className="module-workspace">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon">
            <Icon size={26} />
          </div>
          <div>
            <div className="module-eyebrow">{role} Workspace</div>
            <h1>{config.title}</h1>
            <p>{config.description}</p>
          </div>
        </div>

        <div className="module-actions">
          {config.actions.map((action) => (
            <button
              key={action}
              type="button"
              className="module-action"
              onClick={() => window.alert(`${action} will be connected to the PWS backend in the next implementation stage.`)}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <div className="module-cards">
        {config.cards.map((card) => (
          <div className="module-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.detail}</small>
          </div>
        ))}
      </div>

      <div className="module-panel">
        <div className="module-panel-heading">
          <div>
            <h2>{config.title}</h2>
            <p>Workspace ready for live PWS data.</p>
          </div>
          <Clock3 size={20} />
        </div>

        <div className="module-placeholder">
          <ShieldCheck size={30} />
          <h3>Connected PWS Workspace</h3>
          <p>
            This section is now connected to the application navigation.
            Live database operations will be attached only to API endpoints
            that exist for this module.
          </p>
        </div>
      </div>
    </div>
  )
}
