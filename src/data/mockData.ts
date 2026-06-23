/**
 * Mock data for demo mode — no network calls needed.
 */

export const MOCK_SERVICES = [
  { id: 'svc-001', name: 'General Consultation', description: 'Standard health check-up and consultation', duration_minutes: 30, price: 50, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'svc-002', name: 'Dental Cleaning', description: 'Professional dental cleaning and polish', duration_minutes: 45, price: 80, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'svc-003', name: 'Physical Therapy', description: 'Rehabilitation and physical therapy session', duration_minutes: 60, price: 120, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'svc-004', name: 'Eye Exam', description: 'Comprehensive eye examination', duration_minutes: 30, price: 60, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'svc-005', name: 'Skin Treatment', description: 'Dermatology consultation and treatment', duration_minutes: 45, price: 95, is_active: false, created_at: '2025-01-01', updated_at: '2025-01-01' },
];

export const MOCK_BUSINESS_HOURS = [
  { id: 'bh-0', day_of_week: 0, start_time: '09:00:00', end_time: '17:00:00', is_open: false, created_at: '2025-01-01' },
  { id: 'bh-1', day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00', is_open: true, created_at: '2025-01-01' },
  { id: 'bh-2', day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00', is_open: true, created_at: '2025-01-01' },
  { id: 'bh-3', day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00', is_open: true, created_at: '2025-01-01' },
  { id: 'bh-4', day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00', is_open: true, created_at: '2025-01-01' },
  { id: 'bh-5', day_of_week: 5, start_time: '09:00:00', end_time: '14:00:00', is_open: true, created_at: '2025-01-01' },
  { id: 'bh-6', day_of_week: 6, start_time: '09:00:00', end_time: '17:00:00', is_open: false, created_at: '2025-01-01' },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

export const MOCK_APPOINTMENTS = [
  {
    id: 'apt-001', user_id: 'customer-001', service_id: 'svc-001', staff_id: 'staff-001',
    appointment_date: fmt(tomorrow), start_time: '10:00:00', end_time: '10:30:00',
    status: 'confirmed', notes: '', created_at: fmt(yesterday), updated_at: fmt(yesterday),
    services: { name: 'General Consultation', duration_minutes: 30, price: 50 },
    customer_profile: { user_id: 'customer-001', full_name: 'Jane Smith', email: 'client@bookflow.demo' },
    profiles: { full_name: 'Jane Smith', email: 'client@bookflow.demo' },
    staff: { full_name: 'Dr. Sarah Chen', email: 'doctor@bookflow.demo' },
  },
  {
    id: 'apt-002', user_id: 'customer-002', service_id: 'svc-002', staff_id: 'staff-002',
    appointment_date: fmt(dayAfter), start_time: '14:00:00', end_time: '14:45:00',
    status: 'pending', notes: '', created_at: fmt(today), updated_at: fmt(today),
    services: { name: 'Dental Cleaning', duration_minutes: 45, price: 80 },
    customer_profile: { user_id: 'customer-002', full_name: 'John Doe', email: 'user@bookflow.demo' },
    profiles: { full_name: 'John Doe', email: 'user@bookflow.demo' },
    staff: { full_name: 'Mike Johnson', email: 'manager@bookflow.demo' },
  },
  {
    id: 'apt-003', user_id: 'customer-001', service_id: 'svc-003', staff_id: 'staff-001',
    appointment_date: fmt(yesterday), start_time: '09:00:00', end_time: '10:00:00',
    status: 'completed', notes: '', created_at: '2025-02-25', updated_at: fmt(yesterday),
    services: { name: 'Physical Therapy', duration_minutes: 60, price: 120 },
    customer_profile: { user_id: 'customer-001', full_name: 'Jane Smith', email: 'client@bookflow.demo' },
    profiles: { full_name: 'Jane Smith', email: 'client@bookflow.demo' },
    staff: { full_name: 'Dr. Sarah Chen', email: 'doctor@bookflow.demo' },
  },
  {
    id: 'apt-004', user_id: 'customer-002', service_id: 'svc-001', staff_id: null,
    appointment_date: fmt(today), start_time: '11:00:00', end_time: '11:30:00',
    status: 'cancelled', notes: '', created_at: '2025-02-24', updated_at: '2025-02-26',
    services: { name: 'General Consultation', duration_minutes: 30, price: 50 },
    customer_profile: { user_id: 'customer-002', full_name: 'John Doe', email: 'user@bookflow.demo' },
    profiles: { full_name: 'John Doe', email: 'user@bookflow.demo' },
    staff: null,
  },
];

export const MOCK_STAFF_AVAILABILITY = [
  { id: 'sa-01', staff_id: 'staff-001', day_of_week: 1, start_time: '09:00', end_time: '17:00', is_available: true, created_at: '2025-01-01' },
  { id: 'sa-02', staff_id: 'staff-001', day_of_week: 2, start_time: '09:00', end_time: '17:00', is_available: true, created_at: '2025-01-01' },
  { id: 'sa-03', staff_id: 'staff-001', day_of_week: 3, start_time: '09:00', end_time: '17:00', is_available: true, created_at: '2025-01-01' },
  { id: 'sa-04', staff_id: 'staff-001', day_of_week: 4, start_time: '09:00', end_time: '17:00', is_available: true, created_at: '2025-01-01' },
  { id: 'sa-05', staff_id: 'staff-001', day_of_week: 5, start_time: '09:00', end_time: '14:00', is_available: true, created_at: '2025-01-01' },
  { id: 'sa-06', staff_id: 'staff-001', day_of_week: 0, start_time: '09:00', end_time: '17:00', is_available: false, created_at: '2025-01-01' },
  { id: 'sa-07', staff_id: 'staff-001', day_of_week: 6, start_time: '09:00', end_time: '17:00', is_available: false, created_at: '2025-01-01' },
  { id: 'sa-08', staff_id: 'staff-002', day_of_week: 1, start_time: '10:00', end_time: '18:00', is_available: true, created_at: '2025-01-01' },
  { id: 'sa-09', staff_id: 'staff-002', day_of_week: 2, start_time: '10:00', end_time: '18:00', is_available: true, created_at: '2025-01-01' },
  { id: 'sa-10', staff_id: 'staff-002', day_of_week: 3, start_time: '10:00', end_time: '18:00', is_available: true, created_at: '2025-01-01' },
  { id: 'sa-11', staff_id: 'staff-002', day_of_week: 4, start_time: '10:00', end_time: '18:00', is_available: true, created_at: '2025-01-01' },
  { id: 'sa-12', staff_id: 'staff-002', day_of_week: 5, start_time: '10:00', end_time: '14:00', is_available: true, created_at: '2025-01-01' },
  { id: 'sa-13', staff_id: 'staff-002', day_of_week: 0, start_time: '10:00', end_time: '18:00', is_available: false, created_at: '2025-01-01' },
  { id: 'sa-14', staff_id: 'staff-002', day_of_week: 6, start_time: '10:00', end_time: '18:00', is_available: false, created_at: '2025-01-01' },
];

export const MOCK_PROFILES = [
  { user_id: 'admin-001', full_name: 'Admin User', email: 'admin@bookflow.demo', phone: null },
  { user_id: 'staff-001', full_name: 'Dr. Sarah Chen', email: 'doctor@bookflow.demo', phone: null },
  { user_id: 'staff-002', full_name: 'Mike Johnson', email: 'manager@bookflow.demo', phone: null },
  { user_id: 'customer-001', full_name: 'Jane Smith', email: 'client@bookflow.demo', phone: null },
  { user_id: 'customer-002', full_name: 'John Doe', email: 'user@bookflow.demo', phone: null },
];
