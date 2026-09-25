import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Search,
  UserRound,
} from 'lucide-react'
import { apiRequest } from './api'

type Branch = {
  id: string
  code: string
  name: string
}

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
  branch_code?: string | null
  branch_name?: string | null
  created_at: string
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

export default function JambRegistration() {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'passport'
  >('profile')

  const [records, setRecords] = useState<Candidate[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState>(initialForm)

  async function loadData() {
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
          : 'Unable to load JAMB registration records',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function updateField(
    field: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function submitRegistration(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setMessage('')

    if (
      form.ninLast4 &&
      !/^\d{4}$/.test(form.ninLast4)
    ) {
      setError('NIN must contain exactly the last 4 digits.')
      setSaving(false)
      return
    }

    try {
      await apiRequest('/jamb/registrations', {
        method: 'POST',
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          otherName: form.otherName || undefined,
          phoneNumber: form.phoneNumber,
          email: form.email || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          gender: form.gender || undefined,
          stateOfOrigin: form.stateOfOrigin || undefined,
          lga: form.lga || undefined,
          ninLast4: form.ninLast4 || undefined,
          examYear: Number(form.examYear),
          registrationType: form.registrationType,
          preferredCourse: form.preferredCourse || undefined,
          firstChoiceInstitution:
            form.firstChoiceInstitution || undefined,
          secondChoiceInstitution:
            form.secondChoiceInstitution || undefined,
          thirdChoiceInstitution:
            form.thirdChoiceInstitution || undefined,
          branchId: form.branchId || undefined,
          amount: Number(form.amount || 0),
          paymentReference:
            form.paymentReference || undefined,
          notes: form.notes || undefined,
        }),
      })

      setForm(initialForm)
      setMessage('JAMB candidate profile registered successfully.')
      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to register JAMB candidate',
      )
    } finally {
      setSaving(false)
    }
  }

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return records
    }

    return records.filter((record) =>
      [
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
        .includes(query),
    )
  }, [records, search])

  const total = records.length
  const completed = records.filter(
    (record) => record.status === 'COMPLETED',
  ).length
  const paid = records.filter(
    (record) => record.payment_status === 'PAID',
  ).length

  return (
    <section className="management-page registration-workspace">
      <div className="dashboard-welcome">
        <span className="section-kicker">
          JAMB REGISTRATION
        </span>

        <h1>JAMB Registration</h1>

        <p>
          Manage candidate profiles and passport information
          through the Perfect Wisdom School registration workflow.
        </p>
      </div>

      <div className="management-note">
        <ClipboardCheck size={19} />

        <span>
          <strong>Internal PWS workflow.</strong>{' '}
          This module records and manages school registration
          information. It is not a direct official JAMB API
          or portal integration.
        </span>
      </div>

      {error && (
        <div className="management-error">
          {error}
        </div>
      )}

      {message && (
        <div className="management-success">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      <div className="registration-tabs">
        <button
          type="button"
          className={
            activeTab === 'profile'
              ? 'registration-tab active'
              : 'registration-tab'
          }
          onClick={() => setActiveTab('profile')}
        >
          <UserRound size={18} />
          <span>
            <strong>JAMB Profile Registration</strong>
            <small>Candidate and examination information</small>
          </span>
        </button>

        <button
          type="button"
          className={
            activeTab === 'passport'
              ? 'registration-tab active'
              : 'registration-tab'
          }
          onClick={() => setActiveTab('passport')}
        >
          <Camera size={18} />
          <span>
            <strong>Passport Profile</strong>
            <small>Candidate passport record</small>
          </span>
        </button>
      </div>

      {activeTab === 'profile' ? (
        <>
          <div className="dashboard-stats management-stats">
            <div>
              <span>Candidates</span>
              <strong>{total}</strong>
            </div>

            <div>
              <span>Completed</span>
              <strong>{completed}</strong>
            </div>

            <div>
              <span>Recorded Payments</span>
              <strong>{paid}</strong>
            </div>
          </div>

          <form
            className="management-form"
            onSubmit={submitRegistration}
          >
            <div className="management-form-header">
              <div>
                <span className="section-kicker">
                  NEW JAMB CANDIDATE
                </span>

                <h2>JAMB Profile Registration</h2>

                <p>
                  Enter accurate candidate information before
                  saving the registration.
                </p>
              </div>
            </div>

            <div className="management-form-section">
              <h3>
                <UserRound size={18} />
                Candidate Information
              </h3>

              <div className="management-form-grid">
                <label>
                  First Name *
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
                </label>

                <label>
                  Last Name *
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
                </label>

                <label>
                  Other Name
                  <input
                    value={form.otherName}
                    onChange={(event) =>
                      updateField(
                        'otherName',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Phone Number *
                  <input
                    required
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(event) =>
                      updateField(
                        'phoneNumber',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Email
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
                </label>

                <label>
                  Date of Birth
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
                </label>

                <label>
                  Gender
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
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  State of Origin
                  <input
                    value={form.stateOfOrigin}
                    onChange={(event) =>
                      updateField(
                        'stateOfOrigin',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  LGA
                  <input
                    value={form.lga}
                    onChange={(event) =>
                      updateField(
                        'lga',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  NIN Last 4 Digits
                  <input
                    inputMode="numeric"
                    maxLength={4}
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
                </label>
              </div>
            </div>

            <div className="management-form-section">
              <h3>
                <ClipboardCheck size={18} />
                Examination Details
              </h3>

              <div className="management-form-grid">
                <label>
                  Exam Year *
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
                </label>

                <label>
                  Registration Type *
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
                </label>

                <label>
                  Preferred Course
                  <input
                    value={form.preferredCourse}
                    onChange={(event) =>
                      updateField(
                        'preferredCourse',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  First Choice Institution
                  <input
                    value={form.firstChoiceInstitution}
                    onChange={(event) =>
                      updateField(
                        'firstChoiceInstitution',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Second Choice Institution
                  <input
                    value={form.secondChoiceInstitution}
                    onChange={(event) =>
                      updateField(
                        'secondChoiceInstitution',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Third Choice Institution
                  <input
                    value={form.thirdChoiceInstitution}
                    onChange={(event) =>
                      updateField(
                        'thirdChoiceInstitution',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  PWS Branch
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
                </label>
              </div>
            </div>

            <div className="management-form-section">
              <h3>
                <CreditCard size={18} />
                Payment &amp; Records
              </h3>

              <div className="management-form-grid">
                <label>
                  Amount
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
                </label>

                <label>
                  Payment Reference
                  <input
                    value={form.paymentReference}
                    onChange={(event) =>
                      updateField(
                        'paymentReference',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label className="management-form-full">
                  Notes
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
                </label>
              </div>
            </div>

            <div className="management-form-actions">
              <button
                type="submit"
                className="management-primary-button"
                disabled={saving}
              >
                {saving
                  ? 'Registering...'
                  : 'Register JAMB Candidate'}
              </button>
            </div>
          </form>

          <div className="management-card">
            <div className="management-card-header">
              <div>
                <h2>JAMB Registration History</h2>
                <p>
                  Search and monitor JAMB registrations
                  created through PWS.
                </p>
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
                    <tr key={record.id}>
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
                          {record.status}
                        </span>
                      </td>

                      <td>
                        <span className="management-badge">
                          {record.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!loading &&
                    filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          No JAMB registrations found.
                        </td>
                      </tr>
                    )}

                  {loading && (
                    <tr>
                      <td colSpan={6}>
                        Loading JAMB registration records...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="passport-profile-card">
          <div className="passport-profile-icon">
            <Camera size={34} />
          </div>

          <span className="section-kicker">
            PASSPORT PROFILE
          </span>

          <h2>Candidate Passport Profile</h2>

          <p>
            Store the candidate passport record here as part
            of the PWS registration workflow.
          </p>

          <div className="passport-upload-box">
            <Camera size={38} />

            <strong>Passport photograph</strong>

            <span>
              Passport capture/upload interface
              ready for candidate processing.
            </span>

            <button
              type="button"
              className="management-primary-button"
              disabled
            >
              Upload / Capture Passport
            </button>
          </div>

          <div className="management-note">
            <ClipboardCheck size={18} />

            <span>
              Passport storage is kept separate from the
              candidate profile so the registration workflow
              can be completed in stages.
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
