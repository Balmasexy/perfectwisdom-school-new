import React, { useEffect, useState } from 'react'
import {
  GraduationCap,
  Plus,
  Search,
  RefreshCw,
  X,
  UserPlus,
  Users,
  UserCheck,
  UserX,
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
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null
  address: string | null
  branchId: string | null
  branchName: string | null
  branchCode: string | null
  parentId: string | null
  parentFirstName: string | null
  parentLastName: string | null
  parentPhoneNumber: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

type Branch = {
  id: string
  name: string
  code: string
}

type Summary = {
  total: number
  active: number
  inactive: number
  suspended: number
}

const emptyForm = {
  firstName: '',
  lastName: '',
  otherName: '',
  phoneNumber: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  branchId: '',
  parentId: '',
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
  })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Student | null>(null)
  const [form, setForm] = useState(emptyForm)

  async function load() {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()

      if (search.trim()) params.set('search', search.trim())
      if (status) params.set('status', status)

      const [studentData, summaryData, branchData] = await Promise.all([
        apiRequest<{ students: Student[] }>(
          `/students${params.toString() ? `?${params}` : ''}`,
        ),
        apiRequest<Summary>('/students/summary'),
        apiRequest<Branch[]>('/branches'),
      ])

      setStudents(studentData.students || [])
      setSummary({
        total: Number(summaryData.total || 0),
        active: Number(summaryData.active || 0),
        inactive: Number(summaryData.inactive || 0),
        suspended: Number(summaryData.suspended || 0),
      })
      setBranches(branchData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function createStudent(event: React.FormEvent) {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      await apiRequest('/students', {
        method: 'POST',
        body: {
          firstName: form.firstName,
          lastName: form.lastName,
          otherName: form.otherName || undefined,
          phoneNumber: form.phoneNumber,
          dateOfBirth: form.dateOfBirth || undefined,
          gender: form.gender || undefined,
          address: form.address || undefined,
          branchId: form.branchId || undefined,
          parentId: form.parentId || undefined,
        },
      })

      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create student')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="module-workspace">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon">
            <GraduationCap size={26} />
          </div>

          <div>
            <div className="module-eyebrow">PWS Student Administration</div>
            <h1>Student Management</h1>
            <p>
              Register students, manage their school records and connect them
              to branches and parents.
            </p>
          </div>
        </div>

        <button
          className="module-action"
          type="button"
          onClick={() => {
            setError('')
            setShowForm(true)
          }}
        >
          <Plus size={17} />
          Add Student
        </button>
      </div>

      <div className="module-cards">
        <div className="module-card">
          <Users size={19} />
          <span>Total Students</span>
          <strong>{summary.total}</strong>
          <small>All registered students</small>
        </div>

        <div className="module-card">
          <UserCheck size={19} />
          <span>Active</span>
          <strong>{summary.active}</strong>
          <small>Currently enrolled</small>
        </div>

        <div className="module-card">
          <UserX size={19} />
          <span>Inactive</span>
          <strong>{summary.inactive}</strong>
          <small>Inactive records</small>
        </div>

        <div className="module-card">
          <UserPlus size={19} />
          <span>Suspended</span>
          <strong>{summary.suspended}</strong>
          <small>Require attention</small>
        </div>
      </div>

      {error && (
        <div className="module-error">
          {error}
        </div>
      )}

      <div className="module-panel">
        <div className="module-panel-heading">
          <div>
            <h2>Student Records</h2>
            <p>Search and review registered students.</p>
          </div>

          <button
            type="button"
            className="module-refresh"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="student-toolbar">
          <div className="student-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void load()
              }}
              placeholder="Search student ID, name or phone..."
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setTimeout(() => void load(), 0)
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <div className="student-table-wrap">
          {loading ? (
            <div className="module-placeholder">
              <RefreshCw size={28} className="spin" />
              <h3>Loading students</h3>
              <p>Retrieving live student records...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="module-placeholder">
              <GraduationCap size={30} />
              <h3>No students found</h3>
              <p>
                No records match the current filters. Add the first student
                or change the search.
              </p>
            </div>
          ) : (
            <table className="student-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student</th>
                  <th>Phone</th>
                  <th>Branch</th>
                  <th>Parent</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => setSelected(student)}
                  >
                    <td>
                      <strong>{student.studentId}</strong>
                    </td>
                    <td>
                      <strong>
                        {student.firstName} {student.lastName}
                      </strong>
                      {student.otherName && (
                        <small>{student.otherName}</small>
                      )}
                    </td>
                    <td>{student.phoneNumber}</td>
                    <td>
                      {student.branchName
                        ? `${student.branchName} (${student.branchCode || '—'})`
                        : 'Not assigned'}
                    </td>
                    <td>
                      {student.parentFirstName
                        ? `${student.parentFirstName} ${student.parentLastName || ''}`
                        : 'Not linked'}
                    </td>
                    <td>
                      <span className={`status-pill ${student.status.toLowerCase()}`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <div className="student-modal">
            <div className="student-modal-header">
              <div>
                <div className="module-eyebrow">New PWS Record</div>
                <h2>Register Student</h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="icon-button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createStudent}>
              <div className="student-form-grid">
                <label>
                  First Name *
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                  />
                </label>

                <label>
                  Last Name *
                  <input
                    required
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                  />
                </label>

                <label>
                  Other Name
                  <input
                    value={form.otherName}
                    onChange={(e) =>
                      setForm({ ...form, otherName: e.target.value })
                    }
                  />
                </label>

                <label>
                  Phone Number *
                  <input
                    required
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm({ ...form, phoneNumber: e.target.value })
                    }
                  />
                </label>

                <label>
                  Date of Birth
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      setForm({ ...form, dateOfBirth: e.target.value })
                    }
                  />
                </label>

                <label>
                  Gender
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value })
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                <label>
                  Branch
                  <select
                    value={form.branchId}
                    onChange={(e) =>
                      setForm({ ...form, branchId: e.target.value })
                    }
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="full-width">
                  Address
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="student-form-note">
                A unique PWS student ID will be generated automatically.
              </div>

              <div className="student-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop">
          <div className="student-modal">
            <div className="student-modal-header">
              <div>
                <div className="module-eyebrow">{selected.studentId}</div>
                <h2>
                  {selected.firstName} {selected.lastName}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="icon-button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="student-detail-grid">
              <div>
                <span>Status</span>
                <strong>{selected.status}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{selected.phoneNumber}</strong>
              </div>
              <div>
                <span>Gender</span>
                <strong>{selected.gender || 'Not provided'}</strong>
              </div>
              <div>
                <span>Date of Birth</span>
                <strong>{selected.dateOfBirth || 'Not provided'}</strong>
              </div>
              <div>
                <span>Branch</span>
                <strong>
                  {selected.branchName || 'Not assigned'}
                </strong>
              </div>
              <div>
                <span>Parent</span>
                <strong>
                  {selected.parentFirstName
                    ? `${selected.parentFirstName} ${selected.parentLastName || ''}`
                    : 'Not linked'}
                </strong>
              </div>
              <div className="full-width">
                <span>Address</span>
                <strong>{selected.address || 'Not provided'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
