import { z } from 'zod';
import { LOSS_REASONS, normalizePhone, parseMoney, todayBR } from './domain';
export const quoteSchema = z.object({
  id: z.uuid().optional(),
  customer_name: z.string().trim().min(2, 'informe o nome do cliente.').max(100),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((v) => /^55[1-9]\d{9,10}$/.test(v), 'informe um whatsapp brasileiro com ddd.'),
  service: z.string().trim().min(2, 'informe o serviço.').max(120),
  amount: z
    .string()
    .transform(parseMoney)
    .refine(
      (v) => Number.isInteger(v) && v > 0 && v <= 999999999,
      'informe um valor válido, como 1.250,00.',
    ),
  sent_on: z.iso
    .date()
    .refine((v) => v <= todayBR() && v >= '2000-01-01', 'a data não pode estar no futuro.'),
  notes: z.string().max(2000).default(''),
});
export const resolveSchema = z
  .object({
    id: z.uuid(),
    status: z.enum(['awaiting', 'won', 'lost']),
    reason: z.enum(LOSS_REASONS).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.status !== 'lost' || !!v.reason, 'escolha o motivo da perda.')
  .refine((v) => v.reason !== 'outro' || !!v.note, 'conte o motivo da perda.');
export const followupSchema = z.object({
  id: z.uuid(),
  message: z.string().trim().min(1, 'escreva uma mensagem.').max(2000),
});
export const companySchema = z.object({
  name: z.string().trim().min(2, 'informe o nome da empresa.').max(100),
});
