/* ===== Booking layout (three shells) + shared component library =====
   Renders a PUBLIC shell (navbar + footer), an APP shell (sidebar + topbar) for
   app-*.html, or a BLANK shell (auth / 404). Chooses by <body data-shell>.
   Exposes UI.* render helpers and wires theme/lang/menu handlers. Mirrors the
   React layouts (PublicNavbar/PublicFooter/AppSidebar/AppHeader) and bk components. */
(function (global) {
  const SHELL = (document.body.getAttribute('data-shell') || 'public').toLowerCase();

  function t(key, opts) {
    return global.I18n ? global.I18n.t(key, opts) : key;
  }
  function tArr(key) {
    return global.I18n ? global.I18n.tArr(key) : [];
  }
  function lang() {
    return global.I18n ? global.I18n.getLang() : 'pt-BR';
  }
  const fmt = (v) => Data.formatCurrency(v, lang());
  const fmtCompact = (v) => Data.formatCompact(v, lang());
  const fmtNumber = (v) => Data.formatNumber(v, lang());
  const fmtDate = (v) => Data.formatDate(v, lang());
  const fmtDateTime = (v) => Data.formatDateTime(v, lang());
  const fmtTime = (v) => Data.formatTime(v, lang());
  const fromNow = (v) => Data.fromNow(v, lang());

  const LANGS = global.I18n ? global.I18n.LANGUAGES : [{ code: 'pt-BR', flag: '🇧🇷', label: 'Português' }];

  // Load shared scripts once (pwa).
  (function loadScriptsOnce() {
    ['assets/js/pwa.js'].forEach((src) => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const sc = document.createElement('script');
        sc.src = src;
        document.head.appendChild(sc);
      }
    });
  })();

  // ============================================================
  // Shared render helpers
  // ============================================================
  function langMenu() {
    return LANGS.map(
      (l) =>
        `<button type="button" class="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
          l.code === lang() ? 'font-medium text-brand-600' : 'text-body'
        }" data-action="set-lang" data-lang="${l.code}"><span>${l.flag}</span> ${l.label}${
          l.code === lang() ? icon('check', { size: 14, className: 'ml-auto' }) : ''
        }</button>`
    ).join('');
  }

  function langDropdown(id) {
    return (
      `<div class="relative" id="${id}"><button type="button" data-action="toggle-lang" data-menu="#${id}-menu" aria-label="${t(
        'common.theme'
      )}" class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-base hover:bg-gray-50 dark:hover:bg-gray-800">${
        LANGS.find((l) => l.code === lang()).flag
      }</button><div id="${id}-menu" class="surface-card absolute right-0 mt-3 w-44 rounded-xl border py-1 shadow-theme-lg hidden z-50">${langMenu()}</div></div>`
    );
  }

  const AVATAR_SIZE = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-16 w-16 text-lg',
  };
  function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map((p) => (p[0] || '').toUpperCase()).join('');
  }
  // avatar(name, size) or avatar({ src, name, size })
  function avatar(a, size) {
    let src, name;
    if (a && typeof a === 'object') {
      src = a.src;
      name = a.name;
      size = a.size || size;
    } else {
      name = a;
    }
    const dims = AVATAR_SIZE[size] || AVATAR_SIZE.md;
    if (src) return `<img src="${src}" alt="${name || ''}" class="shrink-0 rounded-full object-cover ${dims}"/>`;
    return `<span class="flex shrink-0 items-center justify-center rounded-full bg-brand-500 font-bold text-white ${dims}">${initials(name)}</span>`;
  }

  const BADGE_COLORS = {
    success: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
    warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500',
    error: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  };
  const BADGE_SOLID = {
    brand: 'bg-brand-500 text-white',
    success: 'bg-success-500 text-white',
    warning: 'bg-warning-500 text-white',
    error: 'bg-error-500 text-white',
    gray: 'bg-gray-500 text-white',
  };
  const BADGE_DOT = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    brand: 'bg-brand-500',
    gray: 'bg-gray-400',
  };
  // badge(label, color, opts) — opts: { variant:'soft'|'solid', dot:bool }
  function badge(label, color, opts) {
    color = color || 'gray';
    opts = opts || {};
    if (opts.variant === 'solid') {
      return `<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_SOLID[color] || BADGE_SOLID.gray}">${label}</span>`;
    }
    const dot = opts.dot ? `<span class="h-1.5 w-1.5 rounded-full ${BADGE_DOT[color] || BADGE_DOT.gray}"></span>` : '';
    return `<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_COLORS[color] || BADGE_COLORS.gray}">${dot}${label}</span>`;
  }

  // ---- Appointment status pill ----
  const STATUS_COLOR = { pendente: 'warning', confirmado: 'brand', concluido: 'success', cancelado: 'error' };
  function statusPill(status) {
    return badge(t('appointmentStatuses.' + status), STATUS_COLOR[status] || 'gray', { dot: true });
  }

  const STATS_ACCENT = {
    brand: 'bg-brand-50 text-brand-500 dark:bg-brand-500/15',
    success: 'bg-success-50 text-success-600 dark:bg-success-500/15',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15',
    info: 'bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15',
  };
  // kpiCard(o) — o: { title, value, icon, accent, trend, trendValue }
  function kpiCard(o) {
    const trendUp = o.trend === 'up';
    const trendColor = trendUp ? 'text-success-600' : 'text-error-600';
    const trendIcon = trendUp ? 'trending-up' : 'trending-down';
    return (
      `<div class="surface-card rounded-2xl border p-5">` +
      `<div class="flex items-start justify-between">` +
      `<span class="flex h-11 w-11 items-center justify-center rounded-xl ${STATS_ACCENT[o.accent] || STATS_ACCENT.brand}">${icon(o.icon, { size: 22 })}</span>` +
      (o.trendValue
        ? `<span class="inline-flex items-center gap-1 text-xs font-medium ${trendColor}">${icon(trendIcon, { size: 14 })}${o.trendValue}</span>`
        : '') +
      `</div>` +
      `<p class="mt-4 text-sm text-muted">${o.title}</p>` +
      `<p class="mt-1 text-2xl font-bold text-heading">${o.value}</p>` +
      `</div>`
    );
  }

  function emptyState(o) {
    o = o || {};
    return (
      `<div class="surface-card flex flex-col items-center justify-center rounded-2xl border py-16 text-center">` +
      `<span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">${icon(o.icon || 'folder', { size: 28 })}</span>` +
      `<h3 class="mt-5 text-lg font-semibold text-heading">${o.title || ''}</h3>` +
      (o.description ? `<p class="mt-2 max-w-sm text-sm text-muted">${o.description}</p>` : '') +
      (o.action ? `<div class="mt-6">${o.action}</div>` : '') +
      `</div>`
    );
  }

  function breadcrumb(items) {
    const lis = items
      .map((item, i) => {
        const last = i === items.length - 1;
        const content =
          item.href && !last
            ? `<a href="${item.href}" class="text-muted transition hover:text-brand-600 dark:hover:text-brand-400">${item.label}</a>`
            : `<span ${last ? 'aria-current="page"' : ''} class="${last ? 'font-medium text-heading' : 'text-muted'}">${item.label}</span>`;
        const sep = !last ? icon('chevron-right', { size: 14, className: 'text-gray-400' }) : '';
        return `<li class="flex items-center gap-1.5">${content}${sep}</li>`;
      })
      .join('');
    return `<nav aria-label="Breadcrumb"><ol class="flex flex-wrap items-center gap-1.5 text-sm">${lis}</ol></nav>`;
  }

  function pageHeader(o) {
    return (
      `<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">` +
      `<div>` +
      (o.crumbs && o.crumbs.length ? `<div class="mb-2">${breadcrumb(o.crumbs)}</div>` : '') +
      `<h1 class="text-2xl font-bold text-heading">${o.title}</h1>` +
      (o.subtitle ? `<p class="mt-1 text-sm text-muted">${o.subtitle}</p>` : '') +
      `</div>` +
      (o.action ? `<div class="shrink-0">${o.action}</div>` : '') +
      `</div>`
    );
  }

  function switchToggle(checked, attrs) {
    return (
      `<button type="button" role="switch" aria-checked="${!!checked}" ${attrs || ''} class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'
      }"><span class="inline-block h-4 w-4 transform rounded-full bg-white shadow-theme-xs transition ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }"></span></button>`
    );
  }

  // ---- ServiceCard — mirrors React ServiceCard. opts: { bookHref } ----
  function serviceCard(s) {
    return (
      `<div class="surface-card group flex flex-col overflow-hidden rounded-2xl border transition hover:shadow-theme-md">` +
      `<div class="relative h-44 overflow-hidden"><img src="${s.photo}" alt="${s.name}" class="h-full w-full object-cover transition duration-300 group-hover:scale-105"/>` +
      `<div class="absolute left-3 top-3">${badge(t('categories.' + s.category), 'brand', { variant: 'solid' })}</div></div>` +
      `<div class="flex flex-1 flex-col p-5">` +
      `<h3 class="text-base font-semibold text-heading">${s.name}</h3>` +
      `<p class="mt-1 line-clamp-2 text-sm text-muted">${s.description}</p>` +
      `<div class="mt-4 flex items-center gap-4 text-sm text-muted"><span class="inline-flex items-center gap-1.5">${icon('clock', { size: 15 })} ${s.duration} ${t('common.minutes')}</span><span class="font-semibold text-brand-600 dark:text-brand-400">${fmt(s.price)}</span></div>` +
      `<div class="mt-5 flex-1"></div>` +
      `<a href="agendar.html?servico=${s.slug}" class="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 text-sm font-medium text-white transition hover:bg-brand-600">${icon('calendar', { size: 16 })} ${t('services.book')}</a>` +
      `</div></div>`
    );
  }

  // ---- ProfessionalCard — mirrors React ProfessionalCard ----
  // professionalCard(p) renders the public profile card; professionalSelect(p, selected)
  // renders the compact selectable card used by the wizard (with data-select-pro).
  function professionalCard(p) {
    return (
      `<div class="surface-card flex flex-col items-center rounded-2xl border p-6 text-center">` +
      avatar({ src: p.avatar, name: p.name, size: 'xl' }) +
      `<p class="mt-4 font-semibold text-heading">${p.name}</p>` +
      `<p class="text-sm text-muted">${t('specialties.' + p.specialty)}</p>` +
      `<div class="mt-2 flex items-center gap-1 text-sm text-warning-500">${icon('star', { size: 15 })}<span class="font-medium text-heading">${p.rating.toFixed(1)}</span></div>` +
      `<p class="mt-3 text-sm text-muted">${p.bio}</p>` +
      `</div>`
    );
  }
  function professionalSelect(p, selected) {
    return (
      `<button type="button" data-select-pro="${p.id}" class="surface-card flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:border-brand-300 ${
        selected ? 'border-brand-500 ring-1 ring-brand-500' : ''
      }">` +
      avatar({ src: p.avatar, name: p.name, size: 'lg' }) +
      `<div class="min-w-0"><p class="truncate font-semibold text-heading">${p.name}</p><p class="truncate text-sm text-muted">${t('specialties.' + p.specialty)}</p>` +
      `<div class="mt-1 flex items-center gap-1 text-sm text-warning-500">${icon('star', { size: 14 })}<span class="font-medium text-heading">${p.rating.toFixed(1)}</span></div></div>` +
      (selected ? `<span class="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">${icon('check', { size: 14, strokeWidth: 2.5 })}</span>` : '') +
      `</button>`
    );
  }

  // ---- StepIndicator — mirrors React StepIndicator. steps: i18n keys ----
  function stepIndicator(steps, current) {
    const lis = steps
      .map((labelKey, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = i < current;
        const circle = done
          ? 'border-brand-500 bg-brand-500 text-white'
          : active
            ? 'border-brand-500 text-brand-600 dark:text-brand-400'
            : 'border-themed text-muted';
        const label = active ? 'text-heading' : done ? 'text-body' : 'text-muted';
        return (
          `<li class="flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}">` +
          `<button type="button" ${clickable ? `data-goto-step="${i}"` : 'disabled'} class="flex items-center gap-2.5 ${clickable ? 'cursor-pointer' : 'cursor-default'}">` +
          `<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition ${circle}">${done ? icon('check', { size: 16, strokeWidth: 2.5 }) : i + 1}</span>` +
          `<span class="hidden text-sm font-medium sm:block ${label}">${t(labelKey)}</span></button>` +
          (i < steps.length - 1 ? `<span class="mx-3 h-px flex-1 ${done ? 'bg-brand-500' : 'bg-[color:var(--tx-border)]'}"></span>` : '') +
          `</li>`
        );
      })
      .join('');
    return `<ol class="flex w-full items-center">${lis}</ol>`;
  }

  // ---- CalendarGrid — custom month calendar. opts: { value, cursor(Date), minToday, dayBadge(key)->n } ----
  // Emits buttons with data-cal-day="YYYY-MM-DD" and nav data-cal-nav="-1|1".
  function calendarGrid(opts) {
    opts = opts || {};
    const value = opts.value || null;
    const cursor = opts.cursor || new Date();
    const minToday = !!opts.minToday;
    const dayBadge = opts.dayBadge;
    const weekdays = tArr('calendar.weekdays');
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = Query.ymd(new Date());
    const monthLabel = cursor.toLocaleDateString(lang(), { month: 'long', year: 'numeric' });

    const head = weekdays.map((w) => `<div class="py-1">${w}</div>`).join('');

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += '<div></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const key = Query.ymd(new Date(year, month, d));
      const isPast = minToday && key < todayKey;
      const active = value === key;
      const isToday = key === todayKey;
      const badgeN = dayBadge ? dayBadge(key) : undefined;
      const cls = active
        ? 'border-brand-500 bg-brand-500 text-white'
        : isPast
          ? 'cursor-not-allowed border-transparent text-gray-300 dark:text-gray-700'
          : `border-transparent hover:border-brand-300 ${isToday ? 'font-bold text-brand-600 dark:text-brand-400' : 'text-body'}`;
      cells +=
        `<button type="button" ${isPast ? 'disabled' : `data-cal-day="${key}"`} class="relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition ${cls}">` +
        `<span>${d}</span>` +
        (badgeN != null && badgeN > 0 ? `<span class="absolute bottom-1 h-1.5 w-1.5 rounded-full ${active ? 'bg-white' : 'bg-brand-500'}"></span>` : '') +
        `</button>`;
    }

    return (
      `<div data-calendar>` +
      `<div class="mb-3 flex items-center justify-between"><h4 class="text-sm font-semibold capitalize text-heading">${monthLabel}</h4>` +
      `<div class="flex gap-1"><button type="button" data-cal-nav="-1" aria-label="${t('calendar.prevMonth')}" class="flex h-8 w-8 items-center justify-center rounded-lg border border-themed text-body hover:bg-gray-50 dark:hover:bg-gray-800">${icon('chevron-left', { size: 16 })}</button>` +
      `<button type="button" data-cal-nav="1" aria-label="${t('calendar.nextMonth')}" class="flex h-8 w-8 items-center justify-center rounded-lg border border-themed text-body hover:bg-gray-50 dark:hover:bg-gray-800">${icon('chevron-right', { size: 16 })}</button></div></div>` +
      `<div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">${head}</div>` +
      `<div class="mt-1 grid grid-cols-7 gap-1">${cells}</div>` +
      `</div>`
    );
  }

  // ---- TimeSlotPicker — slots: [{label,start,available}]. Buttons emit data-slot ----
  function timeSlotPicker(slots, value) {
    if (!slots.length) return emptyState({ icon: 'clock', title: t('booking.noSlots'), description: t('booking.noSlotsDesc') });
    if (!slots.some((s) => s.available)) return emptyState({ icon: 'clock', title: t('booking.fullDay'), description: t('booking.fullDayDesc') });
    const cells = slots
      .map((slot) => {
        const active = value === slot.label;
        const cls = active
          ? 'border-brand-500 bg-brand-500 text-white'
          : slot.available
            ? 'border-themed text-body hover:border-brand-300 hover:text-brand-600'
            : 'cursor-not-allowed border-transparent text-gray-300 line-through dark:text-gray-700';
        return `<button type="button" ${slot.available ? `data-slot="${slot.label}"` : 'disabled'} class="h-10 rounded-lg border text-sm font-medium transition ${cls}">${slot.label}</button>`;
      })
      .join('');
    return `<div class="grid grid-cols-3 gap-2 sm:grid-cols-4">${cells}</div>`;
  }

  // ---- AppointmentCard — mirrors React AppointmentCard. o: { appointment, actions } ----
  function appointmentCard(o) {
    const a = o.appointment;
    const st = Bk.get();
    const service = Query.serviceById(st.services, a.serviceId);
    const pro = Query.professionalById(st.professionals, a.professionalId);
    const start = new Date(a.datetime);
    const monthShort = start.toLocaleDateString(lang(), { month: 'short' });
    return (
      `<div class="surface-card rounded-2xl border p-4"><div class="flex items-start gap-4">` +
      `<div class="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"><span class="text-[11px] font-medium uppercase">${monthShort}</span><span class="text-lg font-bold leading-none">${start.getDate()}</span></div>` +
      `<div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-2"><p class="font-semibold text-heading">${service ? service.name : ''}</p>${statusPill(a.status)}</div>` +
      `<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted"><span class="inline-flex items-center gap-1.5">${icon('clock', { size: 15 })} ${fmtDate(a.datetime)} · ${fmtTime(a.datetime)}</span></div>` +
      (pro ? `<div class="mt-3 flex items-center gap-2">${avatar({ src: pro.avatar, name: pro.name, size: 'xs' })}<span class="text-sm text-body">${pro.name}</span></div>` : '') +
      `</div></div>` +
      (o.actions ? `<div class="mt-4 flex flex-wrap gap-2 border-t border-themed pt-3">${o.actions}</div>` : '') +
      `</div>`
    );
  }

  // tabs(items, active) — items: [{ label, icon, content }]. Self-contained switcher.
  function tabs(items, active) {
    active = active || 0;
    const heads = items
      .map(
        (it, i) =>
          `<button type="button" data-tab="${i}" class="-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            i === active ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-muted hover:border-gray-300 hover:text-body dark:hover:border-gray-700'
          }">${it.icon ? icon(it.icon, { size: 16 }) : ''}${it.label}</button>`
      )
      .join('');
    return (
      `<div data-tabs><div class="flex gap-1 overflow-x-auto border-b border-themed no-scrollbar" role="tablist">${heads}</div>` +
      `<div data-tab-panel class="pt-5 text-sm text-body" role="tabpanel">${items[active] ? items[active].content : ''}</div></div>`
    );
  }

  // modal(id, opts) — opts: { title, body, footer, size }. Hidden by default.
  const MODAL_SIZE = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };
  function modal(id, opts) {
    opts = opts || {};
    return (
      `<div id="${id}" class="fixed inset-0 z-[80] hidden" data-modal>` +
      `<div class="absolute inset-0 bg-gray-900/50" data-modal-close></div>` +
      `<div class="relative flex min-h-full items-center justify-center p-4"><div class="surface-card w-full ${MODAL_SIZE[opts.size] || MODAL_SIZE.md} rounded-2xl border shadow-theme-xl">` +
      `<div class="flex items-center justify-between border-b border-themed px-6 py-4"><h2 class="text-lg font-semibold text-heading">${opts.title || ''}</h2><button type="button" data-modal-close class="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-heading" aria-label="${t('common.close')}">${icon('x', { size: 20 })}</button></div>` +
      `<div class="max-h-[75vh] overflow-y-auto px-6 py-5" data-modal-body>${opts.body || ''}</div>` +
      (opts.footer ? `<div class="flex justify-end gap-3 border-t border-themed px-6 py-4" data-modal-footer>${opts.footer}</div>` : '') +
      `</div></div></div>`
    );
  }
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }
  function closeModal(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (el) el.classList.add('hidden');
  }

  // drawer(id, opts) — right-side panel. opts: { title, body }
  function drawer(id, opts) {
    opts = opts || {};
    return (
      `<div id="${id}" class="fixed inset-0 z-[80] hidden" data-drawer>` +
      `<div class="absolute inset-0 bg-gray-900/50" data-drawer-close></div>` +
      `<aside class="surface-card absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l shadow-theme-xl">` +
      `<header class="flex items-center justify-between border-b border-themed px-5 py-4"><h3 class="text-base font-semibold text-heading">${opts.title || ''}</h3><button type="button" data-drawer-close class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="${t('common.close')}">${icon('x', { size: 20 })}</button></header>` +
      `<div class="flex-1 overflow-y-auto px-5 py-5" data-drawer-body>${opts.body || ''}</div>` +
      `</aside></div>`
    );
  }
  function openDrawer(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }
  function closeDrawer(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (el) el.classList.add('hidden');
  }

  // dataTable(opts) — opts: { id, columns:[{key,header,sortable,render}], rows, pageSize, searchable, searchKeys }
  const TABLES = {};
  function dataTable(opts) {
    const id = opts.id;
    TABLES[id] = { ...opts, page: 1, sortKey: null, sortDir: 'asc', search: '' };
    return `<div id="${id}" data-table></div>`;
  }
  function setTableRows(id, rows) {
    if (TABLES[id]) {
      TABLES[id].rows = rows;
      TABLES[id].page = 1;
      renderTable(id);
    }
  }
  function pagination(page, pages) {
    if (pages <= 1) return '';
    return (
      `<div class="flex items-center justify-between border-t border-themed px-5 py-3"><span class="text-xs text-muted">${page} / ${pages}</span><div class="flex gap-2"><button type="button" data-table-prev ${
        page <= 1 ? 'disabled' : ''
      } class="flex h-9 items-center gap-1 rounded-lg border border-themed px-3 text-sm text-body disabled:opacity-40">${icon('chevron-left', { size: 14 })}${t('common.previous')}</button><button type="button" data-table-next ${
        page >= pages ? 'disabled' : ''
      } class="flex h-9 items-center gap-1 rounded-lg border border-themed px-3 text-sm text-body disabled:opacity-40">${t('common.next')}${icon('chevron-right', { size: 14 })}</button></div></div>`
    );
  }
  function searchRows(list, query, keys) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) => keys.some((k) => {
      const v = k.split('.').reduce((o, kk) => (o == null ? o : o[kk]), row);
      return v != null && String(v).toLowerCase().includes(q);
    }));
  }
  function sortRows(list, key, dir) {
    if (!key) return list;
    const out = [...list];
    out.sort((a, b) => {
      const av = a[key], bv = b[key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return dir === 'desc' ? bv - av : av - bv;
      const cmp = String(av).localeCompare(String(bv));
      return dir === 'desc' ? -cmp : cmp;
    });
    return out;
  }
  function renderTable(id) {
    const cfg = TABLES[id];
    const wrap = document.getElementById(id);
    if (!cfg || !wrap) return;
    const pageSize = cfg.pageSize || 10;
    const searchable = cfg.searchable !== false;
    const searchKeys = cfg.searchKeys || cfg.columns.filter((c) => c.key).map((c) => c.key);

    let rows = cfg.rows;
    if (searchable) rows = searchRows(rows, cfg.search, searchKeys);
    rows = sortRows(rows, cfg.sortKey, cfg.sortDir);
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (cfg.page > pages) cfg.page = pages;
    const start = (cfg.page - 1) * pageSize;
    const view = rows.slice(start, start + pageSize);

    const head = cfg.columns
      .map((c) => {
        const sortable = c.sortable !== false && c.key;
        const arrow = sortable && cfg.sortKey === c.key ? icon(cfg.sortDir === 'asc' ? 'arrow-up' : 'arrow-down', { size: 12 }) : '';
        return `<th class="px-5 py-3.5 text-left font-medium text-muted ${sortable ? 'cursor-pointer select-none' : ''}" ${sortable ? `data-sort="${c.key}"` : ''}><span class="inline-flex items-center gap-1.5">${c.header}${arrow}</span></th>`;
      })
      .join('');

    const body = view.length
      ? view.map((row, i) => `<tr class="border-b border-themed last:border-0">` + cfg.columns.map((c) => `<td class="px-5 py-3.5 text-sm text-body">${c.render ? c.render(row, i) : row[c.key]}</td>`).join('') + `</tr>`).join('')
      : `<tr><td colspan="${cfg.columns.length}" class="px-5 py-12 text-center text-sm text-muted">${t('common.noResults')}</td></tr>`;

    wrap.innerHTML =
      (searchable
        ? `<div class="mb-4"><div class="relative max-w-xs"><span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">${icon('search', { size: 16 })}</span><input type="search" data-table-search value="${cfg.search}" placeholder="${t('common.search')}" class="h-10 w-full rounded-lg border border-themed bg-transparent pl-9 pr-3 text-sm text-body outline-none focus:border-brand-300 focus-ring"/></div></div>`
        : '') +
      `<div class="surface-card overflow-hidden rounded-2xl border"><div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-themed bg-gray-50/50 dark:bg-gray-900/30">${head}</tr></thead><tbody>${body}</tbody></table></div>${pagination(cfg.page, pages)}</div>`;
  }

  // ============================================================
  // Chrome: public navbar / footer
  // ============================================================
  const PUBLIC_LINKS = [
    { href: 'servicos.html', key: 'nav.services' },
    { href: 'meus-agendamentos.html', key: 'nav.myBookings' },
    { href: 'sobre.html', key: 'nav.about' },
    { href: 'contato.html', key: 'nav.contact' },
  ];

  function renderPublicNavbar() {
    const dark = UIState.get().darkMode;
    const isAuth = Auth.isAuthenticated();
    const links = PUBLIC_LINKS.map(
      (l) => `<a href="${l.href}" class="rounded-lg px-3 py-2 text-sm font-medium text-body transition hover:text-heading">${t(l.key)}</a>`
    ).join('');
    const mobileLinks = PUBLIC_LINKS.map(
      (l) => `<a href="${l.href}" class="rounded-lg px-3 py-2.5 text-sm font-medium text-body hover:bg-gray-50 dark:hover:bg-gray-800">${t(l.key)}</a>`
    ).join('');
    const account = isAuth
      ? `<a href="app.html" class="hidden h-10 items-center rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800 sm:flex">${t('nav.dashboard')}</a>`
      : `<a href="login.html" class="hidden h-10 items-center rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800 sm:flex">${t('nav.login')}</a>`;
    const mobileAccount = isAuth
      ? `<a href="app.html" class="flex h-11 items-center justify-center rounded-lg border border-themed text-sm font-medium text-body">${t('nav.dashboard')}</a>`
      : `<a href="login.html" class="flex h-11 items-center justify-center rounded-lg border border-themed text-sm font-medium text-body">${t('nav.login')}</a>`;

    return (
      `<div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">` +
      `<a href="index.html" class="flex items-center gap-2.5"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-theme-md">${icon('calendar', { size: 18 })}</span><span class="text-lg font-bold text-heading">${t('brand')}</span></a>` +
      `<nav class="ml-6 hidden items-center gap-1 lg:flex">${links}</nav>` +
      `<div class="ml-auto flex items-center gap-1 sm:gap-2">` +
      `<button type="button" data-action="toggle-dark" aria-label="${t('common.theme')}" class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-body transition hover:bg-gray-50 dark:hover:bg-gray-800">${icon(dark ? 'sun' : 'moon', { size: 18 })}</button>` +
      langDropdown('tx-lang') +
      `<a href="agendar.html" class="hidden h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 sm:flex">${icon('calendar', { size: 16 })} ${t('nav.book')}</a>` +
      account +
      `<button type="button" data-action="toggle-mobile-menu" class="flex h-10 w-10 items-center justify-center rounded-lg text-body lg:hidden" aria-label="Menu">${icon('menu', { size: 22 })}</button>` +
      `</div></div>` +
      `<div id="tx-mobile-menu" class="surface-card border-t border-themed lg:hidden hidden"><nav class="flex flex-col gap-1 px-4 py-4 sm:px-6">${mobileLinks}<div class="mt-2 flex flex-col gap-2 border-t border-themed pt-3"><a href="agendar.html" class="flex h-11 items-center justify-center rounded-lg bg-brand-500 text-sm font-medium text-white">${t('nav.book')}</a>${mobileAccount}</div></nav></div>`
    );
  }

  function renderPublicFooter() {
    const year = new Date().getFullYear();
    const col = (titleKey, links) =>
      `<div><h4 class="text-sm font-semibold text-heading">${t(titleKey)}</h4><ul class="mt-3 space-y-2 text-sm">${links
        .map((l) => `<li><a href="${l[1]}" class="text-muted transition hover:text-brand-600">${t(l[0])}</a></li>`)
        .join('')}</ul></div>`;
    const social = ['github', 'slack', 'globe']
      .map((ic) => `<a href="#" aria-label="${ic}" class="flex h-9 w-9 items-center justify-center rounded-full border border-themed text-muted transition hover:text-brand-500">${icon(ic, { size: 16 })}</a>`)
      .join('');
    return (
      `<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">` +
      `<div class="grid gap-8 lg:grid-cols-4">` +
      `<div class="max-w-sm"><a href="index.html" class="flex items-center gap-2.5"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">${icon('calendar', { size: 18 })}</span><span class="text-lg font-bold text-heading">${t('brand')}</span></a><p class="mt-4 text-sm text-muted">${t('footer.tagline')}</p></div>` +
      col('footer.explore', [['nav.services', 'servicos.html'], ['nav.book', 'agendar.html'], ['nav.myBookings', 'meus-agendamentos.html']]) +
      col('footer.company', [['nav.about', 'sobre.html'], ['nav.contact', 'contato.html'], ['nav.login', 'login.html']]) +
      col('footer.legal', [['footer.privacy', '#'], ['footer.terms', '#']]) +
      `</div>` +
      `<div class="mt-10 flex flex-col items-center justify-between gap-4 border-t border-themed pt-6 sm:flex-row"><p class="text-xs text-muted">© ${year} ${t('brand')}. ${t('footer.rights')}</p><div class="flex items-center gap-3">${social}</div></div>` +
      `</div>`
    );
  }

  // ============================================================
  // Chrome: app sidebar / topbar / footer
  // ============================================================
  const APP_SECTIONS = [
    {
      titleKey: 'appNav.main',
      items: [
        { href: 'app.html', labelKey: 'appNav.dashboard', icon: 'dashboard' },
        { href: 'app-agenda.html', labelKey: 'appNav.agenda', icon: 'calendar' },
      ],
    },
    {
      titleKey: 'appNav.manage',
      items: [
        { href: 'app-servicos.html', labelKey: 'appNav.services', icon: 'tag' },
        { href: 'app-profissionais.html', labelKey: 'appNav.professionals', icon: 'users' },
        { href: 'app-clientes.html', labelKey: 'appNav.clients', icon: 'user' },
      ],
    },
    { titleKey: 'appNav.account', items: [{ href: 'app-configuracoes.html', labelKey: 'appNav.settings', icon: 'settings' }] },
  ];

  function renderSidebar() {
    const collapsed = UIState.get().sidebarCollapsed;
    const here = window.location.pathname.split('/').pop() || 'app.html';
    const navCls = (active) =>
      `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${
        active ? 'is-sidebar-active' : 'is-sidebar-inactive'
      }`;

    const sections = APP_SECTIONS.map(
      (section) =>
        `<nav>${collapsed ? '' : `<h3 class="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider">${t(section.titleKey)}</h3>`}<ul class="flex flex-col gap-1">${section.items
          .map((item) => {
            const active = item.href === here;
            return `<li><a href="${item.href}" class="${navCls(active)}" ${collapsed ? `title="${t(item.labelKey)}"` : ''}>${icon(item.icon, { size: 20 })}${collapsed ? '' : `<span class="flex-1">${t(item.labelKey)}</span>`}</a></li>`;
          })
          .join('')}</ul></nav>`
    ).join('');

    return (
      `<div class="flex items-center pt-7 pb-6 ${collapsed ? 'justify-center' : 'justify-between'}">` +
      `<a href="app.html" class="flex items-center gap-2.5"><span class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-theme-sm">${icon('calendar', { size: 18 })}</span>${collapsed ? '' : `<span data-brand-text class="text-lg font-semibold">${t('brand')}</span>`}</a>` +
      (collapsed ? '' : `<button type="button" data-action="toggle-sidebar" class="is-sidebar-inactive hidden h-8 w-8 items-center justify-center rounded-lg border border-themed lg:flex" title="${t('appNav.collapse')}">${icon('chevron-right', { size: 14, className: 'rotate-180' })}</button>`) +
      `</div>` +
      `<div class="flex flex-col gap-5 overflow-y-auto no-scrollbar pb-4">${sections}</div>` +
      `<div class="mt-auto space-y-3 border-t border-themed py-4">` +
      (collapsed ? '' : `<div class="rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10"><p class="text-xs font-medium text-muted">${t('appNav.proTitle')}</p><p class="mt-0.5 text-sm font-semibold text-heading">${t('appNav.proDesc')}</p><a href="app-servicos.html" class="mt-3 flex h-9 w-full items-center justify-center rounded-lg bg-brand-500 text-xs font-medium text-white transition hover:bg-brand-600">${t('appNav.viewPlans')}</a></div>`) +
      `<button type="button" data-action="logout" class="${navCls(false)} w-full" ${collapsed ? `title="${t('appNav.logout')}"` : ''}>${icon('logout', { size: 20 })}${collapsed ? '' : `<span>${t('appNav.logout')}</span>`}</button>` +
      `</div>`
    );
  }

  const NOTIFICATIONS = [
    { id: 1, key: 'newBooking', name: 'Juliana Reis', time: 'Há 8 min', read: false },
    { id: 2, key: 'confirmed', name: 'Marcos Andrade', time: 'Há 41 min', read: false },
    { id: 3, key: 'reminder', name: 'Sofia Albuquerque', time: 'Há 1 hora', read: false },
  ];

  function renderTopbar() {
    const dark = UIState.get().darkMode;
    const user = Auth.getUser();
    const notifs = NOTIFICATIONS.map(
      (n) =>
        `<li class="flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"><span class="mt-1 flex h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-gray-300' : 'bg-brand-500'}"></span><div class="flex-1"><p class="text-sm font-medium text-heading">${t('notifications.' + n.key, { name: n.name })}</p><p class="text-xs text-muted">${n.time}</p></div></li>`
    ).join('');

    return (
      `<div class="flex flex-grow items-center justify-between gap-4 px-4 py-3 md:px-6 2xl:px-10">` +
      `<div class="flex items-center gap-3">` +
      `<button type="button" data-action="toggle-sidebar-responsive" class="flex h-10 w-10 items-center justify-center rounded-lg border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="Toggle sidebar">${icon('menu', { size: 20 })}</button>` +
      `<div class="hidden md:block"><div class="relative"><span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">${icon('search', { size: 18 })}</span><input type="text" placeholder="${t('appNav.searchPlaceholder')}" class="h-10 w-[260px] rounded-lg border border-themed bg-gray-50 pl-10 pr-12 text-sm text-body outline-none focus:border-brand-300 focus-ring dark:bg-gray-900 xl:w-[360px]"/><kbd class="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-themed bg-white px-1.5 py-0.5 text-xs text-muted dark:bg-gray-900">⌘ K</kbd></div></div>` +
      `</div>` +
      `<div class="flex items-center gap-2">` +
      `<a href="index.html" class="hidden h-10 items-center gap-2 rounded-lg border border-themed px-3 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800 sm:flex">${icon('globe', { size: 16 })} ${t('nav.home')}</a>` +
      langDropdown('tx-app-lang') +
      `<button type="button" data-action="toggle-dark" class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="${t('common.theme')}">${icon(dark ? 'sun' : 'moon', { size: 18 })}</button>` +
      `<div class="relative" id="tx-notif"><button type="button" data-action="toggle-menu" data-menu="#tx-notif-menu" class="relative flex h-10 w-10 items-center justify-center rounded-full border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="${t('appNav.notifications')}">${icon('bell', { size: 18 })}<span class="absolute top-1.5 right-1.5 flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-400 opacity-75"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-error-500"></span></span></button><div id="tx-notif-menu" class="surface-card absolute right-0 mt-3 w-80 rounded-xl border shadow-theme-lg hidden z-50"><div class="flex items-center justify-between border-b border-themed px-4 py-3"><p class="text-sm font-semibold text-heading">${t('appNav.notifications')}</p></div><ul class="max-h-72 divide-themed overflow-y-auto">${notifs}</ul></div></div>` +
      `<div class="relative" id="tx-profile"><button type="button" data-action="toggle-menu" data-menu="#tx-profile-menu" class="ml-1 flex items-center gap-3"><span class="hidden text-right lg:block"><span class="block text-sm font-medium text-heading">${(user && user.name) || 'Convidado'}</span><span class="block text-xs text-muted">${(user && user.role) || '—'}</span></span>${avatar((user && user.name) || '?', 'md')}${icon('chevron-down', { size: 16, className: 'text-muted' })}</button><div id="tx-profile-menu" class="surface-card absolute right-0 mt-3 w-56 rounded-xl border shadow-theme-lg hidden z-50"><div class="border-b border-themed px-4 py-3"><p class="text-sm font-medium text-heading">${(user && user.name) || 'Convidado'}</p><p class="text-xs text-muted">${(user && user.email) || ''}</p></div><ul class="py-1"><li><a href="app-configuracoes.html" class="flex items-center gap-2 px-4 py-2 text-sm text-body hover:bg-gray-50 dark:hover:bg-gray-800">${icon('settings', { size: 16 })} ${t('appNav.settings')}</a></li></ul><div class="border-t border-themed py-1"><button type="button" data-action="logout" class="flex w-full items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10">${icon('logout', { size: 16 })} ${t('appNav.logout')}</button></div></div></div>` +
      `</div></div>`
    );
  }

  function renderAppFooter() {
    const year = new Date().getFullYear();
    return `<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center"><p class="text-xs text-muted">© ${year} ${t('brand')}. ${t('footer.rights')}</p><div class="flex items-center gap-4 text-xs text-muted"><a href="sobre.html" class="hover:text-brand-500">${t('nav.about')}</a><a href="contato.html" class="hover:text-brand-500">${t('nav.contact')}</a></div></div>`;
  }

  // ============================================================
  // Cookie banner + toasts
  // ============================================================
  function renderCookieBanner() {
    const ui = UIState.get();
    if (ui.cookiesAccepted && !ui.showCookieBanner) return '';
    if (!ui.showCookieBanner && ui.cookiesAccepted) return '';
    return (
      `<div class="surface-card fixed bottom-4 left-1/2 z-[90] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border p-5 shadow-theme-xl">` +
      `<div class="flex gap-3"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">${icon('cookie', { size: 20 })}</span>` +
      `<div class="flex-1"><p class="text-sm font-semibold text-heading">${t('cookie.title')}</p><p class="mt-1 text-xs text-muted">${t('cookie.desc')} <a href="#" class="text-brand-500 hover:underline">${t('cookie.policy')}</a></p>` +
      `<div class="mt-3 flex gap-2"><button type="button" data-action="accept-cookies" class="h-9 rounded-lg bg-brand-500 px-4 text-xs font-medium text-white hover:bg-brand-600">${t('cookie.accept')}</button><button type="button" data-action="decline-cookies" class="h-9 rounded-lg border border-themed px-4 text-xs font-medium text-body hover:bg-gray-50 dark:hover:bg-gray-800">${t('cookie.decline')}</button></div></div></div></div>`
    );
  }
  function updateCookieBanner() {
    const el = document.getElementById('tx-cookie');
    if (el) el.innerHTML = renderCookieBanner();
  }

  const TOAST_STYLES = {
    success: { border: 'border-success-200 dark:border-success-500/30', icon: 'check-circle', color: 'text-success-500' },
    error: { border: 'border-error-200 dark:border-error-500/30', icon: 'x', color: 'text-error-500' },
    warning: { border: 'border-warning-200 dark:border-warning-500/30', icon: 'bell', color: 'text-warning-500' },
    info: { border: 'border-blue-light-200 dark:border-blue-light-500/30', icon: 'bell', color: 'text-blue-light-500' },
  };
  function notify(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;
    const s = TOAST_STYLES[type] || TOAST_STYLES.info;
    const stack = document.getElementById('tx-toast-stack');
    if (!stack) {
      console.log('[notify]', message);
      return;
    }
    const el = document.createElement('div');
    el.className = 'pointer-events-auto flex w-80 items-start gap-3 rounded-lg border bg-white p-4 shadow-theme-md dark:bg-gray-dark ' + s.border;
    el.innerHTML =
      '<span class="' + s.color + '">' + icon(s.icon, { size: 20 }) + '</span>' +
      '<div class="flex-1"><p class="text-sm font-medium text-heading">' + message + '</p></div>' +
      '<button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">' + icon('x', { size: 16 }) + '</button>';
    el.querySelector('button').addEventListener('click', () => el.remove());
    stack.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  // ============================================================
  // DOM update helpers
  // ============================================================
  function updateNavbar() {
    const el = document.getElementById('tx-navbar');
    if (el) el.innerHTML = renderPublicNavbar();
  }
  function updateFooter() {
    const el = document.getElementById('tx-footer');
    if (el) el.innerHTML = renderPublicFooter();
  }
  function updateSidebar() {
    const el = document.getElementById('tx-sidebar');
    if (!el) return;
    el.style.width = UIState.get().sidebarCollapsed ? '90px' : '280px';
    el.innerHTML = renderSidebar();
  }
  function updateTopbar() {
    const el = document.getElementById('tx-topbar');
    if (el) el.innerHTML = renderTopbar();
  }
  function updateAppFooter() {
    const el = document.getElementById('tx-app-footer');
    if (el) el.innerHTML = renderAppFooter();
  }
  function updateSidebarMobile() {
    const el = document.getElementById('tx-sidebar');
    const overlay = document.getElementById('tx-sidebar-overlay');
    if (!el) return;
    const open = UIState.get().sidebarMobileOpen;
    el.classList.toggle('translate-x-0', open);
    el.classList.toggle('-translate-x-full', !open);
    if (overlay) overlay.classList.toggle('hidden', !open);
  }

  // ============================================================
  // Event delegation
  // ============================================================
  function closeAllMenus(except) {
    document.querySelectorAll('[id$="-menu"]').forEach((m) => {
      if (m !== except) m.classList.add('hidden');
    });
  }

  function handleClick(e) {
    const trigger = e.target.closest(
      '[data-action], [data-sort], [data-table-prev], [data-table-next], [data-tab], [data-modal-close], [data-drawer-close]'
    );

    if (!trigger || ((trigger.getAttribute('data-action') || '').indexOf('toggle-menu') === -1 && trigger.getAttribute('data-action') !== 'toggle-lang')) {
      closeAllMenus();
    }
    if (!trigger) return;

    // Tab switching (self-contained).
    if (trigger.hasAttribute('data-tab')) {
      const wrap = trigger.closest('[data-tabs]');
      if (wrap && typeof global.onTabChange === 'function') global.onTabChange(Number(trigger.getAttribute('data-tab')), wrap);
      return;
    }

    // Table interactions.
    if (trigger.hasAttribute('data-sort')) {
      const wrap = trigger.closest('[data-table]');
      const cfg = TABLES[wrap.id];
      const key = trigger.getAttribute('data-sort');
      if (cfg.sortKey === key) cfg.sortDir = cfg.sortDir === 'asc' ? 'desc' : 'asc';
      else {
        cfg.sortKey = key;
        cfg.sortDir = 'asc';
      }
      renderTable(wrap.id);
      return;
    }
    if (trigger.hasAttribute('data-table-prev') || trigger.hasAttribute('data-table-next')) {
      const wrap = trigger.closest('[data-table]');
      const cfg = TABLES[wrap.id];
      cfg.page += trigger.hasAttribute('data-table-next') ? 1 : -1;
      renderTable(wrap.id);
      return;
    }

    if (trigger.hasAttribute('data-modal-close')) {
      closeModal(trigger.closest('[data-modal]'));
      return;
    }
    if (trigger.hasAttribute('data-drawer-close')) {
      closeDrawer(trigger.closest('[data-drawer]'));
      return;
    }

    const action = trigger.getAttribute('data-action');
    switch (action) {
      case 'toggle-dark':
        UIState.toggleDarkMode();
        if (SHELL === 'public') updateNavbar();
        else if (SHELL === 'app') updateTopbar();
        if (typeof global.onThemeChange === 'function') setTimeout(global.onThemeChange, 50);
        break;
      case 'toggle-lang':
      case 'toggle-menu': {
        e.stopPropagation();
        const sel = trigger.getAttribute('data-menu');
        const menu = sel && document.querySelector(sel);
        closeAllMenus(menu);
        if (menu) menu.classList.toggle('hidden');
        break;
      }
      case 'set-lang':
        e.stopPropagation();
        closeAllMenus();
        if (global.I18n) global.I18n.setLang(trigger.getAttribute('data-lang'));
        break;
      case 'toggle-mobile-menu':
        document.getElementById('tx-mobile-menu') && document.getElementById('tx-mobile-menu').classList.toggle('hidden');
        break;
      case 'toggle-sidebar':
        UIState.toggleSidebar();
        updateSidebar();
        break;
      case 'toggle-sidebar-responsive':
        if (window.innerWidth < 1024) UIState.toggleSidebarMobile();
        else {
          UIState.toggleSidebar();
          updateSidebar();
        }
        break;
      case 'close-sidebar-mobile':
        UIState.toggleSidebarMobile(false);
        break;
      case 'logout':
        Auth.logout();
        window.location.href = 'login.html';
        break;
      case 'accept-cookies':
        UIState.acceptCookies();
        updateCookieBanner();
        break;
      case 'decline-cookies':
        UIState.declineCookies();
        updateCookieBanner();
        break;
      case 'open-cookie-banner':
        UIState.openCookieBanner();
        updateCookieBanner();
        break;
    }
  }

  function handleInput(e) {
    const search = e.target.closest('[data-table-search]');
    if (search) {
      const wrap = search.closest('[data-table]');
      const cfg = TABLES[wrap.id];
      cfg.search = search.value;
      cfg.page = 1;
      renderTable(wrap.id);
      const input = document.querySelector(`#${wrap.id} [data-table-search]`);
      if (input) {
        input.focus();
        const v = input.value;
        input.setSelectionRange(v.length, v.length);
      }
    }
  }

  // ============================================================
  // Init
  // ============================================================
  function buildPublicShell(inner) {
    return (
      `<div class="flex min-h-screen flex-col" style="background-color:var(--tx-body-bg)">` +
      `<header id="tx-navbar" class="surface-header sticky top-0 z-40 border-b border-themed backdrop-blur"></header>` +
      `<main id="tx-main" class="flex-1">${inner}</main>` +
      `<footer id="tx-footer" class="border-t border-themed surface-card"></footer>` +
      `<div id="tx-cookie"></div>` +
      `<div id="tx-toast-stack" class="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2"></div>` +
      `</div>`
    );
  }

  function buildAppShell(inner) {
    return (
      `<div class="flex h-screen overflow-hidden" style="background-color:var(--tx-body-bg)">` +
      `<aside id="tx-sidebar" class="surface-sidebar fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden border-r px-4 transition-transform duration-300 -translate-x-full lg:static lg:translate-x-0" style="width:280px"></aside>` +
      `<div id="tx-sidebar-overlay" class="fixed inset-0 z-40 bg-gray-900/50 lg:hidden hidden" data-action="close-sidebar-mobile"></div>` +
      `<div class="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">` +
      `<header id="tx-topbar" class="surface-header sticky top-0 z-30 flex w-full border-b"></header>` +
      `<main class="flex-1"><div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">${inner}</div></main>` +
      `<footer id="tx-app-footer" class="surface-header border-t px-4 py-4 md:px-6 2xl:px-10"></footer>` +
      `</div>` +
      `<div id="tx-cookie"></div>` +
      `<div id="tx-toast-stack" class="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2"></div>` +
      `</div>`
    );
  }

  function buildBlankShell(inner) {
    return inner + `<div id="tx-toast-stack" class="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2"></div>`;
  }

  function init() {
    const app = document.getElementById('app');
    if (!app) return;

    if (SHELL === 'app' || document.body.getAttribute('data-guard') === 'true') {
      if (!Auth.requireAuth()) return;
    }

    const inner = app.innerHTML;
    if (SHELL === 'app') app.outerHTML = buildAppShell(inner);
    else if (SHELL === 'blank') app.outerHTML = buildBlankShell(inner);
    else app.outerHTML = buildPublicShell(inner);

    global.UIToast = notify;
    global.notify = notify;

    const renderChrome = () => {
      if (SHELL === 'public') {
        updateNavbar();
        updateFooter();
        updateCookieBanner();
      } else if (SHELL === 'app') {
        updateSidebar();
        updateTopbar();
        updateAppFooter();
        updateSidebarMobile();
        updateCookieBanner();
      }
    };
    renderChrome();

    document.addEventListener('i18n:changed', () => {
      renderChrome();
      if (typeof global.renderPage === 'function') global.renderPage();
    });

    UIState.subscribe(() => {
      if (SHELL === 'app') updateSidebarMobile();
    });

    document.addEventListener('click', handleClick);
    document.addEventListener('input', handleInput);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllMenus();
        document.querySelectorAll('[data-modal]:not(.hidden)').forEach((m) => m.classList.add('hidden'));
        document.querySelectorAll('[data-drawer]:not(.hidden)').forEach((m) => m.classList.add('hidden'));
        if (UIState.get().sidebarMobileOpen) UIState.toggleSidebarMobile(false);
      }
    });

    if (global.I18n) global.I18n.whenReady(() => typeof global.renderPage === 'function' && global.renderPage());
    else if (typeof global.renderPage === 'function') global.renderPage();
  }

  // Expose helpers for pages.
  global.UI = {
    t,
    tArr,
    lang,
    fmt,
    fmtCompact,
    fmtNumber,
    fmtDate,
    fmtDateTime,
    fmtTime,
    fromNow,
    icon,
    notify,
    avatar,
    badge,
    statusPill,
    kpiCard,
    emptyState,
    breadcrumb,
    pageHeader,
    switchToggle,
    serviceCard,
    professionalCard,
    professionalSelect,
    stepIndicator,
    calendarGrid,
    timeSlotPicker,
    appointmentCard,
    tabs,
    modal,
    openModal,
    closeModal,
    drawer,
    openDrawer,
    closeDrawer,
    dataTable,
    setTableRows,
    renderTable,
    pagination,
  };
  global.Layout = { init, updateNavbar, updateFooter, updateSidebar, updateTopbar };

  if (document.getElementById('app')) init();
  else document.addEventListener('DOMContentLoaded', init);
})(window);
