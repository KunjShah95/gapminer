import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import {
  User, FileText, Settings, Shield, Trash2, Upload,
  Check, Edit3, Bell, Key, Download
} from 'lucide-react'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'profile' | 'resume' | 'security' | 'notifications'>('profile')
  const [name, setName] = useState(user?.name || '')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await new Promise((r) => setTimeout(r, 500))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
                  id="save-profile"
                >
                  {saved ? <><Check size={16} /> Saved!</> : <><Edit3 size={16} /> Save changes</>}
                </button>
              </div>
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
                  <div className={styles.securityDesc}>Last changed 3 months ago</div>
                </div>
                <button className="btn btn-secondary btn-sm" id="change-password">Change password</button>
              </div>

              <div className={styles.securityItem}>
                <div>
                  <div className={styles.securityLabel}>Two-factor authentication</div>
                  <div className={styles.securityDesc}>Add an extra layer of security</div>
                </div>
                <button className="btn btn-secondary btn-sm" id="enable-2fa">Enable 2FA</button>
              </div>

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
