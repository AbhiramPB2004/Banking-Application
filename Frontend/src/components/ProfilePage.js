import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api/api';
import './ProfilePage.css';

const ProfilePage = () => {
  const { currentUser, refreshUser, showToast } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingKYC, setEditingKYC] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    full_name: currentUser?.full_name || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    occupation: currentUser?.occupation || '',
    annual_income: currentUser?.annual_income || '',
  });

  const [kyc, setKYC] = useState({
    aadhaar_number: currentUser?.aadhaar_number || '',
    pan_number: currentUser?.pan_number || '',
    kyc_status: currentUser?.kyc_status || 'pending',
  });

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      await userAPI.updateProfile(profile);
      await refreshUser();
      setEditing(false);
      showToast('success', 'Profile updated successfully');
    } catch (err) {
      showToast('error', err.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleKYCSave = async () => {
    setLoading(true);
    try {
      await userAPI.updateKYC(kyc);
      await refreshUser();
      setEditingKYC(false);
      showToast('success', 'KYC updated successfully');
    } catch (err) {
      showToast('error', err.data?.message || 'Failed to update KYC');
    } finally {
      setLoading(false);
    }
  };

  const kycStatusColor = {
    verified: 'badge-success',
    pending: 'badge-warning',
    rejected: 'badge-danger',
  };

  // Check if KYC is verified - if yes, disable editing
  const isKYCVerified = currentUser?.kyc_status === 'verified';
  const isKYCRejected = currentUser?.kyc_status === 'rejected';

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View and manage your personal information</p>
      </div>

      {/* Profile Card */}
      <div className="profile-hero-card">
        <div className="profile-avatar">
          <i className="fas fa-user" />
        </div>
        <div className="profile-hero-info">
          <h2>{currentUser?.full_name}</h2>
          <p>{currentUser?.email}</p>
          <div className="profile-badges">
            <span className={`badge ${currentUser?.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
              <i className="fas fa-circle" style={{ fontSize: '6px' }} /> {currentUser?.status}
            </span>
            <span className="badge badge-info capitalize">{currentUser?.role}</span>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="profile-section">
        <div className="section-title-row">
          <h3><i className="fas fa-user-edit" /> Personal Information</h3>
          {!editing ? (
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
              <i className="fas fa-pen" /> Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleProfileSave} disabled={loading}>
                {loading ? <div className="loading-spinner sm" /> : <><i className="fas fa-save" /> Save</>}
              </button>
            </div>
          )}
        </div>

        <div className="profile-form-grid">
          <div className="input-group">
            <label><i className="fas fa-user" /> Full Name</label>
            <input className="input-field" value={editing ? profile.full_name : currentUser?.full_name || ''}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              disabled={!editing} />
          </div>
          <div className="input-group">
            <label><i className="fas fa-envelope" /> Email</label>
            <input className="input-field" value={currentUser?.email || ''} disabled />
            <div className="input-hint"><i className="fas fa-lock" /> Email cannot be changed</div>
          </div>
          <div className="input-group">
            <label><i className="fas fa-phone-alt" /> Phone</label>
            <input className="input-field" value={editing ? profile.phone : currentUser?.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              disabled={!editing} />
          </div>
          <div className="input-group">
            <label><i className="fas fa-briefcase" /> Occupation</label>
            <input className="input-field" value={editing ? profile.occupation : currentUser?.occupation || ''}
              onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
              disabled={!editing} />
          </div>
          <div className="input-group">
            <label><i className="fas fa-rupee-sign" /> Annual Income</label>
            <input className="input-field" type="number"
              value={editing ? profile.annual_income : currentUser?.annual_income || ''}
              onChange={(e) => setProfile({ ...profile, annual_income: e.target.value })}
              disabled={!editing} />
          </div>
          <div className="input-group full-width">
            <label><i className="fas fa-map-marker-alt" /> Address</label>
            <textarea className="input-field" rows="2"
              value={editing ? profile.address : currentUser?.address || ''}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              disabled={!editing} />
          </div>
        </div>
      </div>

      {/* KYC Section */}
      <div className="profile-section">
        <div className="section-title-row">
          <h3><i className="fas fa-id-card" /> KYC Information</h3>
          <span className={`badge ${kycStatusColor[currentUser?.kyc_status] || 'badge-neutral'}`}>
            {currentUser?.kyc_status || 'pending'}
          </span>
        </div>

        <div className="profile-form-grid">
          <div className="input-group">
            <label><i className="fas fa-id-card" /> Aadhaar Number</label>
            <input className="input-field"
              value={editingKYC ? kyc.aadhaar_number : currentUser?.aadhaar_number || ''}
              onChange={(e) => setKYC({ ...kyc, aadhaar_number: e.target.value })}
              disabled={!editingKYC || isKYCVerified} />
          </div>
          <div className="input-group">
            <label><i className="fas fa-file-invoice" /> PAN Number</label>
            <input className="input-field"
              value={editingKYC ? kyc.pan_number : currentUser?.pan_number || ''}
              onChange={(e) => setKYC({ ...kyc, pan_number: e.target.value.toUpperCase() })}
              disabled={!editingKYC || isKYCVerified} />
          </div>
          <div className="input-group">
            <label><i className="fas fa-calendar" /> Date of Birth</label>
            <input className="input-field" value={currentUser?.dob || ''} disabled />
          </div>
          <div className="input-group">
            <label><i className="fas fa-venus-mars" /> Gender</label>
            <input className="input-field capitalize" value={currentUser?.gender || ''} disabled />
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          {!editingKYC ? (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => setEditingKYC(true)}
              disabled={isKYCVerified}
              title={isKYCVerified ? "KYC is already verified and cannot be edited" : "Update KYC information"}>
              <i className="fas fa-pen" /> Update KYC
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingKYC(false)}>Cancel</button>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={handleKYCSave} 
                disabled={loading || isKYCVerified}>
                {loading ? <div className="loading-spinner sm" /> : <><i className="fas fa-save" /> Save KYC</>}
              </button>
            </div>
          )}
        </div>

        {/* Info message for verified KYC */}
        {isKYCVerified && (
          <div style={{ marginTop: '12px' }} className="alert alert-info">
            <i className="fas fa-check-circle"></i> Your KYC is already verified. You cannot modify KYC details once verified.
          </div>
        )}

        {/* Info message for rejected KYC */}
        {isKYCRejected && (
          <div style={{ marginTop: '12px' }} className="alert alert-warning">
            <i className="fas fa-exclamation-triangle"></i> Your KYC was rejected. Please update your information for re-verification.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;