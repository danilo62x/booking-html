# Agendamento / HTML

[Read in English](./README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE) ![Free](https://img.shields.io/badge/price-free-brightgreen)

App de agendamento (clínicas, salões, consultórios) em HTML + Tailwind: site público com serviços, wizard de agendamento (serviço → profissional → data/horário → dados → confirmação), meus agendamentos, e painel admin com dashboard, agenda (dia/semana), gestão de serviços, profissionais e clientes. i18n pt-BR/en/es, PWA, dark mode.

## Destaques

- Wizard de agendamento (serviço, profissional, data/horário)
- Geração de horários por agenda e duração do serviço
- Meus agendamentos: remarcar e cancelar
- Agenda dia/semana + dashboard com gráficos
- i18n pt-BR/en/es, PWA, dark mode

## Telas em destaque

- Home: Serviços e profissionais
- Agendar: Wizard com calendário e slots
- Agenda: Visão dia/semana
- Dashboard: KPIs e gráficos

## Stack

- HTML5
- JavaScript
- Tailwind CSS v4
- ApexCharts

## Requisitos

- Node.js 20 ou mais novo, com npm

## Como rodar

```bash
npm install
npm run dev
```

O servidor de desenvolvimento mostra a URL local para abrir.

Conta de demonstração:

- `admin@agenda.com` / `demo123`

## Build de produção

```bash
npm run build
```

Gera o pacote de produção em `dist/`; para conferir localmente, `npm run preview`. Qualquer hospedagem estática serve; para as rotas no cliente, redirecione caminhos desconhecidos para `index.html`.
Gera as páginas e assets otimizados em `dist/`. Os arquivos HTML também funcionam servidos direto por qualquer servidor estático.

## Estrutura do projeto

```
16 HTML pages at the root
assets/
```

## Outras tecnologias

Este template também existe em outras 4 tecnologias, com as mesmas telas e a mesma identidade visual. Todas são gratuitas:

- React 19: https://github.com/danilo62x/booking-react
- Vue 3: https://github.com/danilo62x/booking-vue3
- Angular 19: https://github.com/danilo62x/booking-angular
- Laravel 11: https://github.com/danilo62x/booking-laravel

Mais templates gratuitos (painéis admin, sistemas por segmento e apps Flutter): https://github.com/danilo62x?tab=repositories

## Licença

[MIT](./LICENSE), copyright 2026 Danilo Quinelato.
