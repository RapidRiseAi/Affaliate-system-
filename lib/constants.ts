export const destinations = [
  { label: 'Homepage', value: '/' }, { label: 'Website Services', value: '/services/websites' },
  { label: 'Client Portals', value: '/services/client-portals' }, { label: 'Dashboards', value: '/services/dashboards' },
  { label: 'AI Agents', value: '/services/ai-agents' }, { label: 'Automations', value: '/services/automations' },
  { label: 'Contact', value: '/contact' }, { label: 'Free Audit', value: '/free-audit' }
];
export const channels = ['WhatsApp','Instagram DM','Facebook','LinkedIn','Email','Phone follow-up','In-person','Other'];
export const affiliateStatuses = [
  ['NEW_LEAD', 'New enquiry'],
  ['CONTACTED', 'Contacted'],
  ['REPLIED', 'Replied'],
  ['DISCOVERY_NEEDED', 'Discovery needed'],
  ['DISCOVERY_COMPLETED', 'Discovery completed'],
  ['QUOTE_NEEDED', 'Quote needed'],
  ['QUOTE_SENT', 'Quote sent'],
  ['NEGOTIATING', 'Negotiating'],
  ['WON', 'Client won'],
  ['LOST', 'Lost'],
  ['FOLLOW_UP_LATER', 'Follow up later'],
] as const;
