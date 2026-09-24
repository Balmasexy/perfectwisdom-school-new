import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  FilePlus2,
  GraduationCap,
  Search,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { apiRequest } from './api'

type Admission = {
  id: string
  application_id: string
  first_name: string
  last_name: string
  other_name: string | null
  phone_number: string
  email: string | null
  date_of_birth: string | null
  gender: string | null
  state_of_origin: string | null
  lga: string | null
  address: string | null
  parent_first_name: string | null
  parent_last_name: string | null
  parent_phone_number: string | null
  parent_email: string | null
  parent_relationship: string | null
  previous_school: string | null
  desired_class_id: string | null
  desired_class_name: string | null
  desired_class_code: string | null
  branch_id: string | null
  branch_name: string | null
  branch_code: string | null
  application_date: string
  status: string
  application_fee: string | number
  payment_status: string
  payment_reference: string | null
  notes: string | null
  converted_student_id: string | null
  converted_student_number: string | null
}

type Branch = {
  id: string
  name: string
  code: string
}

type SchoolClass = {
  id: string
  name: string
  code: string
  branchId: string | null
}

const emptyForm = {
  firstName: '',
  lastName: '',
  otherName: '',
  phoneNumber: '',
  email: '',
  dateOfBirth: '',
  gender: 'MALE',
  stateOfOrigin: '',
  lga: '',
  address: '',
  parentFirstName: '',
  parentLastName: '',
  parentPhoneNumber: '',
  parentEmail: '',
  parentRelationship: '',
  previousSchool: '',
  desiredClassId: '',
  branchId: '',
  applicationDate: new Date().toISOString().slice(0, 10),
  applicationFee: '',
  paymentStatus: 'UNPAID',
  paymentReference: '',
  notes: '',
}

function statusLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge admission-status-${status.toLowerCase()}`}>
      {statusLabel(status)}
    </span>
  )
}

export default function Admissions() {
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Admission | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  async function load() {
    try {
      setLoading(true)
      setError('')

      const [admissionData, branchData, classData] = await Promise.all([
        apiRequest<any[]>('/admissions'),
        apiRequest<any[]>('/branches'),
        apiRequest<any[]>('/classes'),
      ])

      setAdmissions(admissionData)
      setBranches(branchData)
      setClasses(
        classData.map((item) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          branchId: item.branchId ?? null,
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return admissions.filter((item) => {
      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter

      const text = [
        item.application_id,
        item.first_name,
        item.last_name,
        item.phone_number,
        item.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return matchesStatus && (!query || text.includes(query))
    })
  }, [admissions, search, statusFilter])

  const stats = useMemo(
    () => ({
      total: admissions.length,
      new: admissions.filter((item) => item.status === 'NEW').length,
      review: admissions.filter((item) => item.status === 'UNDER_REVIEW').length,
      accepted: admissions.filter((item) => item.status === 'ACCEPTED').length,
      enrolled: admissions.filter((item) => item.status === 'ENROLLED').length,
      paid: admissions.filter((item) => item.payment_status === 'PAID').length,
    }),
    [admissions],
  )

  function updateField(
    key: keyof typeof emptyForm,
    value: string,
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function createApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      setMessage('')

      await apiRequest('/admissions', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          applicationFee: form.applicationFee || 0,
          desiredClassId: form.desiredClassId || undefined,
          branchId: form.branchId || undefined,
        }),
      })

      setForm(emptyForm)
      setShowForm(false)
      setMessage('Admission application created successfully.')
      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create admission application',
      )
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(
    id: string,
    status: string,
    paymentStatus?: string,
  ) {
    try {
      await apiRequest(`/admissions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          paymentStatus,
        }),
      })

      setMessage('Admission record updated.')
      const fresh = await apiRequest<Admission>(`/admissions/${id}`)
      setSelected(fresh)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update admission')
    }
  }

  async function enrollApplicant() {
    if (!selected) return

    try {
      setEnrolling(true)
      setError('')

      const result = await apiRequest<{
        studentNumber: string
        message: string
      }>(`/admissions/${selected.id}/enroll`, {
        method: 'POST',
        body: JSON.stringify({
          branchId: selected.branch_id || undefined,
          classId: selected.desired_class_id || undefined,
        }),
      })

      setMessage(
        `${result.message} Student ID: ${result.studentNumber}`,
      )

      const fresh = await apiRequest<Admission>(
        `/admissions/${selected.id}`,
      )

      setSelected(fresh)
      await load()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to enroll applicant',
      )
    } finally {
      setEnrolling(false)
    }
  }

  const availableClasses = form.branchId
    ? classes.filter(
        (item) => !item.branchId || item.branchId === form.branchId,
      )
    : classes

  return (
    <section className="management-page">
      <div className="dashboard-welcome">
        <span className="section-kicker">ADMISSIONS MANAGEMENT</span>
        <h1>Admissions</h1>
        <p>
          Manage applications from first contact through review, admission and
          student enrollment.
        </p>
      </div>

      {message && (
        <div className="security-success">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && <div className="management-error">{error}</div>}

      <div className="dashboard-stats">
        <div>
          <span>Total Applications</span>
          <strong>{stats.total}</strong>
        </div>
        <div>
          <span>New</span>
          <strong>{stats.new}</strong>
        </div>
        <div>
          <span>Under Review</span>
          <strong>{stats.review}</strong>
        </div>
        <div>
          <span>Accepted</span>
          <strong>{stats.accepted}</strong>
        </div>
        <div>
          <span>Enrolled</span>
          <strong>{stats.enrolled}</strong>
        </div>
        <div>
          <span>Paid</span>
          <strong>{stats.paid}</strong>
        </div>
      </div>

      <div className="management-toolbar">
        <div className="management-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search applicant, application ID or phone..."
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="NEW">New</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="WAITLISTED">Waitlisted</option>
          <option value="REJECTED">Rejected</option>
          <option value="ENROLLED">Enrolled</option>
        </select>

        <button
          type="button"
          className="management-primary-button"
          onClick={() => setShowForm(true)}
        >
          <FilePlus2 size={18} />
          New Application
        </button>
      </div>

      <div className="management-card">
        <div className="management-card-header">
          <div>
            <h2>Admission Applications</h2>
            <p>{filtered.length} application(s)</p>
          </div>
        </div>

        {loading ? (
          <div className="management-empty">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="management-empty">
            No admission applications found.
            <span>Create a new application to begin.</span>
          </div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Applicant</th>
                  <th>Phone</th>
                  <th>Desired Class</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{item.application_id}</td>
                    <td>
                      {item.first_name} {item.last_name}
                    </td>
                    <td>{item.phone_number}</td>
                    <td>{item.desired_class_name || '—'}</td>
                    <td>{item.branch_name || '—'}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>{statusLabel(item.payment_status)}</td>
                    <td>
                      <button
                        type="button"
                        className="management-secondary-button"
                        onClick={() => setSelected(item)}
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="management-modal-backdrop">
          <div className="management-modal">
            <div className="management-modal-header">
              <div>
                <span className="section-kicker">NEW APPLICATION</span>
                <h2>Admission Application</h2>
              </div>
              <button
                type="button"
                className="management-icon-button"
                onClick={() => setShowForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createApplication}>
              <div className="management-form-section">
                <h3>
                  <UserRound size={18} />
                  Applicant Information
                </h3>

                <div className="management-form-grid">
                  <label>
                    First Name *
                    <input
                      required
                      value={form.firstName}
                      onChange={(event) =>
                        updateField('firstName', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Last Name *
                    <input
                      required
                      value={form.lastName}
                      onChange={(event) =>
                        updateField('lastName', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Other Name
                    <input
                      value={form.otherName}
                      onChange={(event) =>
                        updateField('otherName', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Phone *
                    <input
                      required
                      type="tel"
                      value={form.phoneNumber}
                      onChange={(event) =>
                        updateField('phoneNumber', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField('email', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Date of Birth
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(event) =>
                        updateField('dateOfBirth', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Gender
                    <select
                      value={form.gender}
                      onChange={(event) =>
                        updateField('gender', event.target.value)
                      }
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>

                  <label>
                    State of Origin
                    <input
                      value={form.stateOfOrigin}
                      onChange={(event) =>
                        updateField('stateOfOrigin', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    LGA
                    <input
                      value={form.lga}
                      onChange={(event) =>
                        updateField('lga', event.target.value)
                      }
                    />
                  </label>

                  <label className="management-form-full">
                    Address
                    <textarea
                      value={form.address}
                      onChange={(event) =>
                        updateField('address', event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="management-form-section">
                <h3>
                  <Users size={18} />
                  Parent / Guardian
                </h3>

                <div className="management-form-grid">
                  <label>
                    First Name
                    <input
                      value={form.parentFirstName}
                      onChange={(event) =>
                        updateField('parentFirstName', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Last Name
                    <input
                      value={form.parentLastName}
                      onChange={(event) =>
                        updateField('parentLastName', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Phone
                    <input
                      type="tel"
                      value={form.parentPhoneNumber}
                      onChange={(event) =>
                        updateField('parentPhoneNumber', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={form.parentEmail}
                      onChange={(event) =>
                        updateField('parentEmail', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Relationship
                    <input
                      placeholder="Parent, Guardian..."
                      value={form.parentRelationship}
                      onChange={(event) =>
                        updateField('parentRelationship', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Previous School
                    <input
                      value={form.previousSchool}
                      onChange={(event) =>
                        updateField('previousSchool', event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="management-form-section">
                <h3>
                  <GraduationCap size={18} />
                  Admission Placement
                </h3>

                <div className="management-form-grid">
                  <label>
                    Branch
                    <select
                      value={form.branchId}
                      onChange={(event) => {
                        updateField('branchId', event.target.value)
                        updateField('desiredClassId', '')
                      }}
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
                    Desired Class
                    <select
                      value={form.desiredClassId}
                      onChange={(event) =>
                        updateField('desiredClassId', event.target.value)
                      }
                    >
                      <option value="">Select class</option>
                      {availableClasses.map((schoolClass) => (
                        <option key={schoolClass.id} value={schoolClass.id}>
                          {schoolClass.name} ({schoolClass.code})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Application Date
                    <input
                      type="date"
                      value={form.applicationDate}
                      onChange={(event) =>
                        updateField('applicationDate', event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="management-form-section">
                <h3>
                  <CreditCard size={18} />
                  Application Fee
                </h3>

                <div className="management-form-grid">
                  <label>
                    Fee Amount
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.applicationFee}
                      onChange={(event) =>
                        updateField('applicationFee', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Payment Status
                    <select
                      value={form.paymentStatus}
                      onChange={(event) =>
                        updateField('paymentStatus', event.target.value)
                      }
                    >
                      <option value="UNPAID">Unpaid</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="PAID">Paid</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>
                  </label>

                  <label>
                    Payment Reference
                    <input
                      value={form.paymentReference}
                      onChange={(event) =>
                        updateField('paymentReference', event.target.value)
                      }
                    />
                  </label>

                  <label className="management-form-full">
                    Notes
                    <textarea
                      value={form.notes}
                      onChange={(event) =>
                        updateField('notes', event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="management-form-actions">
                <button
                  type="button"
                  className="management-secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="management-primary-button"
                  disabled={saving}
                >
                  {saving ? 'Creating...' : 'Create Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="management-modal-backdrop">
          <div className="management-modal">
            <div className="management-modal-header">
              <div>
                <span className="section-kicker">
                  {selected.application_id}
                </span>
                <h2>
                  {selected.first_name} {selected.last_name}
                </h2>
              </div>

              <button
                type="button"
                className="management-icon-button"
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="management-detail-grid">
              <div>
                <span>Application Status</span>
                <StatusBadge status={selected.status} />
              </div>
              <div>
                <span>Payment</span>
                <strong>{statusLabel(selected.payment_status)}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{selected.phone_number}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{selected.email || '—'}</strong>
              </div>
              <div>
                <span>Branch</span>
                <strong>{selected.branch_name || '—'}</strong>
              </div>
              <div>
                <span>Desired Class</span>
                <strong>{selected.desired_class_name || '—'}</strong>
              </div>
              <div>
                <span>Previous School</span>
                <strong>{selected.previous_school || '—'}</strong>
              </div>
              <div>
                <span>Parent / Guardian</span>
                <strong>
                  {selected.parent_first_name
                    ? `${selected.parent_first_name} ${selected.parent_last_name || ''}`
                    : '—'}
                </strong>
              </div>
            </div>

            <div className="management-form-section">
              <h3>
                <Clock3 size={18} />
                Admission Decision
              </h3>

              <div className="management-form-grid">
                <label>
                  Status
                  <select
                    value={selected.status}
                    onChange={(event) =>
                      void updateStatus(
                        selected.id,
                        event.target.value,
                        selected.payment_status,
                      )
                    }
                  >
                    <option value="NEW">New</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="WAITLISTED">Waitlisted</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="ENROLLED">Enrolled</option>
                  </select>
                </label>

                <label>
                  Payment Status
                  <select
                    value={selected.payment_status}
                    onChange={(event) =>
                      void updateStatus(
                        selected.id,
                        selected.status,
                        event.target.value,
                      )
                    }
                  >
                    <option value="UNPAID">Unpaid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PAID">Paid</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </label>
              </div>
            </div>

            {selected.converted_student_number ? (
              <div className="security-success">
                <CheckCircle2 size={18} />
                <span>
                  Enrolled as {selected.converted_student_number}
                </span>
              </div>
            ) : selected.status === 'ACCEPTED' ? (
              <button
                type="button"
                className="management-primary-button"
                disabled={enrolling}
                onClick={() => void enrollApplicant()}
              >
                <GraduationCap size={18} />
                {enrolling ? 'Enrolling...' : 'Accept & Enroll Student'}
              </button>
            ) : (
              <div className="management-empty">
                Accept this application before enrolling the applicant as a
                student.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
