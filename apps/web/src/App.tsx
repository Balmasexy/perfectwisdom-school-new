import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageSquare,
  School,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  UserRoundCheck,
  X,
} from 'lucide-react'
import './App.css'
import { apiRequest, setAuthToken } from './api'

type Page = 'landing' | 'login' | 'dashboard'
type Role = 'Admin' | 'Staff' | 'Parent'

const roles: { name: Role; description: string; icon: typeof ShieldCheck }[] = [
  {
    name: 'Admin',
    description: 'Manage your school, staff, students and reports.',
    icon: ShieldCheck,
  },
  {
    name: 'Staff',
    description: 'Manage classes, attendance and daily school activities.',
    icon: Users,
  },
  {
    name: 'Parent',
    description: 'Follow your child’s progress, attendance and updates.',
    icon: HeartHandshake,
  },
]

const features = [
  {
    icon: GraduationCap,
    title: 'Student Management',
    text: 'Keep student records, classes, profiles and academic information organized.',
  },
  {
    icon: Users,
    title: 'Staff Management',
    text: 'Manage staff information, responsibilities and school operations from one place.',
  },
  {
    icon: CheckCircle2,
    title: 'Attendance',
    text: 'Track student and staff attendance with a simple, modern workflow.',
  },
  {
    icon: BookOpen,
    title: 'School Operations',
    text: 'Bring everyday school administration into one secure platform.',
  },
]

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand-logo ${light ? 'brand-logo-light' : ''}`}>
      <div className="logo-mark">
        <span className="logo-book left-book" />
        <span className="logo-book right-book" />
        <span className="logo-sun">✦</span>
      </div>
      <div className="logo-text">
        <strong>Perfect Wisdom</strong>
        <span>School</span>
      </div>
    </div>
  )
}


const ROLE_STORAGE_KEY = 'perfect-wisdom-school-role'

function getSavedRole(): Role {
  const saved = localStorage.getItem(ROLE_STORAGE_KEY)

  if (saved === 'Admin' || saved === 'Staff' || saved === 'Parent') {
    return saved
  }

  return 'Admin'
}

function saveRole(role: Role) {
  localStorage.setItem(ROLE_STORAGE_KEY, role)
}

function BalmzAI({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'balmz-ai balmz-ai-compact' : 'balmz-ai'}>
      <div className="balmz-ai-icon">
        <Sparkles size={compact ? 17 : 20} />
      </div>

      <div>
        <strong>BALMZ AI</strong>
        {!compact && (
          <span>Intelligent assistance for Perfect Wisdom School</span>
        )}
      </div>
    </div>
  )
}

function RoleSelector({
  role,
  setRole,
}: {
  role: Role
  setRole: (role: Role) => void
}) {
  const [open, setOpen] = useState(false)

  const selectRole = (nextRole: Role) => {
    setRole(nextRole)
    saveRole(nextRole)
    setOpen(false)
  }

  return (
    <div className="role-selector">
      <button
        type="button"
        className="role-selector-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{role}</span>
        <ChevronDown
          size={18}
          className={open ? 'role-chevron-open' : ''}
        />
      </button>

      {open && (
        <div className="role-selector-menu">
          {roles.map((item) => (
            <button
              key={item.name}
              type="button"
              className={
                role === item.name
                  ? 'role-selector-option selected'
                  : 'role-selector-option'
              }
              onClick={() => selectRole(item.name)}
            >
              <span>{item.name}</span>
              {role === item.name && <CheckCircle2 size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Landing({ onLogin }: { onLogin: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container nav-inner">
          <Logo />

          <nav className={menuOpen ? 'mobile-nav open' : 'mobile-nav'}>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#roles" onClick={() => setMenuOpen(false)}>For Schools</a>
            <a href="#security" onClick={() => setMenuOpen(false)}>Security</a>
            <button className="nav-login" onClick={onLogin}>Sign In</button>
          </nav>

          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
          >
            {menuOpen ? <X size={25} /> : <Menu size={25} />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-glow glow-one" />
          <div className="hero-glow glow-two" />

          <div className="landing-container hero-grid">
            <div className="hero-copy">
              <div className="hero-badge">
                <Sparkles size={16} />
                <span>Modern School Management</span>
              </div>

              <div className="landing-balmz">
                <BalmzAI />
              </div>

              <h1>
                Empowering schools with
                <span> wisdom, simplicity &amp; excellence.</span>
              </h1>

              <p>
                Perfect Wisdom School brings students, staff, parents and
                school administrators together in one secure and easy-to-use
                platform.
              </p>

              <div className="hero-actions">
                <button className="primary-button" onClick={onLogin}>
                  Get Started
                  <ArrowRight size={19} />
                </button>

                <a href="#features" className="secondary-button">
                  Explore Platform
                  <ChevronRight size={18} />
                </a>
              </div>

              <div className="hero-trust">
                <div className="trust-icon"><ShieldCheck size={18} /></div>
                <div>
                  <strong>Built with security in mind</strong>
                  <span>Designed for modern school administration</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="school-card">
                <div className="school-card-top">
                  <Logo light />
                  <span className="live-pill">Platform</span>
                </div>

                <div className="welcome-card">
                  <span>WELCOME TO</span>
                  <h2>Perfect Wisdom School</h2>
                  <p>One platform for your entire school community.</p>
                </div>

                <div className="mini-stats">
                  <div>
                    <strong>Students</strong>
                    <span>Organized</span>
                  </div>
                  <div>
                    <strong>Staff</strong>
                    <span>Connected</span>
                  </div>
                  <div>
                    <strong>Parents</strong>
                    <span>Informed</span>
                  </div>
                </div>

                <div className="visual-footer">
                  <span><CheckCircle2 size={17} /> School operations made simpler</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="roles-section" id="roles">
          <div className="landing-container">
            <div className="section-heading">
              <span className="section-kicker">ONE PLATFORM</span>
              <h2>Built for everyone in your school</h2>
              <p>
                Every member of the school community gets the tools they need.
              </p>
            </div>

            <div className="role-grid">
              {roles.map((role) => {
                const Icon = role.icon
                return (
                  <button key={role.name} className="role-card" onClick={onLogin}>
                    <div className="role-icon">
                      <Icon size={25} />
                    </div>
                    <h3>{role.name}</h3>
                    <p>{role.description}</p>
                    <span>Continue as {role.name} <ArrowRight size={16} /></span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="landing-container">
            <div className="section-heading">
              <span className="section-kicker">SCHOOL MANAGEMENT</span>
              <h2>Everything your school needs</h2>
              <p>A focused platform for managing the important parts of school life.</p>
            </div>

            <div className="feature-grid">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div className="feature-card" key={feature.title}>
                    <div className="feature-icon"><Icon size={23} /></div>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="security-section" id="security">
          <div className="landing-container security-card">
            <div className="security-icon">
              <LockKeyhole size={30} />
            </div>
            <div>
              <span className="section-kicker">SECURE ACCESS</span>
              <h2>Access your school securely</h2>
              <p>
                Sign in with your account, Google, or supported device
                authentication such as fingerprint and Face Unlock.
              </p>
            </div>
            <button className="primary-button" onClick={onLogin}>
              Sign In
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <Logo />
          <span>© 2026 Perfect Wisdom School. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}

function Login({
  role,
  setRole,
  onBack,
  onDashboard,
}: {
  role: Role
  setRole: (role: Role) => void
  onBack: () => void
  onDashboard: () => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const data = await apiRequest<{ token: string; user: { role: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role: role.toUpperCase() }),
      })
      setAuthToken(data.token)
      saveRole(data.user.role === 'STAFF' ? 'Staff' : data.user.role === 'PARENT' ? 'Parent' : 'Admin')
      onDashboard()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <button className="back-link" onClick={onBack}>← Back to website</button>

        <Logo light />

        <div className="login-brand-content">
          <span className="section-kicker light-kicker">PERFECT WISDOM SCHOOL</span>
          <h1>Welcome back.</h1>
          <p>
            Sign in to manage your school, support your students and stay
            connected with your school community.
          </p>

          <div className="login-benefits">
            <div><CheckCircle2 size={18} /> Secure school access</div>
            <div><CheckCircle2 size={18} /> Admin, Staff &amp; Parent portals</div>
            <div><CheckCircle2 size={18} /> Google and device authentication</div>
          </div>
        </div>

        <span className="login-copyright">© 2026 Perfect Wisdom School</span>
      </div>

      <div className="login-form-panel">
        <div className="login-form-box">
          <div className="mobile-login-logo">
            <Logo />
          </div>

          <div className="login-heading">
            <span>SECURE PORTAL</span>
            <h2>Sign in to your account</h2>
            <p>Choose your account type to continue.</p>
          </div>

          <div className="login-role-section">
            <label className="role-selector-label">
              Account type
            </label>

            <RoleSelector
              role={role}
              setRole={setRole}
            />

            <p className="role-selector-help">
              Sign in to the {role} portal.
            </p>
          </div>

          {error && <div className="management-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <label>
              Email address
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </label>

            <label>
              Password
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Show password"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <div className="login-options">
              <label className="remember">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <button type="button" className="forgot">Forgot password?</button>
            </div>

            <button className="login-button" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : `Sign in as ${role}`}
              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="login-divider"><span>or continue with</span></div>

          <div className="social-login-grid">
            <button className="social-button" type="button">
              <span className="google-g">G</span>
              Google
            </button>

            <button className="social-button biometric-button" type="button">
              <KeyRound size={19} />
              Fingerprint / Face
            </button>
          </div>

          <div className="secure-note">
            <LockKeyhole size={16} />
            Your school account is protected with secure authentication.
          </div>

          <div className="login-balmz">
            <BalmzAI compact />
          </div>
        </div>
      </div>
    </div>
  )
}

function BranchManagement() {
  const [branches, setBranches] = useState<Array<{
    id: string
    name: string
    code: string
    address: string
    phoneNumber: string
    status: string
  }>>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    phoneNumber: '',
  })

  async function loadBranches() {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest<typeof branches>('/branches')
      setBranches(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load branches'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBranches()
  }, [])

  function updateBranchField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function createBranch(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      await apiRequest('/branches',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: form.name,
            code: form.code,
            address: form.address,
            phoneNumber: form.phoneNumber,
          }),
        }
      )

      await apiRequest('/branches', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          address: form.address || undefined,
          phoneNumber: form.phoneNumber || undefined,
        }),
      })

      setForm({
        name: '',
        code: '',
        address: '',
        phoneNumber: '',
      })

      setShowForm(false)
      await loadBranches()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create branch'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="management-page">
      <div className="management-header">
        <div>
          <span className="dashboard-kicker">BRANCH MANAGEMENT</span>
          <h1>Branches</h1>
          <p>
            Create and manage real Perfect Wisdom School branches.
          </p>
        </div>

        <button
          className="management-primary-button"
          onClick={() => {
            setError('')
            setShowForm((current) => !current)
          }}
        >
          {showForm ? 'Close Form' : 'Create Branch'}
        </button>
      </div>

      {error && (
        <div className="management-error">
          {error}
        </div>
      )}

      {showForm && (
        <form
          className="management-form"
          onSubmit={createBranch}
        >
          <div className="management-form-header">
            <div>
              <h2>Create Branch</h2>
              <p>
                Branch phone number is required for registration.
              </p>
            </div>
          </div>

          <div className="management-form-grid">
            <label>
              Branch Name *
              <input
                value={form.name}
                onChange={(event) =>
                  updateBranchField('name', event.target.value)
                }
                required
              />
            </label>

            <label>
              Branch Code *
              <input
                value={form.code}
                onChange={(event) =>
                  updateBranchField(
                    'code',
                    event.target.value.toUpperCase()
                  )
                }
                placeholder="e.g. PWS-LAG"
                required
              />
            </label>

            <label>
              Branch Phone Number *
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(event) =>
                  updateBranchField(
                    'phoneNumber',
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label>
              Address *
              <input
                value={form.address}
                onChange={(event) =>
                  updateBranchField(
                    'address',
                    event.target.value
                  )
                }
                required
              />
            </label>
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
              {saving ? 'Creating...' : 'Create Branch'}
            </button>
          </div>
        </form>
      )}

      <div className="management-card">
        <div className="management-card-header">
          <div>
            <h2>Branch Records</h2>
            <p>{branches.length} real branch record(s)</p>
          </div>
        </div>

        {loading ? (
          <div className="management-empty">
            Loading branch records...
          </div>
        ) : branches.length === 0 ? (
          <div className="management-empty">
            No branches registered.
            <span>
              Create the first branch using the button above.
            </span>
          </div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Branch Code</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id}>
                    <td>{branch.code}</td>
                    <td>{branch.name}</td>
                    <td>{branch.phoneNumber}</td>
                    <td>{branch.address}</td>
                    <td>
                      <span className="status-badge">
                        {branch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function StaffManagement() {
  const [branches, setBranches] = useState<Array<{
    id: string
    name: string
    code: string
    status: string
  }>>([])

  const [staff, setStaff] = useState<Array<{
    id: string
    staffId: string
    firstName: string
    lastName: string
    otherName: string | null
    phoneNumber: string
    email: string | null
    dateOfBirth: string | null
    gender: 'MALE' | 'FEMALE' | 'OTHER' | null
    address: string | null
    department: string | null
    position: string | null
    employmentType: string | null
    dateEmployed: string | null
    branchId: string | null
    emergencyContactName: string | null
    emergencyContactPhone: string | null
    bankName: string | null
    bankAccountNumber: string | null
    status: string
  }>>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    otherName: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    department: '',
    position: '',
    employmentType: 'FULL_TIME',
    dateEmployed: '',
    branchId: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bankName: '',
    bankAccountNumber: '',
  })

  async function loadBranches() {
    try {
      const data = await apiRequest<typeof branches>('/branches')
      setBranches(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load branches'
      )
    }
  }

  async function loadStaff() {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest<typeof staff>('/staff')
      setStaff(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load staff')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBranches()
    loadStaff()
  }, [])

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function createStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      await apiRequest('/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          otherName: form.otherName || undefined,
          phoneNumber: form.phoneNumber,
          email: form.email || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          gender: form.gender || undefined,
          address: form.address || undefined,
          department: form.department || undefined,
          position: form.position || undefined,
          employmentType: form.employmentType,
          dateEmployed: form.dateEmployed || undefined,
          branchId: form.branchId || undefined,
          emergencyContactName: form.emergencyContactName || undefined,
          emergencyContactPhone: form.emergencyContactPhone || undefined,
          bankName: form.bankName || undefined,
          bankAccountNumber: form.bankAccountNumber || undefined,
        }),
      })

      await apiRequest('/staff', {
        method: 'POST',
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phoneNumber: form.phoneNumber || undefined,
          branchId: form.branchId || undefined,
          department: form.department || undefined,
          bankName: form.bankName || undefined,
          bankAccountNumber: form.bankAccountNumber || undefined,
        }),
      })

      setForm({
        firstName: '',
        lastName: '',
        otherName: '',
        phoneNumber: '',
        email: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        department: '',
        position: '',
        employmentType: 'FULL_TIME',
        dateEmployed: '',
        branchId: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        bankName: '',
        bankAccountNumber: '',
      })

      setShowForm(false)
      await loadStaff()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create staff')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="management-page">
      <div className="management-header">
        <div>
          <span className="dashboard-kicker">STAFF MANAGEMENT</span>
          <h1>Staff</h1>
          <p>Create and manage real Perfect Wisdom School staff records.</p>
        </div>

        <button
          className="management-primary-button"
          onClick={() => {
            setError('')
            setShowForm((current) => !current)
          }}
        >
          {showForm ? 'Close Form' : 'Create Staff'}
        </button>
      </div>

      {error && <div className="management-error">{error}</div>}

      {showForm && (
        <form className="management-form" onSubmit={createStaff}>
          <div className="management-form-header">
            <div>
              <h2>Create Staff Record</h2>
              <p>Phone number is required for every staff registration.</p>
            </div>
          </div>

          <div className="management-form-grid">
            <label>
              First Name *
              <input
                value={form.firstName}
                onChange={(event) =>
                  updateField('firstName', event.target.value)
                }
                required
              />
            </label>

            <label>
              Last Name *
              <input
                value={form.lastName}
                onChange={(event) =>
                  updateField('lastName', event.target.value)
                }
                required
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
              Phone Number *
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(event) =>
                  updateField('phoneNumber', event.target.value)
                }
                required
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
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label>
              Address
              <input
                value={form.address}
                onChange={(event) =>
                  updateField('address', event.target.value)
                }
              />
            </label>

            <label>
              Department
              <input
                value={form.department}
                onChange={(event) =>
                  updateField('department', event.target.value)
                }
              />
            </label>

            <label>
              Position
              <input
                value={form.position}
                onChange={(event) =>
                  updateField('position', event.target.value)
                }
              />
            </label>

            <label>
              Employment Type
              <select
                value={form.employmentType}
                onChange={(event) =>
                  updateField('employmentType', event.target.value)
                }
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </label>

            <label>
              Date Employed
              <input
                type="date"
                value={form.dateEmployed}
                onChange={(event) =>
                  updateField('dateEmployed', event.target.value)
                }
              />
            </label>

            <label>
              Branch
              <select
                value={form.branchId}
                onChange={(event) =>
                  updateField('branchId', event.target.value)
                }
                disabled={branches.length === 0}
              >
                <option value="">
                  {branches.length === 0
                    ? 'No branches available'
                    : 'Select branch'}
                </option>

                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Emergency Contact Name
              <input
                value={form.emergencyContactName}
                onChange={(event) =>
                  updateField('emergencyContactName', event.target.value)
                }
              />
            </label>

            <label>
              Emergency Contact Phone
              <input
                type="tel"
                value={form.emergencyContactPhone}
                onChange={(event) =>
                  updateField('emergencyContactPhone', event.target.value)
                }
              />
            </label>

            <label>
              Bank Name
              <input
                value={form.bankName}
                onChange={(event) =>
                  updateField('bankName', event.target.value)
                }
              />
            </label>

            <label>
              Bank Account Number
              <input
                inputMode="numeric"
                value={form.bankAccountNumber}
                onChange={(event) =>
                  updateField('bankAccountNumber', event.target.value)
                }
              />
            </label>
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
              {saving ? 'Creating...' : 'Create Staff'}
            </button>
          </div>
        </form>
      )}

      <div className="management-card">
        <div className="management-card-header">
          <div>
            <h2>Staff Records</h2>
            <p>{staff.length} real staff record(s)</p>
          </div>
        </div>

        {loading ? (
          <div className="management-empty">Loading staff records...</div>
        ) : staff.length === 0 ? (
          <div className="management-empty">
            No staff records.
            <span>Create the first staff record using the button above.</span>
          </div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Employment</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td>{member.staffId}</td>
                    <td>
                      {member.firstName} {member.lastName}
                      {member.otherName ? ` ${member.otherName}` : ''}
                    </td>
                    <td>{member.phoneNumber}</td>
                    <td>{member.department || '—'}</td>
                    <td>{member.position || '—'}</td>
                    <td>{member.employmentType || '—'}</td>
                    <td>
                      <span className="status-badge">{member.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function Dashboard({
  role,
  onSignOut,
}: {
  role: Role
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [summary, setSummary] = useState({
    students: 0,
    staff: 0,
    branches: 0,
    classes: 0,
    assignments: 0,
    messages: 0,
    results: 0,
    bankAccounts: 0,
    transactions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadSummary() {
      try {
        setLoading(true)
        setApiError('')

        const data = await apiRequest<{
          students: number
          staff: number
          branches: number
          classes: number
          assignments: number
          messages: number
          results: number
          bankAccounts: number
          transactions: number
        }>('/dashboard/summary')

        if (!cancelled) {
          setSummary(data)
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(
            error instanceof Error ? error.message : 'Unable to load dashboard data'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSummary()

    return () => {
      cancelled = true
    }
  }, [])

  const dashboardData = {
    Admin: {
      kicker: 'ADMINISTRATION OVERVIEW',
      title: 'Admin Dashboard',
      subtitle: 'Manage your school, people and operations from one place.',
      stats: [
        ['Total Students', loading ? '—' : String(summary.students)],
        ['Active Staff', loading ? '—' : String(summary.staff)],
        ['Branches', loading ? '—' : String(summary.branches)],
        ['Attendance', '0%'],
      ],
      nav: ['Dashboard', 'Students', 'Staff', 'Branches', 'Attendance', 'Classes', 'Reports', 'Settings'],
      panels: [
        {
          title: 'School Administration',
          items: [
            ['Students registered', loading ? '—' : String(summary.students)],
            ['Staff members', loading ? '—' : String(summary.staff)],
            ['Active branches', loading ? '—' : String(summary.branches)],
          ],
        },
        {
          title: 'Recent Activity',
          items: [
            ['New student registered', 'No records'],
            ['Attendance submitted', 'No records'],
            ['Staff record updated', 'No records'],
          ],
        },
      ],
    },

    Staff: {
      kicker: 'STAFF WORKSPACE',
      title: 'Staff Dashboard',
      subtitle: 'Manage your classes, attendance and daily school activities.',
      stats: [
        ['My Classes', loading ? '—' : '0'],
        ['Students', loading ? '—' : String(summary.students)],
        ['Attendance', '0%'],
        ['Tasks Today', loading ? '—' : '0'],
      ],
      nav: ['Dashboard', 'My Students', 'Classes', 'Attendance', 'Assignments', 'Messages', 'Profile'],
      panels: [
        {
          title: 'Today at School',
          items: [
            ['Classes scheduled', loading ? '—' : String(summary.classes)],
            ['Students expected', loading ? '—' : String(summary.students)],
            ['Attendance pending', loading ? '—' : '0'],
          ],
        },
        {
          title: 'Staff Activity',
          items: [
            ['Attendance submitted', 'No records'],
            ['Class record updated', 'No records'],
            ['New school notice', 'No records'],
          ],
        },
      ],
    },

    Parent: {
      kicker: 'PARENT PORTAL',
      title: 'Parent Dashboard',
      subtitle: 'Stay connected with your child’s learning, attendance and school updates.',
      stats: [
        ['Children', loading ? '—' : '0'],
        ['Attendance', '0%'],
        ['Assignments', loading ? '—' : String(summary.assignments)],
        ['School Updates', loading ? '—' : '0'],
      ],
      nav: ['Dashboard', 'My Children', 'Attendance', 'Results', 'Assignments', 'Messages', 'Profile'],
      panels: [
        {
          title: 'My Children',
          items: [
            ['Children registered', loading ? '—' : '0'],
            ['Attendance records', loading ? '—' : '0'],
            ['Results available', loading ? '—' : String(summary.results)],
          ],
        },
        {
          title: 'School Updates',
          items: [
            ['Parent notices', 'No records'],
            ['Assignments posted', loading ? '—' : String(summary.assignments)],
            ['Attendance records', 'No records'],
          ],
        },
      ],
    },
  }[role]

  return (
    <div className="dashboard-shell">
      <aside className={open ? 'dashboard-sidebar open' : 'dashboard-sidebar'}>
        <div className="sidebar-brand">
          <Logo />
        </div>

        <div className="sidebar-role">
          <UserRound size={17} />
          <div>
            <strong>{role}</strong>
            <span>School Portal</span>
          </div>
        </div>

        <div className="sidebar-role-switch">
          <span>Current portal</span>
          <div className="sidebar-current-role">
            {role}
          </div>
        </div>

        <nav className="dashboard-nav" aria-label={`${role} navigation`}>
          {dashboardData.nav.map((label, index) => {
            const icons = {
              Dashboard: LayoutDashboard,
              Students: Users,
              Staff: UserRoundCheck,
              Branches: School,
              Attendance: CalendarDays,
              Classes: BookOpen,
              Reports: BarChart3,
              Settings: Settings,
              'My Students': Users,
              Assignments: ClipboardCheck,
              Messages: MessageSquare,
              Profile: UserRound,
              'My Children': Users,
              Results: BarChart3,
            }

            const Icon = icons[label as keyof typeof icons] || LayoutDashboard

            return (
              <button
                key={label}
                className={activeSection === label ? 'active' : ''}
                onClick={() => {
                  setActiveSection(label)
                  setOpen(false)
                }}
                type="button"
              >
                <Icon size={19} strokeWidth={2} />
                <span>{label}</span>
                {index === 0 && <span className="nav-active-dot" />}
              </button>
            )
          })}
        </nav>

        <button className="signout-button" onClick={onSignOut}>
          Sign Out
        </button>
      </aside>

      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            className="dashboard-menu"
            onClick={() => setOpen(!open)}
            aria-label="Open dashboard menu"
          >
            <Menu size={23} />
          </button>

          <div>
            <span>Perfect Wisdom School</span>
            <strong>{role} Portal</strong>
          </div>

          <div className="dashboard-topbar-actions">
            <BalmzAI compact />
            <div className="dashboard-avatar">{role[0]}</div>
          </div>
        </header>

        <section className="dashboard-content">
          {apiError && (
            <div className="management-error">{apiError}</div>
          )}

          {role === 'Admin' && activeSection === 'Staff' ? (
            <StaffManagement />
          ) : role === 'Admin' && activeSection === 'Branches' ? (
            <BranchManagement />
          ) : ( 
            <>
              <div className="dashboard-welcome">
                <span className="section-kicker">{dashboardData.kicker}</span>
                <h1>{dashboardData.title}</h1>
                <p>{dashboardData.subtitle}</p>
              </div>

              <div className="dashboard-stats">
                {dashboardData.stats.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>

              <div className="dashboard-panels">
                {dashboardData.panels.map((panel) => (
                  <div className="dashboard-panel" key={panel.title}>
                    <h2>{panel.title}</h2>

                    {panel.items.map(([label, value]) => (
                      <p key={label}>
                        {label} <strong>{value}</strong>
                      </p>
                    ))}
                  </div>
                ))}
              </div>

              <div className="dashboard-balmz-section">
                <BalmzAI />
                <p>
                  BALMZ AI is available to help you navigate and understand
                  your Perfect Wisdom School workspace.
                </p>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('landing')
  const [role, setRole] = useState<Role>(() => {
    try {
      return getSavedRole()
    } catch {
      return 'Admin'
    }
  })

  const changeRole = (nextRole: Role) => {
    setRole(nextRole)
    saveRole(nextRole)
  }

  if (page === 'landing') {
    return <Landing onLogin={() => setPage('login')} />
  }

  if (page === 'login') {
    return (
      <Login
        role={role}
        setRole={changeRole}
        onBack={() => setPage('landing')}
        onDashboard={() => setPage('dashboard')}
      />
    )
  }

  return (
    <Dashboard
      role={role}
      onSignOut={() => setPage('login')}
    />
  )
}
