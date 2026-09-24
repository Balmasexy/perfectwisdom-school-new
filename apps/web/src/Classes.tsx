import React, { useEffect, useState } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Users,
  UserCheck,
  X,
  ChevronRight,
} from 'lucide-react'
import { apiRequest } from './api'

type Branch = {
  id: string
  name: string
  code: string
}

type Teacher = {
  id: string
  firstName: string
  lastName: string
}

type Student = {
  id: string
  studentId: string
  firstName: string
  lastName: string
  otherName: string | null
  status: string
}

type SchoolClass = {
  id: string
  name: string
  code: string
  branchId: string | null
  branchName: string | null
  branchCode: string | null
  teacherId: string | null
  teacherFirstName: string | null
  teacherLastName: string | null
  studentCount: number
}

type ClassDetails = SchoolClass & {
  students: Student[]
}

const emptyForm = {
  name: '',
  code: '',
  branchId: '',
  teacherId: '',
}

export default function Classes() {
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [selected, setSelected] = useState<ClassDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  async function load() {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()

      if (search.trim()) {
        params.set('search', search.trim())
      }

      if (branchId) {
        params.set('branchId', branchId)
      }

      const [classData, branchData, staffData] = await Promise.all([
        apiRequest<SchoolClass[]>(
          `/classes${params.toString() ? `?${params}` : ''}`,
        ),
        apiRequest<Branch[]>('/branches'),
        apiRequest<Teacher[]>('/staff'),
      ])

      setClasses(classData || [])
      setBranches(branchData || [])
      setTeachers(staffData || [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load classes',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function createClass(event: React.FormEvent) {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      await apiRequest('/classes', {
        method: 'POST',
        body: {
          name: form.name,
          code: form.code,
          branchId: form.branchId || undefined,
          teacherId: form.teacherId || undefined,
        },
      })

      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create class',
      )
    } finally {
      setSaving(false)
    }
  }

  async function openClass(id: string) {
    try {
      setDetailsLoading(true)
      setError('')

      const data = await apiRequest<ClassDetails>(`/classes/${id}`)
      setSelected(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load class',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  const totalStudents = classes.reduce(
    (total, item) => total + Number(item.studentCount || 0),
    0,
  )

  return (
    <div className="module-workspace">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon">
            <BookOpen size={26} />
          </div>

          <div>
            <div className="module-eyebrow">
              PWS Academic Administration
            </div>
            <h1>Classes</h1>
            <p>
              Create classes, assign teachers and view enrolled students.
            </p>
          </div>
        </div>

        <button
          className="module-action"
          type="button"
          onClick={() => {
            setError('')
            setForm(emptyForm)
            setShowForm(true)
          }}
        >
          <Plus size={17} />
          Add Class
        </button>
      </div>

      <div className="module-cards">
        <div className="module-card">
          <BookOpen size={19} />
          <span>Total Classes</span>
          <strong>{classes.length}</strong>
          <small>Registered classes</small>
        </div>

        <div className="module-card">
          <Users size={19} />
          <span>Students Assigned</span>
          <strong>{totalStudents}</strong>
          <small>Across listed classes</small>
        </div>

        <div className="module-card">
          <UserCheck size={19} />
          <span>Teachers Assigned</span>
          <strong>
            {classes.filter((item) => item.teacherId).length}
          </strong>
          <small>Classes with a teacher</small>
        </div>
      </div>

      {error && <div className="module-error">{error}</div>}

      <div className="module-panel">
        <div className="module-panel-heading">
          <div>
            <h2>Class Directory</h2>
            <p>Manage your school's classes and student enrollment.</p>
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
                if (event.key === 'Enter') {
                  void load()
                }
              }}
              placeholder="Search class name or code..."
            />
          </div>

          <select
            value={branchId}
            onChange={(event) => {
              setBranchId(event.target.value)
              setTimeout(() => void load(), 0)
            }}
          >
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} ({branch.code})
              </option>
            ))}
          </select>
        </div>

        <div className="student-table-wrap">
          {loading ? (
            <div className="module-placeholder">
              <RefreshCw size={28} className="spin" />
              <h3>Loading classes</h3>
              <p>Retrieving live class records...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="module-placeholder">
              <BookOpen size={30} />
              <h3>No classes found</h3>
              <p>
                Create your first class to begin assigning students and
                teachers.
              </p>
            </div>
          ) : (
            <table className="student-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Code</th>
                  <th>Branch</th>
                  <th>Teacher</th>
                  <th>Students</th>
                  <th>View</th>
                </tr>
              </thead>

              <tbody>
                {classes.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => void openClass(item.id)}
                  >
                    <td>
                      <strong>{item.name}</strong>
                    </td>

                    <td>
                      <strong>{item.code}</strong>
                    </td>

                    <td>
                      {item.branchName
                        ? `${item.branchName} (${item.branchCode || '—'})`
                        : 'Not assigned'}
                    </td>

                    <td>
                      {item.teacherFirstName
                        ? `${item.teacherFirstName} ${item.teacherLastName || ''}`
                        : 'Not assigned'}
                    </td>

                    <td>
                      <strong>{Number(item.studentCount || 0)}</strong>
                    </td>

                    <td>
                      <ChevronRight size={18} />
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
                <div className="module-eyebrow">
                  New Academic Record
                </div>
                <h2>Create Class</h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="icon-button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createClass}>
              <div className="student-form-grid">
                <label>
                  Class Name *
                  <input
                    required
                    value={form.name}
                    placeholder="e.g. JSS 1"
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                  />
                </label>

                <label>
                  Class Code *
                  <input
                    required
                    value={form.code}
                    placeholder="e.g. JSS1-A"
                    onChange={(event) =>
                      setForm({
                        ...form,
                        code: event.target.value.toUpperCase(),
                      })
                    }
                  />
                </label>

                <label>
                  Branch
                  <select
                    value={form.branchId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        branchId: event.target.value,
                      })
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

                <label>
                  Class Teacher
                  <select
                    value={form.teacherId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        teacherId: event.target.value,
                      })
                    }
                  >
                    <option value="">Select teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="student-form-note">
                Students can be connected to this class from their
                Student Profile.
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
                  {saving ? 'Creating...' : 'Create Class'}
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
                <div className="module-eyebrow">
                  {selected.code}
                </div>
                <h2>{selected.name}</h2>
                <p>
                  {selected.branchName || 'No branch assigned'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="icon-button"
              >
                <X size={20} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="module-placeholder">
                <RefreshCw size={25} className="spin" />
                <h3>Loading class</h3>
              </div>
            ) : (
              <>
                <div className="student-detail-grid">
                  <div>
                    <span>Class Code</span>
                    <strong>{selected.code}</strong>
                  </div>

                  <div>
                    <span>Teacher</span>
                    <strong>
                      {selected.teacherFirstName
                        ? `${selected.teacherFirstName} ${selected.teacherLastName || ''}`
                        : 'Not assigned'}
                    </strong>
                  </div>

                  <div>
                    <span>Branch</span>
                    <strong>
                      {selected.branchName || 'Not assigned'}
                    </strong>
                  </div>

                  <div>
                    <span>Students</span>
                    <strong>{selected.studentCount}</strong>
                  </div>
                </div>

                <div className="module-panel">
                  <div className="module-panel-heading">
                    <div>
                      <h2>Enrolled Students</h2>
                      <p>
                        Students currently assigned to this class.
                      </p>
                    </div>
                  </div>

                  {selected.students.length === 0 ? (
                    <div className="module-placeholder">
                      <Users size={28} />
                      <h3>No students assigned</h3>
                      <p>
                        Open a student profile to assign the student to
                        this class.
                      </p>
                    </div>
                  ) : (
                    <div className="student-table-wrap">
                      <table className="student-table">
                        <thead>
                          <tr>
                            <th>Student ID</th>
                            <th>Student</th>
                            <th>Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selected.students.map((student) => (
                            <tr key={student.id}>
                              <td>
                                <strong>{student.studentId}</strong>
                              </td>
                              <td>
                                {student.firstName} {student.lastName}
                                {student.otherName
                                  ? ` ${student.otherName}`
                                  : ''}
                              </td>
                              <td>
                                <span
                                  className={`status-pill ${student.status.toLowerCase()}`}
                                >
                                  {student.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
