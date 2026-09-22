import { addDays, todayBR, type Quote, type Workspace } from './domain';
export function demoWorkspace(): Workspace {
  const today = todayBR();
  const company_id = '00000000-0000-4000-8000-000000000001';
  const samples: [string, string, number, number, Quote['status']][] = [
    ['rafael costa', 'vitrificação cerâmica', 240000, -4, 'awaiting'],
    ['mariana alves', 'ppf frontal', 480000, -2, 'new'],
    ['bruno ferreira', 'polimento técnico', 85000, -1, 'new'],
    ['lucas martins', 'higienização interna', 45000, 0, 'awaiting'],
    ['camila rocha', 'lavagem detalhada', 18000, 0, 'new'],
    ['gabriel silva', 'vitrificação cerâmica', 240000, -8, 'won'],
    ['ana oliveira', 'polimento técnico', 85000, -5, 'won'],
    ['felipe santos', 'ppf frontal', 480000, -10, 'lost'],
  ];
  const quotes = samples.map(([customer_name, service, amount_cents, offset, status], i) => {
    const id = `00000000-0000-4000-8000-${String(i + 10).padStart(12, '0')}`;
    const sent_on = addDays(today, offset);
    return {
      id,
      company_id,
      customer_name,
      service,
      amount_cents,
      sent_on,
      status,
      phone: '5561000000000',
      notes:
        i === 0
          ? 'interessado na proteção da pintura. pediu para retomar a conversa nesta semana.'
          : '',
      loss_reason: status === 'lost' ? 'prazo' : null,
      loss_note: null,
      closed_at: status === 'won' || status === 'lost' ? today + 'T15:00:00Z' : null,
      recovered_cents: status === 'won' ? amount_cents : null,
      created_at: sent_on + 'T15:00:00Z',
      updated_at: sent_on + 'T15:00:00Z',
      followups: [1, 3, 7].map((d, j) => ({
        id: `10000000-0000-4000-8000-${String(i * 3 + j + 1).padStart(12, '0')}`,
        company_id,
        quote_id: id,
        step: j + 1,
        due_on: addDays(sent_on, d),
        completed_at: i === 0 && j === 0 ? addDays(sent_on, 1) + 'T15:00:00Z' : null,
        skipped_at: null,
        message: i === 0 && j === 0 ? 'oi, rafael! conseguiu dar uma olhada no orçamento?' : null,
      })),
    };
  });
  return {
    profile: { name: 'pedro' },
    company: {
      id: company_id,
      name: 'vértice estética automotiva',
      timezone: 'America/Sao_Paulo',
    },
    quotes,
  };
}
