import React, { useState } from 'react'
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

  if (section === 'Attendance') {
    return <AttendanceWorkspace role={role} />
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
