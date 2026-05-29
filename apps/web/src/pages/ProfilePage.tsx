import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { authFetch, safeReadJson } from '@/lib/authFetch'
import {
  User, FileText, Settings, Shield, Trash2, Upload,
  Check, Edit3, Bell, Key, Download
} from 'lucide-react'
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Badge,
  Input,
  Textarea,
} from '@/components/ui'
import { cn } from '@/lib/utils'

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
        const data = await safeReadJson<any>(response, {})
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

      const data = await safeReadJson<any>(response, {})
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

      const data = await safeReadJson<any>(response, {})
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
      const data = await safeReadJson<any>(response, {})

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

      const data = await safeReadJson<any>(response, {})
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

      const data = await safeReadJson<any>(response, {})
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
    <PageShell>
      <PageHeader
        icon={<Settings size={22} />}
        title="Account Settings"
        description="Manage your profile, resumes, and preferences."
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Settings sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                tab === t.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
              )}
              onClick={() => setTab(t.id)}
              id={`profile-tab-${t.id}`}
            >
              <t.icon size={16} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="min-w-0 space-y-6">
          {tab === 'profile' && (
            <Card padding="lg">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-on-surface">
                <User size={18} className="text-primary" />
                Personal Information
              </h2>
              <div className="mb-8 flex flex-wrap items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl primary-gradient text-2xl font-black text-on-primary-fixed shadow-lg shadow-primary/20">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <Button variant="secondary" size="sm" id="upload-avatar">
                    <Upload size={14} />
                    Upload photo
                  </Button>
                  <p className="mt-2 text-xs text-on-surface-variant">JPG, PNG or GIF · Max 2MB</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  id="profile-name"
                  label="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  id="profile-email"
                  label="Email address"
                  type="email"
                  value={user?.email || ''}
                  disabled
                />
                <div className="sm:col-span-2">
                  <span className="gm-label">Current plan</span>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Badge tone="primary">
                      {user?.plan?.charAt(0).toUpperCase()}{user?.plan?.slice(1)} Plan
                    </Badge>
                    <a href="/pricing" className="text-sm font-semibold text-primary hover:underline">
                      Upgrade →
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={handleSave}
                  disabled={loadingProfile}
                  loading={loadingProfile}
                  id="save-profile"
                >
                  {saved ? (
                    <>
                      <Check size={16} /> Saved!
                    </>
                  ) : (
                    <>
                      <Edit3 size={16} /> Save changes
                    </>
                  )}
                </Button>
              </div>
              {saveError && <p className="mt-3 text-sm text-error">{saveError}</p>}
            </Card>
          )}

          {tab === 'resume' && (
            <Card padding="lg">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-on-surface">
                <FileText size={18} className="text-primary" />
                Resume Vault
              </h2>
              <p className="mb-6 text-sm text-on-surface-variant">
                Your resumes are encrypted and stored securely. Auto-deleted after 30 days unless you pin them.
              </p>

              <div className="mb-6 space-y-3">
                {[
                  { name: 'software_engineer_resume_v3.pdf', size: '142 KB', uploaded: '2 days ago', used: 2, pinned: true },
                  { name: 'software_engineer_resume_v2.pdf', size: '138 KB', uploaded: '2 weeks ago', used: 1, pinned: false },
                ].map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-xl border border-outline-variant/15 bg-surface-container-low p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-on-surface">{r.name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                        <span>
                          {r.size} · Uploaded {r.uploaded} · Used in {r.used} analyses
                        </span>
                        {r.pinned && <Badge tone="primary">Pinned</Badge>}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="sm" title="Download" aria-label="Download resume">
                        <Download size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete"
                        aria-label="Delete resume"
                        className="text-error hover:text-error"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="secondary" id="upload-resume">
                <Upload size={14} />
                Upload new resume
              </Button>
            </Card>
          )}

          {tab === 'security' && (
            <Card padding="lg">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-on-surface">
                <Shield size={18} className="text-primary" />
                Security & Privacy
              </h2>

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/15 py-4">
                <div>
                  <div className="text-sm font-bold text-on-surface">Password</div>
                  <div className="text-sm text-on-surface-variant">Update the password used to sign in to Gapminer.</div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  id="change-password"
                  onClick={() => setShowPasswordForm((value) => !value)}
                >
                  {showPasswordForm ? 'Close' : 'Change password'}
                </Button>
              </div>

              {showPasswordForm && (
                <form
                  onSubmit={handleChangePassword}
                  className="my-4 rounded-xl border border-outline-variant/20 bg-surface-container-low p-5"
                >
                  <div className="space-y-4">
                    <Input
                      id="current-password"
                      label="Current password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <Input
                      id="new-password"
                      label="New password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <Input
                      id="confirm-password"
                      label="Confirm new password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  {securityError && <p className="mt-3 text-sm text-error">{securityError}</p>}
                  {securityMessage && <p className="mt-3 text-sm text-primary">{securityMessage}</p>}
                  <div className="mt-4">
                    <Button type="submit" size="sm" loading={busyAction === 'password'} disabled={busyAction === 'password'}>
                      {busyAction === 'password' ? 'Updating…' : 'Update password'}
                    </Button>
                  </div>
                </form>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/15 py-4">
                <div>
                  <div className="text-sm font-bold text-on-surface">Two-factor authentication</div>
                  <div className="text-sm text-on-surface-variant">
                    {twoFactorEnabled ? '2FA is currently enabled on your account.' : 'Add an extra layer of security.'}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
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
                </Button>
              </div>

              {showTwoFactorForm && (
                <div className="my-4 rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
                  {!twoFactorEnabled ? (
                    <>
                      <p className="mb-4 text-sm text-on-surface-variant">
                        {twoFactorSetupSecret
                          ? 'Add the secret to your authenticator app, then verify the code below to finish setup.'
                          : 'Start 2FA setup to generate a secret and QR/authenticator URL.'}
                      </p>

                      {!twoFactorSetupSecret && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleStartTwoFactor}
                          loading={busyAction === '2fa-setup'}
                          disabled={busyAction === '2fa-setup'}
                        >
                          {busyAction === '2fa-setup' ? 'Preparing…' : 'Generate 2FA secret'}
                        </Button>
                      )}

                      {twoFactorSetupSecret && (
                        <div className="space-y-4">
                          <Input label="Secret key" type="text" value={twoFactorSetupSecret} readOnly />
                          <Textarea label="Authenticator URL" value={twoFactorSetupUrl} readOnly rows={4} />
                          <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
                            <Input
                              id="two-factor-code"
                              label="Verification code"
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={twoFactorCode}
                              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="123456"
                              required
                            />
                            <Button type="submit" size="sm" loading={busyAction === '2fa-verify'} disabled={busyAction === '2fa-verify'}>
                              {busyAction === '2fa-verify' ? 'Verifying…' : 'Verify and enable'}
                            </Button>
                          </form>
                        </div>
                      )}
                    </>
                  ) : (
                    <form onSubmit={handleDisableTwoFactor} className="space-y-4">
                      <Input
                        id="disable-2fa-password"
                        label="Confirm your password to disable 2FA"
                        type="password"
                        value={currentPasswordFor2FA}
                        onChange={(e) => setCurrentPasswordFor2FA(e.target.value)}
                        placeholder="Enter password"
                        required
                      />
                      <Button variant="danger" type="submit" size="sm" loading={busyAction === '2fa-disable'} disabled={busyAction === '2fa-disable'}>
                        {busyAction === '2fa-disable' ? 'Disabling…' : 'Disable 2FA'}
                      </Button>
                    </form>
                  )}

                  {securityError && <p className="mt-3 text-sm text-error">{securityError}</p>}
                  {securityMessage && <p className="mt-3 text-sm text-primary">{securityMessage}</p>}
                </div>
              )}

              <div className="mt-8 rounded-xl border border-error/25 bg-error/5 p-5">
                <h3 className="mb-4 text-sm font-bold text-error">Danger Zone</h3>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-on-surface">Delete account</div>
                    <div className="text-sm text-on-surface-variant">Permanently delete your account and all data</div>
                  </div>
                  <Button variant="danger" size="sm" id="delete-account">
                    <Trash2 size={14} />
                    Delete account
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {tab === 'notifications' && (
            <Card padding="lg">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-on-surface">
                <Bell size={18} className="text-primary" />
                Notification Preferences
              </h2>
              <div className="divide-y divide-outline-variant/15">
                {[
                  { label: 'Analysis complete', desc: 'When your gap analysis finishes', checked: true },
                  { label: 'Weekly digest', desc: 'Summary of your progress every Monday', checked: false },
                  { label: 'Roadmap reminders', desc: 'Reminders to continue your learning plan', checked: true },
                  { label: 'Product updates', desc: 'New features and announcements', checked: false },
                ].map((n, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div>
                      <div className="text-sm font-bold text-on-surface">{n.label}</div>
                      <div className="text-sm text-on-surface-variant">{n.desc}</div>
                    </div>
                    <button
                      type="button"
                      className={cn(
                        'relative h-7 w-12 shrink-0 rounded-full transition-colors',
                        n.checked ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant/30',
                      )}
                      role="switch"
                      aria-checked={n.checked}
                      id={`notif-${i}`}
                    >
                      <span
                        className={cn(
                          'absolute top-1 h-5 w-5 rounded-full bg-on-primary-fixed shadow transition-all',
                          n.checked ? 'left-6' : 'left-1',
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  )
}
