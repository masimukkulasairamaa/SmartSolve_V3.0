-- Phase 13: government administration and onboarding
-- Government/Super Admin can provision trusted platform accounts and organizations.
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, active);
CREATE INDEX IF NOT EXISTS idx_org_verified_active_type ON organizations(verified, active, organization_type);
