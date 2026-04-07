import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { authFetch } from '@/lib/authFetch'
import {
  User, FileText, Settings, Shield, Trash2, Upload,
  Check, Edit3, Bell, Key, Download
} from 'lucide-react'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [tab, setTab] = useState<'profile' | 'resume' | 'security' | 'notifications'>('profile')
  const [name, setName] = useState(user?.name || '')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [securityMessage, setSecurityMessage] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPasswordFor2FA, setCurrentPasswordFor2FA] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.twoFactorEnabled))
  const [twoFactorSetupSecret, setTwoFactorSetupSecret] = useState('')
  const [twoFactorSetupUrl, setTwoFactorSetupUrl] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showTwoFactorForm, setShowTwoFactorForm] = useState(false)
  const [busyAction, setBusyAction] = useState<'profile' | 'password' | '2fa-setup' | '2fa-verify' | '2fa-disable' | null>(null)

  useEffect(() => {
    let active = true

    const loadTwoFactorStatus = async () => {
      try {
        const response = await authFetch('/api/v1/auth/2fa/status')
        if (!response.ok) return
        const data = await response.json()
        if (active) {
          setTwoFactorEnabled(Boolean(data.enabled))
        }
      } catch {
        // Ignore status failures; the buttons still work.
      }
    }

    void loadTwoFactorStatus()

    return () => {
      active = false
    }
  }, [])

  const handleSave = async () => {
    setSaveError('')
    setLoadingProfile(true)
    try {
      const response = await authFetch('/api/v1/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ name }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile')
      }

      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar ?? null,
        plan: data.plan,
        createdAt: data.created_at,
        analysesUsed: data.analyses_used,
        analysesLimit: data.analyses_limit,
        twoFactorEnabled: data.two_factor_enabled,
        isVerified: data.is_verified,
      })
      setName(data.name || '')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error: any) {
      setSaveError(error?.message || 'Failed to save profile')
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setSecurityError('')
    setSecurityMessage('')

    if (newPassword !== confirmPassword) {
      setSecurityError('New passwords do not match')
      return
    }

    setBusyAction('password')
    try {
      const response = await authFetch('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      setSecurityMessage(data.message || 'Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
    } catch (error: any) {
      setSecurityError(error?.message || 'Failed to change password')
    } finally {
      setBusyAction(null)
    }
  }

  const handleStartTwoFactor = async () => {
    setSecurityError('')
    setSecurityMessage('')
    setBusyAction('2fa-setup')
    try {
      const response = await authFetch('/api/v1/auth/2fa/setup', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start 2FA setup')
      }

      setTwoFactorSetupSecret(data.secret || '')
      setTwoFactorSetupUrl(data.otpauthUrl || '')
      setTwoFactorCode('')
      setShowTwoFactorForm(true)
      setSecurityMessage('Scan the secret in your authenticator app, then verify the code below.')
    } catch (error: any) {
      setSecurityError(error?.message || 'Failed to start 2FA setup')
    } finally {
      setBusyAction(null)
    }
  }

  const handleVerifyTwoFactor = async (event: React.FormEvent) => {
    event.preventDefault()
    setSecurityError('')
    setSecurityMessage('')

    if (twoFactorCode.length !== 6) {
      setSecurityError('Enter the 6-digit code from your authenticator app')
      return
    }

    setBusyAction('2fa-verify')
    try {
      const response = await authFetch('/api/v1/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({
          code: twoFactorCode,
          secret: twoFactorSetupSecret || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify 2FA code')
      }

      setTwoFactorEnabled(true)
      setSecurityMessage(data.message || '2FA enabled successfully')
      setTwoFactorSetupSecret('')
      setTwoFactorSetupUrl('')
      setTwoFactorCode('')
      setShowTwoFactorForm(false)
    } catch (error: any) {
      setSecurityError(error?.message || 'Failed to verify 2FA code')
    } finally {
      setBusyAction(null)
    }
  }

  const handleDisableTwoFactor = async (event: React.FormEvent) => {
    event.preventDefault()
    setSecurityError('')
    setSecurityMessage('')

    if (!currentPasswordFor2FA) {
      setSecurityError('Enter your current password to disable 2FA')
      return
    }

    setBusyAction('2fa-disable')
    try {
      const response = await authFetch('/api/v1/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ password: currentPasswordFor2FA }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA')
      }

      setTwoFactorEnabled(false)
      setCurrentPasswordFor2FA('')
      setShowTwoFactorForm(false)
      setSecurityMessage(data.message || '2FA disabled successfully')
    } catch (error: any) {
      setSecurityError(error?.message || 'Failed to disable 2FA')
    } finally {
      setBusyAction(null)
    }
  }

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'resume', label: 'Resume Vault', icon: FileText },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Account Settings</h1>
        <p className={styles.pageSubtitle}>Manage your profile, resumes, and preferences.</p>
      </div>

      <div className={styles.mainGrid}>
        {/* ── Tab Nav ───────────────────────────────────── */}
        <nav className={styles.tabNav} aria-label="Settings sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`${styles.tabBtn} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
              id={`profile-tab-${t.id}`}
            >
              <t.icon size={16} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* ── Content ───────────────────────────────────── */}
        <div className={styles.tabContent}>

          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className={`card ${styles.section}`}>
              <h2 className={styles.sectionTitle}><User size={18} /> Personal Information</h2>
              <div className={styles.avatarRow}>
                <div className={styles.bigAvatar}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <button className="btn btn-secondary btn-sm" id="upload-avatar">
                    <Upload size={14} />
                    Upload photo
                  </button>
                  <p className={styles.avatarHint}>JPG, PNG or GIF · Max 2MB</p>
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label htmlFor="profile-name">Full name</label>
                  <input
                    id="profile-name"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="profile-email">Email address</label>
                  <input
                    id="profile-email"
                    className="input"
                    type="email"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="profile-plan">Current plan</label>
                  <div className={styles.planRow}>
                    <span className="badge badge-primary">
                      {user?.plan?.charAt(0).toUpperCase()}{user?.plan?.slice(1)} Plan
                    </span>
                    <a href="/pricing" className={styles.upgradeLink}>Upgrade →</a>
                  </div>
                </div>
              </div>
              <div className={styles.formActions}>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={loadingProfile}
                  id="save-profile"
                >
                  {loadingProfile ? 'Saving…' : saved ? <><Check size={16} /> Saved!</> : <><Edit3 size={16} /> Save changes</>}
                </button>
              </div>
              {saveError && <p className={styles.sectionDesc} style={{ color: 'var(--color-danger)' }}>{saveError}</p>}
            </div>
          )}

          {/* Resume Vault Tab */}
          {tab === 'resume' && (
            <div className={`card ${styles.section}`}>
              <h2 className={styles.sectionTitle}><FileText size={18} /> Resume Vault</h2>
              <p className={styles.sectionDesc}>
                Your resumes are encrypted and stored securely. Auto-deleted after 30 days unless you pin them.
              </p>

              <div className={styles.resumeList}>
                {[
                  { name: 'software_engineer_resume_v3.pdf', size: '142 KB', uploaded: '2 days ago', used: 2, pinned: true },
                  { name: 'software_engineer_resume_v2.pdf', size: '138 KB', uploaded: '2 weeks ago', used: 1, pinned: false },
                ].map((r, i) => (
                  <div key={i} className={styles.resumeItem}>
                    <div className={styles.resumeIcon}><FileText size={20} /></div>
                    <div className={styles.resumeInfo}>
                      <div className={styles.resumeName}>{r.name}</div>
                      <div className={styles.resumeMeta}>
                        {r.size} · Uploaded {r.uploaded} · Used in {r.used} analyses
                        {r.pinned && <span className="badge badge-primary" style={{ marginLeft: '8px' }}>Pinned</span>}
                      </div>
                    </div>
                    <div className={styles.resumeActions}>
                      <button className="btn btn-icon btn-ghost" title="Download" aria-label="Download resume">
                        <Download size={16} />
                      </button>
                      <button className="btn btn-icon btn-ghost" title="Delete" aria-label="Delete resume" style={{ color: 'var(--color-danger)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn btn-secondary" id="upload-resume">
                <Upload size={14} />
                Upload new resume
              </button>
            </div>
          )}

          {/* Security Tab */}
          {tab === 'security' && (
            <div className={`card ${styles.section}`}>
              <h2 className={styles.sectionTitle}><Shield size={18} /> Security & Privacy</h2>

              <div className={styles.securityItem}>
                <div>
                  <div className={styles.securityLabel}>Password</div>
                  <div className={styles.securityDesc}>Update the password used to sign in to Gapminer.</div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  id="change-password"
                  onClick={() => setShowPasswordForm((value) => !value)}
                >
                  {showPasswordForm ? 'Close' : 'Change password'}
                </button>
              </div>

              {showPasswordForm && (
                <form onSubmit={handleChangePassword} className={styles.dangerZone} style={{ borderColor: 'var(--color-border)' }}>
                  <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                    <div className={styles.field}>
                      <label htmlFor="current-password">Current password</label>
                      <input
                        id="current-password"
                        className="input"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="new-password">New password</label>
                      <input
                        id="new-password"
                        className="input"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="confirm-password">Confirm new password</label>
                      <input
                        id="confirm-password"
                        className="input"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                  {securityError && <p className={styles.sectionDesc} style={{ color: 'var(--color-danger)' }}>{securityError}</p>}
                  {securityMessage && <p className={styles.sectionDesc} style={{ color: 'var(--color-primary-light)' }}>{securityMessage}</p>}
                  <div className={styles.formActions}>
                    <button className="btn btn-primary btn-sm" type="submit" disabled={busyAction === 'password'}>
                      {busyAction === 'password' ? 'Updating…' : 'Update password'}
                    </button>
                  </div>
                </form>
              )}

              <div className={styles.securityItem}>
                <div>
                  <div className={styles.securityLabel}>Two-factor authentication</div>
                  <div className={styles.securityDesc}>{twoFactorEnabled ? '2FA is currently enabled on your account.' : 'Add an extra layer of security.'}</div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  id="enable-2fa"
                  onClick={() => {
                    setSecurityError('')
                    setSecurityMessage('')
                    if (twoFactorEnabled) {
                      setShowTwoFactorForm((value) => !value)
                    } else {
                      void handleStartTwoFactor()
                    }
                  }}
                >
                  {twoFactorEnabled ? (showTwoFactorForm ? 'Close' : 'Disable 2FA') : 'Enable 2FA'}
                </button>
              </div>

              {showTwoFactorForm && (
                <div className={styles.dangerZone} style={{ borderColor: 'var(--color-border)' }}>
                  {!twoFactorEnabled ? (
                    <>
                      <div className={styles.sectionDesc} style={{ marginBottom: 'var(--space-3)' }}>
                        {twoFactorSetupSecret
                          ? 'Add the secret to your authenticator app, then verify the code below to finish setup.'
                          : 'Start 2FA setup to generate a secret and QR/authenticator URL.'}
                      </div>

                      {!twoFactorSetupSecret && (
                        <button
                          className="btn btn-primary btn-sm"
                          type="button"
                          onClick={handleStartTwoFactor}
                          disabled={busyAction === '2fa-setup'}
                        >
                          {busyAction === '2fa-setup' ? 'Preparing…' : 'Generate 2FA secret'}
                        </button>
                      )}

                      {twoFactorSetupSecret && (
                        <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                          <div className={styles.field}>
                            <label>Secret key</label>
                            <input className="input" type="text" value={twoFactorSetupSecret} readOnly />
                          </div>
                          <div className={styles.field}>
                            <label>Authenticator URL</label>
                            <textarea className="input" value={twoFactorSetupUrl} readOnly rows={4} />
                          </div>
                          <form onSubmit={handleVerifyTwoFactor} className={styles.field}>
                            <label htmlFor="two-factor-code">Verification code</label>
                            <input
                              id="two-factor-code"
                              className="input"
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={twoFactorCode}
                              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="123456"
                              required
                            />
                            <button className="btn btn-primary btn-sm" type="submit" disabled={busyAction === '2fa-verify'}>
                              {busyAction === '2fa-verify' ? 'Verifying…' : 'Verify and enable'}
                            </button>
                          </form>
                        </div>
                      )}
                    </>
                  ) : (
                    <form onSubmit={handleDisableTwoFactor} className={styles.field}>
                      <label htmlFor="disable-2fa-password">Confirm your password to disable 2FA</label>
                      <input
                        id="disable-2fa-password"
                        className="input"
                        type="password"
                        value={currentPasswordFor2FA}
                        onChange={(e) => setCurrentPasswordFor2FA(e.target.value)}
                        placeholder="Enter password"
                        required
                      />
                      <button className="btn btn-danger btn-sm" type="submit" disabled={busyAction === '2fa-disable'}>
                        {busyAction === '2fa-disable' ? 'Disabling…' : 'Disable 2FA'}
                      </button>
                    </form>
                  )}

                  {securityError && <p className={styles.sectionDesc} style={{ color: 'var(--color-danger)' }}>{securityError}</p>}
                  {securityMessage && <p className={styles.sectionDesc} style={{ color: 'var(--color-primary-light)' }}>{securityMessage}</p>}
                </div>
              )}

              <div className={styles.dangerZone}>
                <h3>Danger Zone</h3>
                <div className={styles.securityItem} style={{ borderColor: 'hsla(0,90%,60%,0.2)' }}>
                  <div>
                    <div className={styles.securityLabel}>Delete account</div>
                    <div className={styles.securityDesc}>Permanently delete your account and all data</div>
                  </div>
                  <button className="btn btn-danger btn-sm" id="delete-account">
                    <Trash2 size={14} />
                    Delete account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {tab === 'notifications' && (
            <div className={`card ${styles.section}`}>
              <h2 className={styles.sectionTitle}><Bell size={18} /> Notification Preferences</h2>
              <div className={styles.notifList}>
                {[
                  { label: 'Analysis complete', desc: 'When your gap analysis finishes', checked: true },
                  { label: 'Weekly digest', desc: 'Summary of your progress every Monday', checked: false },
                  { label: 'Roadmap reminders', desc: 'Reminders to continue your learning plan', checked: true },
                  { label: 'Product updates', desc: 'New features and announcements', checked: false },
                ].map((n, i) => (
                  <div key={i} className={styles.notifItem}>
                    <div>
                      <div className={styles.notifLabel}>{n.label}</div>
                      <div className={styles.notifDesc}>{n.desc}</div>
                    </div>
                    <button
                      className={`${styles.toggle} ${n.checked ? styles.toggleOn : ''}`}
                      role="switch"
                      aria-checked={n.checked}
                      id={`notif-${i}`}
                    >
                      <div className={styles.toggleThumb} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
