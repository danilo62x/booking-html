/* ===== Query helpers — lookups, slot generation, appointment queries, metrics =====
   Ports React src/data/query.ts. */
(function (global) {
  const CATEGORIES = ['cabelo', 'barba', 'estetica', 'unhas', 'massagem', 'saude'];

  // ---- Lookups ----
  function serviceById(list, id) {
    return list.find((s) => s.id === id);
  }
  function serviceBySlug(list, slug) {
    return list.find((s) => s.slug === slug);
  }
  function professionalById(list, id) {
    return list.find((p) => p.id === id);
  }
  function clientById(list, id) {
    return list.find((c) => c.id === id);
  }
  /** Professionals that can perform a given service (and are active). */
  function professionalsForService(pros, serviceId) {
    return pros.filter((p) => p.active && p.serviceIds.includes(serviceId));
  }

  // ---- Service search ----
  function searchServices(list, query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }

  // ---- Date helpers ----
  function ymd(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function dateFromYmd(key) {
    const parts = key.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  function isToday(iso) {
    return ymd(new Date(iso)) === ymd(new Date());
  }
  function minutesToLabel(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // ---- Slot generation ----
  // Returns [{ label, start, available }]. A slot is available when the service
  // fits in the work window and doesn't overlap a non-cancelled booking.
  function generateSlots(professional, service, dayKey, appointments, step) {
    step = step || 30;
    const date = dateFromYmd(dayKey);
    const weekday = date.getDay();
    const window = professional.schedule[weekday];
    if (!window) return [];

    const open = window[0] * 60;
    const close = window[1] * 60;

    const busy = appointments
      .filter((a) => a.professionalId === professional.id && a.status !== 'cancelado' && ymd(new Date(a.datetime)) === dayKey)
      .map((a) => {
        const d = new Date(a.datetime);
        const s = d.getHours() * 60 + d.getMinutes();
        return [s, s + a.duration];
      });

    const now = new Date();
    const isTodayKey = dayKey === ymd(now);
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const slots = [];
    for (let t = open; t + service.duration <= close; t += step) {
      const overlaps = busy.some((b) => t < b[1] && t + service.duration > b[0]);
      const past = isTodayKey && t <= nowMins;
      slots.push({ label: minutesToLabel(t), start: t, available: !overlaps && !past });
    }
    return slots;
  }

  /** Count of available slots — handy for calendar day indicators. */
  function availableSlotCount(professional, service, dayKey, appointments) {
    return generateSlots(professional, service, dayKey, appointments).filter((s) => s.available).length;
  }

  // ---- Appointment queries ----
  function appointmentsForDay(list, dayKey) {
    return list
      .filter((a) => ymd(new Date(a.datetime)) === dayKey)
      .sort((a, b) => +new Date(a.datetime) - +new Date(b.datetime));
  }
  function appointmentsForClient(list, clientId) {
    return list
      .filter((a) => a.clientId === clientId)
      .sort((a, b) => +new Date(b.datetime) - +new Date(a.datetime));
  }
  function upcomingAppointments(list, limit) {
    const now = Date.now();
    const out = list
      .filter((a) => +new Date(a.datetime) >= now && a.status !== 'cancelado')
      .sort((a, b) => +new Date(a.datetime) - +new Date(b.datetime));
    return limit ? out.slice(0, limit) : out;
  }
  function pastAppointments(list) {
    const now = Date.now();
    return list
      .filter((a) => +new Date(a.datetime) < now || a.status === 'concluido' || a.status === 'cancelado')
      .sort((a, b) => +new Date(b.datetime) - +new Date(a.datetime));
  }

  // ---- Dashboard metrics ----
  function startOfWeek(d) {
    const out = new Date(d);
    const day = out.getDay();
    const diff = (day + 6) % 7; // Monday first
    out.setDate(out.getDate() - diff);
    out.setHours(0, 0, 0, 0);
    return out;
  }

  function computeMetrics(appointments, professionals) {
    const todayKey = ymd(new Date());
    const weekStart = startOfWeek(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const today = appointments.filter((a) => ymd(new Date(a.datetime)) === todayKey && a.status !== 'cancelado').length;

    const inWeek = appointments.filter((a) => {
      const t = +new Date(a.datetime);
      return t >= +weekStart && t < +weekEnd && a.status !== 'cancelado';
    });

    const revenue = inWeek
      .filter((a) => a.status === 'confirmado' || a.status === 'concluido')
      .reduce((s, a) => s + a.price, 0);

    const weekday = new Date().getDay();
    const totalMinutes = professionals
      .filter((p) => p.active)
      .reduce((sum, p) => {
        const w = p.schedule[weekday];
        return sum + (w ? (w[1] - w[0]) * 60 : 0);
      }, 0);
    const bookedMinutes = appointments
      .filter((a) => ymd(new Date(a.datetime)) === todayKey && a.status !== 'cancelado')
      .reduce((s, a) => s + a.duration, 0);
    const occupancy = totalMinutes > 0 ? Math.round((bookedMinutes / totalMinutes) * 100) : 0;

    return { today, week: inWeek.length, revenue, occupancy };
  }

  /** Counts of appointments grouped by service (top requested). */
  function countByService(appointments, services, limit) {
    limit = limit || 5;
    const counts = new Map();
    for (const a of appointments) {
      if (a.status === 'cancelado') continue;
      counts.set(a.serviceId, (counts.get(a.serviceId) || 0) + 1);
    }
    return [...counts.entries()]
      .map((e) => ({ service: serviceById(services, e[0]), count: e[1] }))
      .filter((x) => x.service)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  function countByStatus(appointments) {
    const out = { pendente: 0, confirmado: 0, concluido: 0, cancelado: 0 };
    for (const a of appointments) out[a.status]++;
    return out;
  }

  global.Query = {
    CATEGORIES,
    serviceById,
    serviceBySlug,
    professionalById,
    clientById,
    professionalsForService,
    searchServices,
    ymd,
    dateFromYmd,
    isToday,
    generateSlots,
    availableSlotCount,
    appointmentsForDay,
    appointmentsForClient,
    upcomingAppointments,
    pastAppointments,
    computeMetrics,
    countByService,
    countByStatus,
  };
})(window);
