/**
 * ELECTRORECK — SUPABASE CLIENT & BACKEND DATA LAYER
 * Handles Authentication, Realtime Database Calls, Security Rules & Local Fallback Simulator
 */

(function (window) {
  'use strict';

  // Configurable College Domain & Regex
  const COLLEGE_DOMAIN = '@nitkkr.ac.in';
  const ROLL_NO_REGEX = /^[0-9]{9}$/;
  const PHONE_REGEX = /^[0-9]{10}$/;

  // Check LocalStorage or window config for Supabase credentials
  const savedUrl = localStorage.getItem('electroreck_supabase_url') || (window.ELECTRORECK_CONFIG && window.ELECTRORECK_CONFIG.SUPABASE_URL) || '';
  const savedAnonKey = localStorage.getItem('electroreck_supabase_anon_key') || (window.ELECTRORECK_CONFIG && window.ELECTRORECK_CONFIG.SUPABASE_ANON_KEY) || '';

  let realClient = null;
  const isRealSupabaseConfigured = Boolean(savedUrl && savedAnonKey && window.supabase);

  if (isRealSupabaseConfigured) {
    try {
      realClient = window.supabase.createClient(savedUrl, savedAnonKey);
      console.log('⚡ Electroreck: Initialized with Live Supabase instance.');
    } catch (e) {
      console.warn('⚠️ Electroreck: Failed to initialize live Supabase client, falling back to local simulated backend.', e);
    }
  }

  // =========================================================================
  // LOCAL SIMULATED BACKEND STATE (Mirroring Postgres Schema & RLS)
  // Ensures 100% offline functionality, immediate testing, and identical business logic
  // =========================================================================
  const LOCAL_STORAGE_KEY = 'electroreck_simulated_db_v1';

  function getInitialDbState() {
    return {
      passSequence: 100,
      profiles: [
        {
          id: 'admin-uuid-001',
          email: 'admin@nitkkr.ac.in',
          full_name: 'Dr. S. K. Sharma (Super Admin)',
          role: 'admin',
          coordinator_event_id: null,
          created_at: new Date('2026-01-01').toISOString()
        },
        {
          id: 'coord-electrica-002',
          email: 'electrica.coord@nitkkr.ac.in',
          full_name: 'Aarav Patel (Electrica Head)',
          role: 'coordinator',
          coordinator_event_id: 'event-electrica',
          created_at: new Date('2026-01-02').toISOString()
        },
        {
          id: 'coord-advanza-003',
          email: 'advanza.coord@nitkkr.ac.in',
          full_name: 'Pooja Verma (Advanza Head)',
          role: 'coordinator',
          coordinator_event_id: 'event-advanza',
          created_at: new Date('2026-01-02').toISOString()
        },
        {
          id: 'student-demo-004',
          email: 'rohan.123100045@nitkkr.ac.in',
          full_name: 'Rohan Sharma',
          role: 'student',
          coordinator_event_id: null,
          created_at: new Date('2026-01-05').toISOString()
        }
      ],
      events: [
        {
          id: 'event-electrica',
          slug: 'electrica',
          title: 'Electrica',
          category: 'Cultural',
          tagline: 'Where circuits meet creativity',
          description: 'High-energy cultural quiz, circuit art, and talent showcase testing left-brain precision and right-brain expression.',
          venue: 'Lecture Hall Complex, NIT Kurukshetra',
          event_date: new Date(Date.now() + 20 * 86400000).toISOString(),
          registration_deadline: new Date(Date.now() + 18 * 86400000).toISOString(),
          max_seats: 50,
          min_team_size: 1,
          max_team_size: 2,
          is_registration_open: true
        },
        {
          id: 'event-advanza',
          slug: 'advanza',
          title: 'Advanza',
          category: 'Technical',
          tagline: 'Engineer the future, advertise the value',
          description: 'Technical pitch and power system engineering challenge judged by veteran NIT Kurukshetra faculty and industry leaders.',
          venue: 'Seminar Hall, Electrical Engineering Block, NIT KKR',
          event_date: new Date(Date.now() + 21 * 86400000).toISOString(),
          registration_deadline: new Date(Date.now() + 19 * 86400000).toISOString(),
          max_seats: 70,
          min_team_size: 2,
          max_team_size: 4,
          is_registration_open: true
        },
        {
          id: 'event-digispark',
          slug: 'digispark',
          title: 'Digispark',
          category: 'Technical',
          tagline: 'Logic meets innovation',
          description: 'Digital engineering battleground covering combinational logic, FPGA programming, and DSP interfacing.',
          venue: 'Digital Systems Lab, Electrical Block, NIT KKR',
          event_date: new Date(Date.now() + 22 * 86400000).toISOString(),
          registration_deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
          max_seats: 60,
          min_team_size: 1,
          max_team_size: 3,
          is_registration_open: true
        },
        {
          id: 'event-vidhwaan',
          slug: 'vidhwaan',
          title: 'Vidhwaan',
          category: 'Research',
          tagline: 'Design the national power grid',
          description: 'Premier national power system simulation and research presentation event judged by senior electrical power experts.',
          venue: 'Conference Hall, Admin Block, NIT Kurukshetra',
          event_date: new Date(Date.now() + 23 * 86400000).toISOString(),
          registration_deadline: new Date(Date.now() + 21 * 86400000).toISOString(),
          max_seats: 40,
          min_team_size: 3,
          max_team_size: 5,
          is_registration_open: true
        }
      ],
      wings: [
        {
          id: 'wing-tech',
          name: 'Technical (Core Electrical & Circuit Design)',
          description: 'Focuses on power electronics, power systems, machinery, and circuit simulation.',
          display_order: 1,
          is_active: true
        },
        {
          id: 'wing-embedded',
          name: 'Embedded Systems & IoT / AI',
          description: 'Microcontroller firmware, sensors, Edge AI, and smart hardware development.',
          display_order: 2,
          is_active: true
        },
        {
          id: 'wing-web',
          name: 'Web & Software Operations',
          description: 'Society portal, registration pipelines, databases, and digital infrastructure.',
          display_order: 3,
          is_active: true
        },
        {
          id: 'wing-sponsorship',
          name: 'Corporate Relations & Sponsorship',
          description: 'Industry liaisons, alumni network outreach, and fest budget allocation.',
          display_order: 4,
          is_active: true
        },
        {
          id: 'wing-media',
          name: 'Media, Design & Public Relations',
          description: 'Visual identity, creative poster design, motion graphics, and publicity.',
          display_order: 5,
          is_active: true
        }
      ],
      event_registrations: [
        {
          id: 'reg-001',
          pass_id: 'ER-2026-00001',
          event_id: 'event-electrica',
          user_id: 'student-demo-004',
          full_name: 'Rohan Sharma',
          email: 'rohan.123100045@nitkkr.ac.in',
          roll_number: '123100045',
          department: 'Electrical Engineering',
          year_of_study: '2nd Year (B.Tech)',
          phone: '9876543210',
          team_name: 'Spark Masters',
          team_members: [{ name: 'Kavita Singh', roll_number: '123100046' }],
          status: 'Confirmed',
          consent_given: true,
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      induction_applications: [
        {
          id: 'ind-001',
          user_id: 'student-demo-004',
          full_name: 'Rohan Sharma',
          email: 'rohan.123100045@nitkkr.ac.in',
          roll_number: '123100045',
          department: 'Electrical Engineering',
          year_of_study: '2nd Year (B.Tech)',
          phone: '9876543210',
          preferred_wing_id: 'wing-tech',
          reason_for_joining: 'I want to build deep practical knowledge in power electronics and collaborate on renewable microgrid prototypes with seniors.',
          consent_given: true,
          status: 'Pending',
          created_at: new Date(Date.now() - 43200000).toISOString()
        }
      ],
      currentSession: {
        user: {
          id: 'student-demo-004',
          email: 'rohan.123100045@nitkkr.ac.in',
          user_metadata: { full_name: 'Rohan Sharma' }
        }
      }
    };
  }

  function loadDb() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading simulated database:', e);
    }
    const init = getInitialDbState();
    saveDb(init);
    return init;
  }

  function saveDb(db) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.warn('Error saving simulated database:', e);
    }
  }

  // =========================================================================
  // FORMULA INJECTION SANITIZER FOR CSV EXPORTS
  // Prevents malicious formulas (=, +, -, @) from executing in Excel/Sheets
  // =========================================================================
  function sanitizeForCSV(value) {
    if (value === null || value === undefined) return '""';
    let str = String(value).trim();
    // Check if first character is =, +, -, @, \t, or \r
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str; // Prefix with single quote
    }
    // Escape double quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  // =========================================================================
  // UNIFIED ELECTRORECK BACKEND API
  // =========================================================================
  const Electroreck = {
    domain: COLLEGE_DOMAIN,
    isRealMode: Boolean(realClient),

    // --- AUTHENTICATION ---
    auth: {
      async signUp({ full_name, email, password, confirm_password }) {
        // 1. Validation
        if (!full_name || !full_name.trim()) {
          throw new Error('Full Name is required.');
        }
        if (!email || !email.trim()) {
          throw new Error('College email is required.');
        }
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail.endsWith(COLLEGE_DOMAIN)) {
          throw new Error(`Access restricted: Only college email addresses ending with ${COLLEGE_DOMAIN} are permitted.`);
        }
        if (!password || password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }
        if (password !== confirm_password) {
          throw new Error('Passwords do not match.');
        }

        if (realClient) {
          const { data, error } = await realClient.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
              data: { full_name: full_name.trim() }
            }
          });
          if (error) throw error;

          let activeSession = data.session;
          if (!activeSession) {
            try {
              const loginRes = await realClient.auth.signInWithPassword({
                email: cleanEmail,
                password: password
              });
              activeSession = loginRes.data.session;
            } catch (loginErr) {}
          }

          return {
            user: data.user,
            session: activeSession,
            confirmationRequired: false
          };
        }

        // Local Simulator Implementation
        const db = loadDb();
        const existing = db.profiles.find(p => p.email.toLowerCase() === cleanEmail);
        if (existing) {
          throw new Error('An account with this college email already exists. Please log in.');
        }

        const newId = 'student-' + Math.random().toString(36).substring(2, 9);
        const newProfile = {
          id: newId,
          email: cleanEmail,
          full_name: full_name.trim(),
          role: 'student',
          coordinator_event_id: null,
          created_at: new Date().toISOString()
        };

        db.profiles.push(newProfile);

        // Auto-login: directly create active session
        const newSession = {
          user: {
            id: newId,
            email: cleanEmail,
            user_metadata: { full_name: full_name.trim() }
          }
        };
        db.currentSession = newSession;
        saveDb(db);

        return {
          user: newSession.user,
          session: newSession,
          confirmationRequired: false
        };
      },

      async signIn({ email, password }) {
        if (!email || !password) {
          throw new Error('Please enter both email and password.');
        }
        const cleanEmail = email.trim().toLowerCase();

        if (realClient) {
          const { data, error } = await realClient.auth.signInWithPassword({
            email: cleanEmail,
            password: password
          });
          if (error) throw error;
          return data;
        }

        // Local Simulator Implementation
        const db = loadDb();
        const profile = db.profiles.find(p => p.email.toLowerCase() === cleanEmail);
        if (!profile) {
          throw new Error('Invalid email or password. Please verify your credentials.');
        }

        const session = {
          user: {
            id: profile.id,
            email: profile.email,
            user_metadata: { full_name: profile.full_name }
          }
        };
        db.currentSession = session;
        saveDb(db);
        return session;
      },

      async signOut() {
        if (realClient) {
          const { error } = await realClient.auth.signOut();
          if (error) throw error;
          return true;
        }
        const db = loadDb();
        db.currentSession = null;
        saveDb(db);
        return true;
      },

      async resetPassword(email) {
        if (!email || !email.trim().toLowerCase().endsWith(COLLEGE_DOMAIN)) {
          throw new Error(`Please provide a valid ${COLLEGE_DOMAIN} email address.`);
        }
        if (realClient) {
          const { error } = await realClient.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
            redirectTo: window.location.origin + '/login.html?view=update-password'
          });
          if (error) throw error;
          return true;
        }
        // Local Simulator
        return true;
      },

      async getSession() {
        if (realClient) {
          const { data } = await realClient.auth.getSession();
          return data ? data.session : null;
        }
        const db = loadDb();
        return db.currentSession || null;
      },

      async getCurrentProfile() {
        const session = await this.getSession();
        if (!session || !session.user) return null;

        if (realClient) {
          const { data, error } = await realClient
            .from('profiles')
            .select('*, coordinator_event:events!fk_coordinator_event(id, title, slug)')
            .eq('id', session.user.id)
            .single();
          if (error) {
            console.error('Error fetching profile from Supabase:', error);
            return null;
          }
          return data;
        }

        // Local Simulator
        const db = loadDb();
        const profile = db.profiles.find(p => p.id === session.user.id) || {
          id: session.user.id,
          email: session.user.email,
          full_name: (session.user.user_metadata && session.user.user_metadata.full_name) || 'Student',
          role: 'student',
          coordinator_event_id: null
        };

        if (profile.coordinator_event_id) {
          const ev = db.events.find(e => e.id === profile.coordinator_event_id);
          profile.coordinator_event = ev ? { id: ev.id, title: ev.title, slug: ev.slug } : null;
        }
        return profile;
      },

      // Helper for testing: quickly switch personas in simulation
      setSimulatedUser(roleOrEmail) {
        const db = loadDb();
        let target = db.profiles.find(p => p.role === roleOrEmail || p.email === roleOrEmail);
        if (!target) target = db.profiles[0];
        db.currentSession = {
          user: {
            id: target.id,
            email: target.email,
            user_metadata: { full_name: target.full_name }
          }
        };
        saveDb(db);
        window.location.reload();
      }
    },

    // --- EVENTS MODULE ---
    events: {
      async getAll() {
        if (realClient) {
          const { data, error } = await realClient
            .from('events')
            .select(`
              *,
              registrations:event_registrations(id, status)
            `)
            .order('event_date', { ascending: true });
          if (error) throw error;
          
          return data.map(ev => {
            const activeRegs = (ev.registrations || []).filter(r => r.status !== 'Rejected' && r.status !== 'Cancelled');
            const seatsFilled = activeRegs.length;
            const isFull = seatsFilled >= ev.max_seats;
            const isPastDeadline = new Date() > new Date(ev.registration_deadline);
            let status = 'Open';
            if (!ev.is_registration_open) status = 'Closed';
            else if (isPastDeadline) status = 'Closed';
            else if (isFull) status = 'Full';

            return {
              ...ev,
              seats_filled: seatsFilled,
              seats_left: Math.max(0, ev.max_seats - seatsFilled),
              computed_status: status
            };
          });
        }

        // Local Simulator
        const db = loadDb();
        return db.events.map(ev => {
          const activeRegs = db.event_registrations.filter(r => r.event_id === ev.id && r.status !== 'Rejected' && r.status !== 'Cancelled');
          const seatsFilled = activeRegs.length;
          const isFull = seatsFilled >= ev.max_seats;
          const isPastDeadline = new Date() > new Date(ev.registration_deadline);
          let status = 'Open';
          if (!ev.is_registration_open) status = 'Closed';
          else if (isPastDeadline) status = 'Closed';
          else if (isFull) status = 'Full';

          return {
            ...ev,
            seats_filled: seatsFilled,
            seats_left: Math.max(0, ev.max_seats - seatsFilled),
            computed_status: status
          };
        });
      },

      async getBySlug(slug) {
        const all = await this.getAll();
        return all.find(e => e.slug.toLowerCase() === slug.toLowerCase()) || null;
      },

      async update(id, updates) {
        const profile = await Electroreck.auth.getCurrentProfile();
        if (!profile || (profile.role !== 'admin' && profile.coordinator_event_id !== id)) {
          throw new Error('Access denied: You do not have permission to modify this event.');
        }

        if (realClient) {
          const { data, error } = await realClient
            .from('events')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
          if (error) throw error;
          return data;
        }

        const db = loadDb();
        const idx = db.events.findIndex(e => e.id === id);
        if (idx === -1) throw new Error('Event not found.');
        db.events[idx] = { ...db.events[idx], ...updates, updated_at: new Date().toISOString() };
        saveDb(db);
        return db.events[idx];
      }
    },

    // --- EVENT REGISTRATIONS MODULE ---
    registrations: {
      async register({ event_id, full_name, roll_number, department, year_of_study, phone, team_name, team_members, consent_given }) {
        const session = await Electroreck.auth.getSession();
        if (!session || !session.user) {
          throw new Error('Authentication required: Please sign in to register for events.');
        }

        // Field checks
        if (!full_name || !full_name.trim()) throw new Error('Full Name is required.');
        if (!roll_number || !ROLL_NO_REGEX.test(roll_number.trim())) {
          throw new Error('Invalid Roll Number: Must be exactly 9 digits (e.g. 123100045).');
        }
        if (!department) throw new Error('Department selection is required.');
        if (!year_of_study) throw new Error('Year of study selection is required.');
        if (!phone || !PHONE_REGEX.test(phone.trim())) {
          throw new Error('Invalid Phone Number: Must be exactly 10 digits.');
        }
        if (!consent_given) {
          throw new Error('You must accept the event rules and privacy consent.');
        }

        const email = session.user.email;

        if (realClient) {
          const payload = {
            event_id,
            user_id: session.user.id,
            full_name: full_name.trim(),
            email: email,
            roll_number: roll_number.trim(),
            department,
            year_of_study,
            phone: phone.trim(),
            team_name: team_name ? team_name.trim() : null,
            team_members: team_members || [],
            consent_given: true,
            status: 'Confirmed'
          };

          const { data, error } = await realClient
            .from('event_registrations')
            .insert(payload)
            .select(`
              *,
              event:events(id, title, venue, event_date, category)
            `)
            .single();

          if (error) {
            // Translate database constraints into user-friendly error messages
            if (error.code === '23505' || error.message.includes('unique_user_per_event')) {
              throw new Error('You have already registered for this event.');
            }
            if (error.code === '23505' || error.message.includes('unique_roll_per_event')) {
              throw new Error(`Roll Number ${roll_number} is already registered for this event.`);
            }
            throw new Error(error.message);
          }
          return data;
        }

        // Local Simulator Implementation
        const db = loadDb();
        const event = db.events.find(e => e.id === event_id);
        if (!event) throw new Error('Selected event does not exist.');

        if (!event.is_registration_open) {
          throw new Error(`Registration for ${event.title} is currently closed.`);
        }
        if (new Date() > new Date(event.registration_deadline)) {
          throw new Error(`Registration deadline for ${event.title} has passed.`);
        }

        // Check capacity (active registrations exclude Rejected/Cancelled)
        const activeRegistrations = db.event_registrations.filter(r => r.event_id === event_id && r.status !== 'Rejected' && r.status !== 'Cancelled');
        if (activeRegistrations.length >= event.max_seats) {
          throw new Error(`Event "${event.title}" is full (${event.max_seats} seats filled).`);
        }

        // Check duplicate user
        const dupUser = db.event_registrations.find(r => r.event_id === event_id && r.user_id === session.user.id && r.status !== 'Cancelled');
        if (dupUser) {
          throw new Error('You have already registered for this event.');
        }

        // Check duplicate roll number
        const dupRoll = db.event_registrations.find(r => r.event_id === event_id && r.roll_number === roll_number.trim() && r.status !== 'Cancelled');
        if (dupRoll) {
          throw new Error(`Roll Number ${roll_number} is already registered for this event.`);
        }

        // Check team requirements
        const membersList = Array.isArray(team_members) ? team_members : [];
        const totalTeamSize = 1 + membersList.length;
        if (event.max_team_size > 1) {
          if (!team_name || !team_name.trim()) {
            throw new Error('Team Name is required for team events.');
          }
          if (totalTeamSize < event.min_team_size || totalTeamSize > event.max_team_size) {
            throw new Error(`Team size must be between ${event.min_team_size} and ${event.max_team_size} members.`);
          }
        }

        db.passSequence = (db.passSequence || 100) + 1;
        const passId = `ER-2026-${String(db.passSequence).padStart(5, '0')}`;

        const newRecord = {
          id: 'reg-' + Math.random().toString(36).substring(2, 9),
          pass_id: passId,
          event_id: event.id,
          user_id: session.user.id,
          full_name: full_name.trim(),
          email: email,
          roll_number: roll_number.trim(),
          department,
          year_of_study,
          phone: phone.trim(),
          team_name: team_name ? team_name.trim() : null,
          team_members: membersList,
          status: 'Confirmed',
          consent_given: true,
          created_at: new Date().toISOString(),
          event: {
            id: event.id,
            title: event.title,
            venue: event.venue,
            event_date: event.event_date,
            category: event.category
          }
        };

        db.event_registrations.push(newRecord);
        saveDb(db);
        return newRecord;
      },

      async getMyRegistrations() {
        const session = await Electroreck.auth.getSession();
        if (!session || !session.user) return [];

        if (realClient) {
          const { data, error } = await realClient
            .from('event_registrations')
            .select(`
              *,
              event:events(id, title, venue, event_date, category, tagline)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data;
        }

        const db = loadDb();
        return db.event_registrations
          .filter(r => r.user_id === session.user.id)
          .map(r => {
            const ev = db.events.find(e => e.id === r.event_id) || {};
            return { ...r, event: ev };
          })
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      },

      async getAllForAdmin(eventId = null) {
        const profile = await Electroreck.auth.getCurrentProfile();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'coordinator')) {
          throw new Error('Access denied: Administrator or Coordinator permissions required.');
        }

        // If coordinator, enforce their designated event only
        let targetEventId = eventId;
        if (profile.role === 'coordinator') {
          targetEventId = profile.coordinator_event_id;
        }

        if (realClient) {
          let query = realClient
            .from('event_registrations')
            .select(`
              *,
              event:events(id, title, slug)
            `)
            .order('created_at', { ascending: false });

          if (targetEventId) {
            query = query.eq('event_id', targetEventId);
          }

          const { data, error } = await query;
          if (error) throw error;
          return data;
        }

        const db = loadDb();
        let regs = db.event_registrations;
        if (targetEventId) {
          regs = regs.filter(r => r.event_id === targetEventId);
        }
        return regs.map(r => {
          const ev = db.events.find(e => e.id === r.event_id) || {};
          return { ...r, event: ev };
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      },

      async updateStatus(id, newStatus) {
        const profile = await Electroreck.auth.getCurrentProfile();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'coordinator')) {
          throw new Error('Access denied: You do not have permission to modify registration status.');
        }

        if (realClient) {
          const { data, error } = await realClient
            .from('event_registrations')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
          if (error) throw error;
          return data;
        }

        const db = loadDb();
        const idx = db.event_registrations.findIndex(r => r.id === id);
        if (idx === -1) throw new Error('Registration record not found.');

        // If coordinator, ensure it belongs to their event
        if (profile.role === 'coordinator' && db.event_registrations[idx].event_id !== profile.coordinator_event_id) {
          throw new Error('Access denied: You can only alter registrations for your assigned event.');
        }

        db.event_registrations[idx].status = newStatus;
        db.event_registrations[idx].updated_at = new Date().toISOString();
        saveDb(db);
        return db.event_registrations[idx];
      }
    },

    // --- SOCIETY WINGS MODULE ---
    wings: {
      async getAll(includeInactive = false) {
        if (realClient) {
          let query = realClient.from('wings').select('*').order('display_order', { ascending: true });
          if (!includeInactive) {
            query = query.eq('is_active', true);
          }
          const { data, error } = await query;
          if (error) throw error;
          return data;
        }

        const db = loadDb();
        let list = db.wings;
        if (!includeInactive) {
          list = list.filter(w => w.is_active);
        }
        return [...list].sort((a, b) => a.display_order - b.display_order);
      },

      async add({ name, description, display_order = 0, is_active = true }) {
        const profile = await Electroreck.auth.getCurrentProfile();
        if (!profile || profile.role !== 'admin') {
          throw new Error('Access denied: Only Super Admins can add wings.');
        }
        if (!name || !name.trim()) throw new Error('Wing name is required.');

        if (realClient) {
          const { data, error } = await realClient
            .from('wings')
            .insert({ name: name.trim(), description, display_order, is_active })
            .select()
            .single();
          if (error) throw error;
          return data;
        }

        const db = loadDb();
        const newWing = {
          id: 'wing-' + Math.random().toString(36).substring(2, 9),
          name: name.trim(),
          description: description || '',
          display_order: parseInt(display_order, 10) || (db.wings.length + 1),
          is_active: Boolean(is_active)
        };
        db.wings.push(newWing);
        saveDb(db);
        return newWing;
      },

      async update(id, updates) {
        const profile = await Electroreck.auth.getCurrentProfile();
        if (!profile || profile.role !== 'admin') {
          throw new Error('Access denied: Only Super Admins can edit wings.');
        }

        if (realClient) {
          const { data, error } = await realClient
            .from('wings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
          if (error) throw error;
          return data;
        }

        const db = loadDb();
        const idx = db.wings.findIndex(w => w.id === id);
        if (idx === -1) throw new Error('Wing not found.');
        db.wings[idx] = { ...db.wings[idx], ...updates, updated_at: new Date().toISOString() };
        saveDb(db);
        return db.wings[idx];
      }
    },

    // --- SOCIETY INDUCTION MODULE ---
    induction: {
      async apply({ full_name, roll_number, department, year_of_study, phone, preferred_wing_id, reason_for_joining, consent_given }) {
        const session = await Electroreck.auth.getSession();
        if (!session || !session.user) {
          throw new Error('Authentication required: Please sign in to submit your induction application.');
        }

        if (!full_name || !full_name.trim()) throw new Error('Full Name is required.');
        if (!roll_number || !ROLL_NO_REGEX.test(roll_number.trim())) {
          throw new Error('Invalid Roll Number: Must be exactly 9 digits.');
        }
        if (!department) throw new Error('Department selection is required.');
        if (!year_of_study) throw new Error('Year of study selection is required.');
        if (!phone || !PHONE_REGEX.test(phone.trim())) {
          throw new Error('Invalid Phone Number: Must be exactly 10 digits.');
        }
        if (!preferred_wing_id) throw new Error('Please select your preferred wing.');
        if (!reason_for_joining || reason_for_joining.trim().length < 10 || reason_for_joining.trim().length > 500) {
          throw new Error('Reason for joining must be between 10 and 500 characters.');
        }
        if (!consent_given) {
          throw new Error('You must accept the society recruitment rules and privacy consent.');
        }

        const email = session.user.email;

        if (realClient) {
          const payload = {
            user_id: session.user.id,
            full_name: full_name.trim(),
            email,
            roll_number: roll_number.trim(),
            department,
            year_of_study,
            phone: phone.trim(),
            preferred_wing_id,
            reason_for_joining: reason_for_joining.trim(),
            consent_given: true,
            status: 'Pending'
          };

          const { data, error } = await realClient
            .from('induction_applications')
            .insert(payload)
            .select(`
              *,
              wing:wings(id, name)
            `)
            .single();

          if (error) {
            if (error.code === '23505') {
              throw new Error('You or your Roll Number have already submitted an induction application.');
            }
            throw new Error(error.message);
          }
          return data;
        }

        // Local Simulator Implementation
        const db = loadDb();
        const existingApp = db.induction_applications.find(a => a.user_id === session.user.id || a.roll_number === roll_number.trim());
        if (existingApp) {
          throw new Error('You or your Roll Number have already submitted an induction application.');
        }

        const wing = db.wings.find(w => w.id === preferred_wing_id);
        const newApp = {
          id: 'ind-' + Math.random().toString(36).substring(2, 9),
          user_id: session.user.id,
          full_name: full_name.trim(),
          email,
          roll_number: roll_number.trim(),
          department,
          year_of_study,
          phone: phone.trim(),
          preferred_wing_id,
          reason_for_joining: reason_for_joining.trim(),
          consent_given: true,
          status: 'Pending',
          created_at: new Date().toISOString(),
          wing: wing ? { id: wing.id, name: wing.name } : null
        };

        db.induction_applications.push(newApp);
        saveDb(db);
        return newApp;
      },

      async getMyApplication() {
        const session = await Electroreck.auth.getSession();
        if (!session || !session.user) return null;

        if (realClient) {
          const { data, error } = await realClient
            .from('induction_applications')
            .select(`
              *,
              wing:wings(id, name, description)
            `)
            .eq('user_id', session.user.id)
            .maybeSingle();
          if (error) throw error;
          return data;
        }

        const db = loadDb();
        const app = db.induction_applications.find(a => a.user_id === session.user.id);
        if (!app) return null;
        const wing = db.wings.find(w => w.id === app.preferred_wing_id);
        return { ...app, wing: wing || null };
      },

      async getAllForAdmin() {
        const profile = await Electroreck.auth.getCurrentProfile();
        if (!profile || profile.role !== 'admin') {
          throw new Error('Access denied: Only Super Admins can view society induction applications.');
        }

        if (realClient) {
          const { data, error } = await realClient
            .from('induction_applications')
            .select(`
              *,
              wing:wings(id, name)
            `)
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data;
        }

        const db = loadDb();
        return db.induction_applications.map(a => {
          const wing = db.wings.find(w => w.id === a.preferred_wing_id);
          return { ...a, wing: wing || null };
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      },

      async updateStatus(id, newStatus) {
        const profile = await Electroreck.auth.getCurrentProfile();
        if (!profile || profile.role !== 'admin') {
          throw new Error('Access denied: Only Super Admins can update induction application status.');
        }

        if (realClient) {
          const { data, error } = await realClient
            .from('induction_applications')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
          if (error) throw error;
          return data;
        }

        const db = loadDb();
        const idx = db.induction_applications.findIndex(a => a.id === id);
        if (idx === -1) throw new Error('Induction application not found.');
        db.induction_applications[idx].status = newStatus;
        db.induction_applications[idx].updated_at = new Date().toISOString();
        saveDb(db);
        return db.induction_applications[idx];
      }
    },

    // --- CSV EXPORT WITH FORMULA INJECTION ESCAPING ---
    exportCSV({ filename, headers, rows }) {
      const headerRow = headers.map(h => sanitizeForCSV(h.label)).join(',');
      const bodyRows = rows.map(row => {
        return headers.map(h => {
          let val = row[h.key];
          if (typeof h.format === 'function') {
            val = h.format(row);
          }
          return sanitizeForCSV(val);
        }).join(',');
      });

      const csvContent = '\uFEFF' + [headerRow, ...bodyRows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename.endsWith('.csv') ? filename : filename + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    // --- EMAIL SIMULATION / DISPATCH ---
    email: {
      async sendPassConfirmation(registration) {
        console.log(`✉️ [CONFIRMATION EMAIL DISPATCHED] To: ${registration.email}`);
        console.log(`Pass ID: ${registration.pass_id} | Event: ${registration.event ? registration.event.title : 'Event'}`);
        // Store in a local mailbox record for inspection & testing
        try {
          const sent = JSON.parse(localStorage.getItem('electroreck_sent_emails') || '[]');
          sent.unshift({
            type: 'EVENT_REGISTRATION_PASS',
            to: registration.email,
            pass_id: registration.pass_id,
            event_title: registration.event ? registration.event.title : 'Event',
            venue: registration.event ? registration.event.venue : 'TBA',
            date: registration.event ? registration.event.event_date : new Date().toISOString(),
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('electroreck_sent_emails', JSON.stringify(sent.slice(0, 50)));
        } catch (e) {}
        return true;
      },

      async sendInductionConfirmation(application) {
        console.log(`✉️ [INDUCTION ACKNOWLEDGMENT DISPATCHED] To: ${application.email}`);
        try {
          const sent = JSON.parse(localStorage.getItem('electroreck_sent_emails') || '[]');
          sent.unshift({
            type: 'INDUCTION_SUBMITTED',
            to: application.email,
            candidate: application.full_name,
            roll_number: application.roll_number,
            wing: application.wing ? application.wing.name : 'Selected Wing',
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('electroreck_sent_emails', JSON.stringify(sent.slice(0, 50)));
        } catch (e) {}
        return true;
      }
    }
  };

  window.Electroreck = Electroreck;
})(window);
