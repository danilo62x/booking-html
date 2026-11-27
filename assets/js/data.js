/* ===== Mock data + format helpers — ports React src/data/mock.ts + lib/format.ts =====
   i18n keys render translated labels; raw values (service names, prices, names) live here. */
(function (global) {
  // Curated Unsplash sets — beauty/spa/salon theme (IDs verificados).
  const IMG = {
    beauty: ['1521590832167-7bcbfaa6381f','1562322140-8baeececf3df','1503951914875-452162b0f3f1','1604654894610-df63bc536371','1522337360788-8b13dee7a37e','1596755389378-c31d21fd1273','1470259078422-826894b933aa','1600948836101-f9ffda59d250','1516975080664-ed2fc6a32937','1571290274554-6a2eaa771e5f','1522338242992-e1a54906a8da','1633681926022-84c23e8cb2d6'],
    people: ['1500648767791-00dcc994a43e','1494790108377-be9c29b29330','1507003211169-0a1dd7228f2d','1438761681033-6461ffad8d80','1633332755192-727a05c4013d','1573496359142-b8d87734a5a2'],
    city: ['1477959858617-67f85cf4f1df','1496568816309-51d7c20e3b21','1480714378408-67cf0d13bc1b'],
  };
  function imgHash(s) { s = String(s); var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function imgCategory(seed) {
    var s = String(seed).toLowerCase();
    if (/agent|client|user|person|team|member|author|testi|review|avatar|profile|staff|pro-|cli-/.test(s)) return 'people';
    if (/hero|city|skyline|neighbor|hood|bairro|location|map/.test(s)) return 'city';
    return 'beauty';
  }
  function unsplash(id, w, h) {
    return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=70&auto=format`;
  }
  /** Deterministic image URL for a service card (Unsplash, beauty theme). */
  function serviceImage(seed, w, h) {
    w = w || 800;
    h = h || 600;
    var ids = IMG[imgCategory(seed)];
    return unsplash(ids[imgHash('svc-' + seed) % ids.length], w, h);
  }
  // Generic photo helper (used by layout chrome for hero/info imagery).
  function photoUrl(seed, i, w, h) {
    w = w || 800;
    h = h || 600;
    var ids = IMG[imgCategory(seed)];
    return unsplash(ids[imgHash(seed + '-' + (i || 0)) % ids.length], w, h);
  }

  const av = (seed) => unsplash(IMG.people[imgHash(String(seed)) % IMG.people.length], 120, 120);

  // Weekly work schedules: weekday(0=Sun..6=Sat) -> [startHour, endHour] or null.
  const FULL = { 0: null, 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 19], 5: [9, 19], 6: [9, 14] };
  const MORNINGS = { 0: null, 1: [8, 13], 2: [8, 13], 3: [8, 13], 4: [8, 13], 5: [8, 13], 6: [8, 12] };
  const AFTERNOONS = { 0: null, 1: [13, 20], 2: [13, 20], 3: [13, 20], 4: [13, 20], 5: [13, 20], 6: null };

  const SERVICES = [
    { id: 1, slug: 'corte-feminino', name: 'Corte feminino', category: 'cabelo', duration: 60, price: 120, description: 'Corte personalizado com lavagem, finalização e dicas de manutenção.', photo: serviceImage('corte-fem'), active: true, professionalIds: [1, 3] },
    { id: 2, slug: 'corte-masculino', name: 'Corte masculino', category: 'cabelo', duration: 30, price: 60, description: 'Corte na tesoura ou máquina com acabamento e finalização.', photo: serviceImage('corte-masc'), active: true, professionalIds: [2, 1] },
    { id: 3, slug: 'coloracao', name: 'Coloração completa', category: 'cabelo', duration: 120, price: 280, description: 'Coloração profissional com produtos premium e tratamento pós-cor.', photo: serviceImage('coloracao'), active: true, professionalIds: [3] },
    { id: 4, slug: 'barba', name: 'Barba terapia', category: 'barba', duration: 30, price: 50, description: 'Modelagem de barba com toalha quente, óleos e finalização.', photo: serviceImage('barba'), active: true, professionalIds: [2] },
    { id: 5, slug: 'limpeza-pele', name: 'Limpeza de pele', category: 'estetica', duration: 75, price: 180, description: 'Limpeza profunda com esfoliação, extração e máscara calmante.', photo: serviceImage('limpeza'), active: true, professionalIds: [4, 5] },
    { id: 6, slug: 'design-sobrancelha', name: 'Design de sobrancelha', category: 'estetica', duration: 30, price: 70, description: 'Design com mapeamento facial, henna opcional e finalização.', photo: serviceImage('sobrancelha'), active: true, professionalIds: [4] },
    { id: 7, slug: 'manicure', name: 'Manicure & esmaltação', category: 'unhas', duration: 45, price: 65, description: 'Cuidado completo das unhas com esmaltação tradicional ou em gel.', photo: serviceImage('manicure'), active: true, professionalIds: [5] },
    { id: 8, slug: 'pedicure', name: 'Pedicure spa', category: 'unhas', duration: 60, price: 85, description: 'Pedicure relaxante com escalda-pés, esfoliação e hidratação.', photo: serviceImage('pedicure'), active: true, professionalIds: [5] },
    { id: 9, slug: 'massagem-relaxante', name: 'Massagem relaxante', category: 'massagem', duration: 60, price: 200, description: 'Massagem corporal com óleos essenciais para alívio de tensões.', photo: serviceImage('massagem'), active: true, professionalIds: [6] },
    { id: 10, slug: 'avaliacao-nutricional', name: 'Avaliação nutricional', category: 'saude', duration: 50, price: 220, description: 'Consulta com avaliação corporal e plano alimentar personalizado.', photo: serviceImage('nutri'), active: false, professionalIds: [6] },
  ];

  const PROFESSIONALS = [
    { id: 1, slug: 'ana-paula', name: 'Ana Paula Ferraz', avatar: av('pro-ana'), specialty: 'hairstylist', bio: 'Cabeleireira com 12 anos de experiência em cortes e penteados.', rating: 4.9, serviceIds: [1, 2], schedule: FULL, active: true },
    { id: 2, slug: 'bruno-cardoso', name: 'Bruno Cardoso', avatar: av('pro-bruno'), specialty: 'barber', bio: 'Barbeiro especialista em cortes masculinos e barboterapia.', rating: 4.8, serviceIds: [2, 4], schedule: AFTERNOONS, active: true },
    { id: 3, slug: 'carla-nunes', name: 'Carla Nunes', avatar: av('pro-carla'), specialty: 'colorist', bio: 'Colorista certificada, referência em coloração e mechas.', rating: 5.0, serviceIds: [1, 3], schedule: FULL, active: true },
    { id: 4, slug: 'daniela-souza', name: 'Daniela Souza', avatar: av('pro-dani'), specialty: 'esthetician', bio: 'Esteticista focada em saúde da pele e design facial.', rating: 4.7, serviceIds: [5, 6], schedule: MORNINGS, active: true },
    { id: 5, slug: 'elaine-martins', name: 'Elaine Martins', avatar: av('pro-elaine'), specialty: 'manicurist', bio: 'Manicure e pedicure com técnicas de spa e nail art.', rating: 4.9, serviceIds: [5, 7, 8], schedule: FULL, active: true },
    { id: 6, slug: 'felipe-rocha', name: 'Felipe Rocha', avatar: av('pro-felipe'), specialty: 'therapist', bio: 'Massoterapeuta e nutricionista, atendimento integrado de bem-estar.', rating: 4.8, serviceIds: [9, 10], schedule: AFTERNOONS, active: true },
  ];

  const CLIENTS = [
    { id: 1, name: 'Juliana Reis', email: 'juliana@email.com', phone: '+55 11 98700-2001', avatar: av('cli-ju'), since: '2025-09-12', notes: 'Prefere atendimento pela manhã.' },
    { id: 2, name: 'Marcos Andrade', email: 'marcos@email.com', phone: '+55 11 98700-2002', avatar: av('cli-marcos'), since: '2025-11-03', notes: '' },
    { id: 3, name: 'Patrícia Lima', email: 'patricia@email.com', phone: '+55 11 98700-2003', avatar: av('cli-paty'), since: '2026-01-20', notes: 'Alergia a esmaltes com formol.' },
    { id: 4, name: 'Ricardo Gomes', email: 'ricardo@email.com', phone: '+55 11 98700-2004', avatar: av('cli-ricardo'), since: '2026-02-14', notes: '' },
    { id: 5, name: 'Sofia Albuquerque', email: 'sofia@email.com', phone: '+55 11 98700-2005', avatar: av('cli-sofia'), since: '2026-03-08', notes: 'Cliente fidelidade — desconto de 10%.' },
    { id: 6, name: 'Thiago Barros', email: 'thiago@email.com', phone: '+55 11 98700-2006', avatar: av('cli-thiago'), since: '2026-04-01', notes: '' },
    { id: 7, name: 'Vanessa Pires', email: 'vanessa@email.com', phone: '+55 11 98700-2007', avatar: av('cli-vanessa'), since: '2026-04-22', notes: '' },
  ];

  // Build appointments around "today" so dashboard and agenda always look live.
  function isoAt(dayOffset, hour, minute) {
    minute = minute || 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }

  const svc = (id) => SERVICES.find((s) => s.id === id);

  let seed = 0;
  function appt(dayOffset, hour, minute, serviceId, professionalId, clientId, status) {
    const s = svc(serviceId);
    return {
      id: 100 + seed++,
      serviceId, professionalId, clientId,
      datetime: isoAt(dayOffset, hour, minute),
      duration: s.duration,
      price: s.price,
      status,
      notes: '',
    };
  }

  const APPOINTMENTS = [
    // Today
    appt(0, 9, 0, 1, 1, 1, 'confirmado'),
    appt(0, 10, 30, 2, 2, 2, 'confirmado'),
    appt(0, 11, 0, 7, 5, 3, 'pendente'),
    appt(0, 14, 0, 5, 4, 5, 'confirmado'),
    appt(0, 16, 0, 9, 6, 6, 'pendente'),
    // Tomorrow
    appt(1, 9, 30, 3, 3, 5, 'confirmado'),
    appt(1, 13, 0, 4, 2, 4, 'pendente'),
    appt(1, 15, 0, 6, 4, 7, 'confirmado'),
    // Later this week
    appt(2, 10, 0, 8, 5, 1, 'pendente'),
    appt(3, 11, 0, 1, 1, 3, 'confirmado'),
    appt(4, 14, 30, 9, 6, 2, 'confirmado'),
    // Past (completed / cancelled) for history
    appt(-1, 10, 0, 2, 2, 4, 'concluido'),
    appt(-2, 15, 0, 1, 3, 5, 'concluido'),
    appt(-3, 11, 0, 7, 5, 1, 'concluido'),
    appt(-5, 9, 0, 5, 4, 3, 'cancelado'),
    appt(-7, 16, 0, 9, 6, 6, 'concluido'),
  ];

  /** Revenue series for the dashboard chart (last 7 days, mock BRL). */
  const REVENUE_SERIES = {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    appointments: [8, 11, 9, 14, 16, 12, 4],
    revenue: [980, 1340, 1120, 1860, 2120, 1540, 460],
  };

  // ---- Format helpers (port of lib/format.ts) ----
  const LOCALE_MAP = {
    'pt-BR': { locale: 'pt-BR', currency: 'BRL' },
    en: { locale: 'en-US', currency: 'USD' },
    es: { locale: 'es-ES', currency: 'EUR' },
  };

  function cfgFor(lang) {
    return LOCALE_MAP[lang || 'pt-BR'] || LOCALE_MAP['pt-BR'];
  }

  function formatCurrency(value, lang) {
    const cfg = cfgFor(lang);
    return new Intl.NumberFormat(cfg.locale, { style: 'currency', currency: cfg.currency, maximumFractionDigits: 0 }).format(value);
  }
  function formatCompact(value, lang) {
    return new Intl.NumberFormat(cfgFor(lang).locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }
  function formatNumber(value, lang) {
    return new Intl.NumberFormat(cfgFor(lang).locale).format(value);
  }
  function formatDate(iso, lang) {
    return new Intl.DateTimeFormat(cfgFor(lang).locale, { dateStyle: 'medium' }).format(new Date(iso));
  }
  function formatDateTime(iso, lang) {
    return new Intl.DateTimeFormat(cfgFor(lang).locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  }
  function formatTime(iso, lang) {
    return new Intl.DateTimeFormat(cfgFor(lang).locale, { timeStyle: 'short' }).format(new Date(iso));
  }
  function fromNow(iso, lang) {
    const rtf = new Intl.RelativeTimeFormat(cfgFor(lang).locale, { numeric: 'auto' });
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diff / 60000);
    if (Math.abs(mins) < 60) return rtf.format(-mins, 'minute');
    const hours = Math.round(mins / 60);
    if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour');
    const days = Math.round(hours / 24);
    return rtf.format(-days, 'day');
  }

  global.Data = {
    serviceImage,
    photoUrl,
    SERVICES,
    PROFESSIONALS,
    CLIENTS,
    APPOINTMENTS,
    REVENUE_SERIES,
    formatCurrency,
    formatCompact,
    formatNumber,
    formatDate,
    formatDateTime,
    formatTime,
    fromNow,
  };
})(window);
