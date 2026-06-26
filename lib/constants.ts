export const destinations = [
  { label: 'Homepage', value: '/' }, { label: 'Website Services', value: '/services/website-development' },
  { label: 'Client Portals', value: '/services/client-portal' }, { label: 'Dashboards', value: '/services/smart-dashboards' },
  { label: 'AI Agents', value: '/services/ai-communication-agent' }, { label: 'Automations', value: '/services/automated-workflow' },
  { label: 'Software Development', value: '/services/software-development' }, { label: 'Web Apps', value: '/services/web-app-development' },
  { label: 'Ecosystems', value: '/services/ecosystems' }, { label: 'AI Implementation', value: '/services/ai-implementation' },
  { label: 'IoT Development', value: '/services/iot-development' }, { label: 'Marketing & SEO', value: '/services/marketing-seo' },
  { label: 'Contact', value: '/contact' }
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
