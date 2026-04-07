import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getBabies, createBaby, updateBaby, deleteBaby } from '../services/api';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import type { Baby } from '../types/scan';

interface BabyFormData {
  name: string;
  date_of_birth: string;
  notes: string;
}

const emptyForm: BabyFormData = { name: '', date_of_birth: '', notes: '' };

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<BabyFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<BabyFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const initials = user?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'U';

  useEffect(() => {
    getBabies()
      .then(setBabies)
      .catch(() => setError('Failed to load baby profiles'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const baby = await createBaby({
        name: addForm.name.trim(),
        date_of_birth: addForm.date_of_birth || undefined,
        notes: addForm.notes.trim() || undefined,
      });
      setBabies((prev) => [baby, ...prev]);
      setAddForm(emptyForm);
      setShowAddForm(false);
    } catch {
      setError('Failed to add baby');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (baby: Baby) => {
    setEditingId(baby.id);
    setEditForm({
      name: baby.name,
      date_of_birth: baby.date_of_birth ?? '',
      notes: baby.notes ?? '',
    });
    setShowAddForm(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !editForm.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateBaby(editingId, {
        name: editForm.name.trim(),
        date_of_birth: editForm.date_of_birth || undefined,
        notes: editForm.notes.trim() || undefined,
      });
      setBabies((prev) => prev.map((b) => (b.id === editingId ? updated : b)));
      setEditingId(null);
    } catch {
      setError('Failed to update baby');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}'s profile? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteBaby(id);
      setBabies((prev) => prev.filter((b) => b.id !== id));
      if (editingId === id) setEditingId(null);
    } catch {
      setError('Failed to delete baby');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const inputStyle = {
    width: '100%', height: '44px', borderRadius: '10px', border: '1.5px solid #E2E8F0',
    padding: '0 12px', fontSize: '14px', color: '#1A202C', background: '#F8FAFC',
    outline: 'none', boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 600 as const, color: '#64748B',
    textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px',
  };

  const renderForm = (form: BabyFormData, setForm: (f: BabyFormData) => void, onSubmit: () => void, onCancel: () => void, submitLabel: string) => (
    <div style={{ background: '#fff', borderRadius: '14px', border: '1.5px solid #E2E8F0', padding: '16px', marginBottom: '10px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Name</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Baby's name" style={inputStyle} />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Date of Birth</label>
        <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} style={inputStyle} />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Notes</label>
        <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onCancel} disabled={saving} style={{
          flex: 1, height: '42px', borderRadius: '10px', fontWeight: 600, fontSize: '13px',
          border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer',
        }}>
          Cancel
        </button>
        <button onClick={onSubmit} disabled={saving || !form.name.trim()} style={{
          flex: 1, height: '42px', borderRadius: '10px', fontWeight: 600, fontSize: '13px',
          border: 'none', color: '#fff', cursor: 'pointer',
          background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
          opacity: saving || !form.name.trim() ? 0.5 : 1,
        }}>
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ background: '#F5F7FA', minHeight: '100%' }}>
      {/* User info header */}
      <div style={{ padding: '20px 24px 24px', background: '#fff', borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1565C0, #00897B)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 auto 12px',
        }}>
          {initials}
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A202C' }}>{user?.display_name ?? 'User'}</div>
        <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>{user?.email}</div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {error && <div style={{ marginBottom: '12px' }}><Alert variant="error">{error}</Alert></div>}

        {/* Baby Profiles Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#1A202C' }}>Baby Profiles</span>
          <button
            onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); }}
            style={{ fontSize: '12px', fontWeight: 600, color: '#1565C0', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            {showAddForm ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {showAddForm && renderForm(addForm, setAddForm, handleAdd, () => { setShowAddForm(false); setAddForm(emptyForm); }, 'Add Baby')}

        {babies.length === 0 && !showAddForm && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px', textAlign: 'center', marginBottom: '10px' }}>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>No babies added yet.</p>
          </div>
        )}

        {babies.map((baby) => (
          editingId === baby.id ? (
            <div key={baby.id}>
              {renderForm(editForm, setEditForm, handleUpdate, () => setEditingId(null), 'Save')}
            </div>
          ) : (
            <div key={baby.id} style={{
              background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0',
              padding: '14px 16px', marginBottom: '10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A202C' }}>{baby.name}</div>
                {baby.date_of_birth && (
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                    Born {new Date(baby.date_of_birth).toLocaleDateString()}
                  </div>
                )}
                {baby.notes && (
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{baby.notes}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '12px' }}>
                <button onClick={() => startEdit(baby)} style={{
                  width: '34px', height: '34px', borderRadius: '8px', border: 'none',
                  background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(baby.id, baby.name)} style={{
                  width: '34px', height: '34px', borderRadius: '8px', border: 'none',
                  background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          )
        ))}

        {/* Settings Section */}
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A202C', marginTop: '24px', marginBottom: '12px' }}>Settings</div>
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: '24px' }}>
          {['Notifications', 'Dark Mode'].map((label, i) => (
            <div key={label} style={{
              padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: i > 0 ? '1px solid #F1F5F9' : 'none',
            }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A202C' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>Coming Soon</span>
                <div style={{
                  width: '42px', height: '24px', borderRadius: '12px', background: '#E2E8F0',
                  position: 'relative', opacity: 0.5,
                }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: '3px', left: '3px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button onClick={handleLogout} style={{
          width: '100%', height: '50px', borderRadius: '14px', fontWeight: 700, fontSize: '15px',
          border: 'none', color: '#fff', cursor: 'pointer',
          background: '#EF4444', letterSpacing: '0.3px',
        }}>
          Log Out
        </button>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '24px', paddingBottom: '16px' }}>
          <span style={{ fontSize: '11px', color: '#CBD5E1' }}>BabyBio v0.1.0</span>
        </div>
      </div>
    </div>
  );
}
