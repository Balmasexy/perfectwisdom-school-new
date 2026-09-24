import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Plus,
  Search,
  UserRound,
  X,
} from 'lucide-react'
import { apiRequest } from './api'

type Candidate = {
  id: string
  candidate_id?: string
  first_name: string
  last_name: string
  other_name?: string | null
  phone_number: string
  email?: string | null
  date_of_birth?: string | null
  gender?: string | null
  state_of_origin?: string | null
  lga?: string | null
  nin_last4?: string | null
  exam_year: number
  registration_type: string
  preferred_course?: string | null
  first_choice_institution?: string | null
  second_choice_institution?: string | null
  third_choice_institution?: string | null
  amount: string | number
  payment_reference?: string | null
  payment_status: string
  status: string
  notes?: string | null
  branch_code?: string | null
  branch_name?: string | null
  created_at: string
}

type Branch = {
  id: string
  code: string
  name: string
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

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="management-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function labelize(value: string) {
  return value.replace(/_/g, ' ')
}

export default function EntranceAdmissions() {
  const [records, setRecords] = useState<Candidate[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [form, setForm] = useState<FormState>(initialForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadRecords() {
    try {
      setLoading(true)
      setError('')

      const [candidateRows, branchRows] = await Promise.all([
        apiRequest<Candidate[]>('/jamb/registrations'),
        apiRequest<Branch[]>('/branches'),
      ])

      setRecords(candidateRows)
      setBranches(branchRows)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load entrance records',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRecords()
  }, [])

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
      const searchable = [
        record.candidate_id,
        record.first_name,
        record.last_name,
        record.other_name,
        record.phone_number,
        record.preferred_course,
        record.branch_name,
        record.branch_code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !query || searchable.includes(query)

      const matchesStatus =
        statusFilter === 'ALL' ||
        record.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [records, search, statusFilter])

  const stats = useMemo(
    () => ({
      total: records.length,
      progress: records.filter(
        (record) => record.status === 'IN_PROGRESS',
      ).length,
      completed: records.filter(
        (record) => record.status === 'COMPLETED',
      ).length,
      paid: records.filter(
        (record) => record.payment_status === 'PAID',
      ).length,
    }),
    [records],
  )

  async function createCandidate(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const result = await apiRequest<{
        registration: Candidate
      }>('/jamb/registrations', {
        method: 'POST',
        body: {
          firstName: form.firstName,
          lastName: form.lastName,
          otherName: form.otherName,
          phoneNumber: form.phoneNumber,
          email: form.email,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          stateOfOrigin: form.stateOfOrigin,
          lga: form.lga,
          ninLast4: form.ninLast4,
          examYear: Number(form.examYear),
          registrationType: form.registrationType,
          preferredCourse: form.preferredCourse,
          firstChoiceInstitution:
            form.firstChoiceInstitution,
          secondChoiceInstitution:
            form.secondChoiceInstitution,
          thirdChoiceInstitution:
            form.thirdChoiceInstitution,
          branchId: form.branchId || undefined,
          amount: Number(form.amount || 0),
          paymentReference: form.paymentReference,
          notes: form.notes,
        },
      })

      setRecords((current) => [
        result.registration,
        ...current,
      ])

      setForm(initialForm)
      setFormOpen(false)
      setMessage('Candidate record created successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create candidate',
      )
    } finally {
      setSaving(false)
    }
  }

  async function updateCandidate(
    id: string,
    patch: {
      status?: string
      paymentStatus?: string
    },
  ) {
    try {
      setError('')

      const updated = await apiRequest<Candidate>(
        `/jamb/registrations/${id}`,
        {
          method: 'PATCH',
          body: patch,
        },
      )

      setRecords((current) =>
        current.map((record) =>
          record.id === id
            ? { ...record, ...updated }
            : record,
        ),
      )

      setSelected((current) =>
        current?.id === id
          ? { ...current, ...updated }
          : current,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update candidate',
      )
    }
  }

  return (
    <section className="management-page">
      <div className="management-header">
        <div>
          <span className="section-kicker">
            ADMISSIONS &amp; ENTRANCE
          </span>
          <h1>Candidate Management</h1>
          <p>
            Manage entrance candidates, registration progress
            and payment records from one structured workspace.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setError('')
            setMessage('')
            setFormOpen(true)
          }}
        >
          <Plus size={18} />
          New Candidate
        </button>
      </div>

      <div className="management-note">
        <ClipboardCheck size={19} />
        <span>
          <strong>Internal PWS workflow.</strong>{' '}
          This workspace manages school registration records.
          It is not an official JAMB portal or direct JAMB API.
        </span>
      </div>

      {error && (
        <div className="management-error">
          {error}
        </div>
      )}

      {message && (
        <div className="management-success">
          {message}
        </div>
      )}

      <div className="dashboard-stats management-stats">
        <div>
          <span>Total Candidates</span>
          <strong>{stats.total}</strong>
        </div>

        <div>
          <span>In Progress</span>
          <strong>{stats.progress}</strong>
        </div>

        <div>
          <span>Completed</span>
          <strong>{stats.completed}</strong>
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
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search candidate, phone or course"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="management-card">
        <div className="management-card-heading">
          <div>
            <strong>Candidate Records</strong>
            <span>
              {loading
                ? 'Loading…'
                : `${filteredRecords.length} record(s)`}
            </span>
          </div>

          <UserRound size={20} />
        </div>

        <div className="management-table-wrap">
          <table className="management-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Exam</th>
                <th>Course</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => setSelected(record)}
                >
                  <td>
                    <strong>
                      {record.candidate_id || 'PWS-JMB'}
                    </strong>

                    <span>
                      {record.first_name}{' '}
                      {record.last_name}

                      <small>
                        {record.phone_number}
                      </small>
                    </span>
                  </td>

                  <td>
                    {record.exam_year}
                    <small>
                      {record.registration_type ===
                      'DIRECT_ENTRY'
                        ? 'Direct Entry'
                        : 'UTME'}
                    </small>
                  </td>

                  <td>
                    {record.preferred_course || '—'}
                  </td>

                  <td>
                    {record.branch_code ||
                      record.branch_name ||
                      '—'}
                  </td>

                  <td>
                    <span className="management-badge">
                      {labelize(record.status)}
                    </span>
                  </td>

                  <td>
                    <span className="management-badge">
                      {labelize(record.payment_status)}
                    </span>
                  </td>
                </tr>
              ))}

              {!loading &&
                filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      No candidate records found.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="management-modal-backdrop">
          <div className="management-modal">
            <div className="management-modal-header">
              <div>
                <span className="section-kicker">
                  NEW CANDIDATE
                </span>
                <h2>Entrance Registration</h2>
              </div>

              <button
                type="button"
                onClick={() => setFormOpen(false)}
              >
                <X />
              </button>
            </div>

            <form onSubmit={createCandidate}>
              <div className="management-form-section">
                <h3>Candidate Information</h3>

                <div className="management-form-grid">
                  <Field label="First Name">
                    <input
                      required
                      value={form.firstName}
                      onChange={(event) =>
                        updateField(
                          'firstName',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Last Name">
                    <input
                      required
                      value={form.lastName}
                      onChange={(event) =>
                        updateField(
                          'lastName',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Other Name">
                    <input
                      value={form.otherName}
                      onChange={(event) =>
                        updateField(
                          'otherName',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Phone Number">
                    <input
                      required
                      value={form.phoneNumber}
                      onChange={(event) =>
                        updateField(
                          'phoneNumber',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField(
                          'email',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Date of Birth">
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(event) =>
                        updateField(
                          'dateOfBirth',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Gender">
                    <select
                      value={form.gender}
                      onChange={(event) =>
                        updateField(
                          'gender',
                          event.target.value,
                        )
                      }
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </Field>

                  <Field label="State of Origin">
                    <input
                      value={form.stateOfOrigin}
                      onChange={(event) =>
                        updateField(
                          'stateOfOrigin',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="LGA">
                    <input
                      value={form.lga}
                      onChange={(event) =>
                        updateField(
                          'lga',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="NIN Last 4 Digits">
                    <input
                      maxLength={4}
                      inputMode="numeric"
                      value={form.ninLast4}
                      onChange={(event) =>
                        updateField(
                          'ninLast4',
                          event.target.value
                            .replace(/\D/g, '')
                            .slice(0, 4),
                        )
                      }
                    />
                  </Field>
                </div>
              </div>

              <div className="management-form-section">
                <h3>Examination</h3>

                <div className="management-form-grid">
                  <Field label="Exam Year">
                    <input
                      required
                      type="number"
                      min="2000"
                      max="2100"
                      value={form.examYear}
                      onChange={(event) =>
                        updateField(
                          'examYear',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Registration Type">
                    <select
                      value={form.registrationType}
                      onChange={(event) =>
                        updateField(
                          'registrationType',
                          event.target.value,
                        )
                      }
                    >
                      <option value="UTME">UTME</option>
                      <option value="DIRECT_ENTRY">
                        Direct Entry
                      </option>
                    </select>
                  </Field>

                  <Field label="Preferred Course">
                    <input
                      value={form.preferredCourse}
                      onChange={(event) =>
                        updateField(
                          'preferredCourse',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="First Choice Institution">
                    <input
                      value={form.firstChoiceInstitution}
                      onChange={(event) =>
                        updateField(
                          'firstChoiceInstitution',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Second Choice Institution">
                    <input
                      value={form.secondChoiceInstitution}
                      onChange={(event) =>
                        updateField(
                          'secondChoiceInstitution',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Third Choice Institution">
                    <input
                      value={form.thirdChoiceInstitution}
                      onChange={(event) =>
                        updateField(
                          'thirdChoiceInstitution',
                          event.target.value,
                        )
                      }
                    />
                  </Field>
                </div>
              </div>

              <div className="management-form-section">
                <h3>Centre &amp; Payment</h3>

                <div className="management-form-grid">
                  <Field label="Branch">
                    <select
                      value={form.branchId}
                      onChange={(event) =>
                        updateField(
                          'branchId',
                          event.target.value,
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
                          {branch.code} — {branch.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Amount">
                    <input
                      type="number"
                      min="0"
                      value={form.amount}
                      onChange={(event) =>
                        updateField(
                          'amount',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Payment Reference">
                    <input
                      value={form.paymentReference}
                      onChange={(event) =>
                        updateField(
                          'paymentReference',
                          event.target.value,
                        )
                      }
                      placeholder="Transaction reference"
                    />
                  </Field>

                  <Field label="Notes">
                    <textarea
                      value={form.notes}
                      onChange={(event) =>
                        updateField(
                          'notes',
                          event.target.value,
                        )
                      }
                      rows={4}
                    />
                  </Field>
                </div>
              </div>

              <div className="management-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving…'
                    : 'Create Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="management-modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <div
            className="management-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="management-modal-header">
              <div>
                <span className="section-kicker">
                  CANDIDATE PROFILE
                </span>

                <h2>
                  {selected.first_name}{' '}
                  {selected.last_name}
                </h2>

                <p>
                  {selected.candidate_id || 'PWS-JMB'}
                  {' · '}
                  {selected.exam_year}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
              >
                <X />
              </button>
            </div>

            <div className="management-detail-grid">
              <div>
                <UserRound size={18} />

                <span>
                  Candidate ID
                  <strong>
                    {selected.candidate_id || '—'}
                  </strong>
                </span>
              </div>

              <div>
                <CreditCard size={18} />

                <span>
                  Payment
                  <strong>
                    {labelize(
                      selected.payment_status,
                    )}
                  </strong>
                </span>
              </div>

              <div>
                <Clock3 size={18} />

                <span>
                  Registration
                  <strong>
                    {labelize(selected.status)}
                  </strong>
                </span>
              </div>

              <div>
                <CheckCircle2 size={18} />

                <span>
                  Branch
                  <strong>
                    {selected.branch_name ||
                      selected.branch_code ||
                      '—'}
                  </strong>
                </span>
              </div>
            </div>

            <div className="management-modal-actions">
              <select
                value={selected.status}
                onChange={(event) =>
                  void updateCandidate(
                    selected.id,
                    {
                      status: event.target.value,
                    },
                  )
                }
              >
                <option value="DRAFT">Draft</option>
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

              <select
                value={selected.payment_status}
                onChange={(event) =>
                  void updateCandidate(
                    selected.id,
                    {
                      paymentStatus:
                        event.target.value,
                    },
                  )
                }
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="REFUNDED">
                  Refunded
                </option>
              </select>

              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
