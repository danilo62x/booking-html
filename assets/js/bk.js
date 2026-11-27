/* ===== Booking store — mirrors React useBkStore + useBookingStore =====
   Services / professionals / clients / appointments with CRUD (persist key "bk-data").
   Wizard state persisted separately under "bk-booking". */
(function (global) {
  const STORAGE_KEY = 'bk-data';
  const BOOKING_KEY = 'bk-booking';

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function slugify(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  let state = {
    services: clone(Data.SERVICES),
    professionals: clone(Data.PROFESSIONALS),
    appointments: clone(Data.APPOINTMENTS),
    clients: clone(Data.CLIENTS),
  };

  const listeners = new Set();
  let seq = 5000;
  const nextId = () => ++seq;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        state = {
          services: p.services || state.services,
          professionals: p.professionals || state.professionals,
          appointments: p.appointments || state.appointments,
          clients: p.clients || state.clients,
        };
        const ids = []
          .concat(state.services.map((x) => x.id))
          .concat(state.professionals.map((x) => x.id))
          .concat(state.appointments.map((x) => x.id))
          .concat(state.clients.map((x) => x.id));
        const maxId = Math.max(0, ...ids);
        if (maxId >= seq) seq = maxId + 1;
      }
    } catch (_) {}
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function emit() {
    persist();
    listeners.forEach((cb) => cb(state));
  }

  function get() {
    return state;
  }
  function subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  // ---- Services ----
  function addService(s) {
    const id = nextId();
    const service = { ...s, id, slug: `${slugify(s.name)}-${id}`, photo: s.photo || Data.serviceImage(`${id}`) };
    state.services = [service, ...state.services];
    emit();
    return service;
  }
  function updateService(id, patch) {
    state.services = state.services.map((s) => (s.id === id ? { ...s, ...patch } : s));
    emit();
  }
  function toggleServiceActive(id) {
    state.services = state.services.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    emit();
  }
  function removeService(id) {
    state.services = state.services.filter((s) => s.id !== id);
    emit();
  }

  // ---- Professionals ----
  function addProfessional(p) {
    const id = nextId();
    const pro = { ...p, id, slug: `${slugify(p.name)}-${id}` };
    state.professionals = [pro, ...state.professionals];
    emit();
    return pro;
  }
  function updateProfessional(id, patch) {
    state.professionals = state.professionals.map((p) => (p.id === id ? { ...p, ...patch } : p));
    emit();
  }
  function toggleProfessionalActive(id) {
    state.professionals = state.professionals.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
    emit();
  }

  // ---- Clients ----
  function addClient(c) {
    const id = nextId();
    const client = { ...c, id, avatar: c.avatar || `https://images.unsplash.com/photo-${'1500648767791-00dcc994a43e,1494790108377-be9c29b29330,1507003211169-0a1dd7228f2d,1438761681033-6461ffad8d80,1633332755192-727a05c4013d,1573496359142-b8d87734a5a2'.split(',')[id % 6]}?w=120&h=120&fit=crop&q=70&auto=format`, since: new Date().toISOString().slice(0, 10) };
    state.clients = [client, ...state.clients];
    emit();
    return client;
  }

  // ---- Appointments ----
  function createAppointment(a) {
    const id = nextId();
    const appointment = { ...a, id };
    state.appointments = [appointment, ...state.appointments];
    emit();
    return appointment;
  }
  function updateAppointment(id, patch) {
    state.appointments = state.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a));
    emit();
  }
  function setStatus(id, status) {
    state.appointments = state.appointments.map((a) => (a.id === id ? { ...a, status } : a));
    emit();
  }
  function removeAppointment(id) {
    state.appointments = state.appointments.filter((a) => a.id !== id);
    emit();
  }

  function reset() {
    state = {
      services: clone(Data.SERVICES),
      professionals: clone(Data.PROFESSIONALS),
      appointments: clone(Data.APPOINTMENTS),
      clients: clone(Data.CLIENTS),
    };
    emit();
  }

  load();

  // ---- Booking wizard state (separate store, key "bk-booking") ----
  const EMPTY_CONTACT = { name: '', email: '', phone: '', notes: '' };
  let booking = { step: 0, serviceId: null, professionalId: null, date: null, time: null, contact: { ...EMPTY_CONTACT } };
  const bookingListeners = new Set();
  try {
    const raw = localStorage.getItem(BOOKING_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      booking = {
        step: p.step || 0,
        serviceId: p.serviceId != null ? p.serviceId : null,
        professionalId: p.professionalId != null ? p.professionalId : null,
        date: p.date || null,
        time: p.time || null,
        contact: { ...EMPTY_CONTACT, ...(p.contact || {}) },
      };
    }
  } catch (_) {}

  function bookingPersist() {
    try {
      localStorage.setItem(BOOKING_KEY, JSON.stringify(booking));
    } catch (_) {}
  }
  function bookingEmit() {
    bookingPersist();
    bookingListeners.forEach((cb) => cb(booking));
  }
  function subscribeBooking(cb) {
    bookingListeners.add(cb);
    return () => bookingListeners.delete(cb);
  }
  const Booking = {
    get: () => booking,
    subscribe: subscribeBooking,
    setStep(step) { booking = { ...booking, step }; bookingEmit(); },
    next() { booking = { ...booking, step: Math.min(booking.step + 1, 4) }; bookingEmit(); },
    back() { booking = { ...booking, step: Math.max(booking.step - 1, 0) }; bookingEmit(); },
    setService(id) {
      const changed = booking.serviceId !== id;
      booking = { ...booking, serviceId: id, ...(changed ? { professionalId: null, time: null } : {}) };
      bookingEmit();
    },
    setProfessional(id) { booking = { ...booking, professionalId: id, time: null }; bookingEmit(); },
    setDate(date) { booking = { ...booking, date, time: null }; bookingEmit(); },
    setTime(time) { booking = { ...booking, time }; bookingEmit(); },
    setContact(patch) { booking = { ...booking, contact: { ...booking.contact, ...patch } }; bookingEmit(); },
    reset() {
      booking = { step: 0, serviceId: null, professionalId: null, date: null, time: null, contact: { ...EMPTY_CONTACT } };
      bookingEmit();
    },
  };

  global.Bk = {
    get,
    subscribe,
    addService,
    updateService,
    toggleServiceActive,
    removeService,
    addProfessional,
    updateProfessional,
    toggleProfessionalActive,
    addClient,
    createAppointment,
    updateAppointment,
    setStatus,
    removeAppointment,
    reset,
    Booking,
  };
})(window);
