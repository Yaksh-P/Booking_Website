INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES
  ('user-admin-1', 'System Admin', 'admin@booking.local', 'seed-admin-password-hash', 'ADMIN', '2026-04-01T09:00:00Z'),
  ('user-customer-1', 'Jane Customer', 'jane@example.com', 'seed-customer-password-hash', 'CUSTOMER', '2026-04-01T09:10:00Z');

INSERT INTO services (id, name, description, duration_minutes, price, is_active, created_at) VALUES
  ('svc-hair-styling', 'Hair Styling Session', 'A 60 minute salon appointment.', 60, 65.00, TRUE, '2026-04-01T10:00:00Z'),
  ('svc-relax-massage', 'Relaxation Massage', 'A 60 minute massage service.', 60, 90.00, TRUE, '2026-04-01T10:05:00Z');

INSERT INTO time_slots (id, service_id, booking_date, start_time, end_time, capacity, created_at) VALUES
  ('slot-100', 'svc-hair-styling', '2026-04-10', '09:00', '10:00', 2, '2026-04-01T11:00:00Z'),
  ('slot-101', 'svc-hair-styling', '2026-04-10', '10:00', '11:00', 2, '2026-04-01T11:05:00Z'),
  ('slot-200', 'svc-relax-massage', '2026-04-11', '13:00', '14:00', 1, '2026-04-01T11:10:00Z'),
  ('slot-201', 'svc-relax-massage', '2026-04-11', '15:00', '16:00', 1, '2026-04-01T11:15:00Z');
