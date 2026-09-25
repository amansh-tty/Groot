import providers from './providers.json';
import operatories from './operatories.json';
import appointments from './appointments.json';
export const types = [
  { id: 'assessment', label: 'Emergency assessment', duration: 30 },
  { id: 'treatment', label: 'Urgent treatment', duration: 60 },
];
const minutes = (time: string) => {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
};
export function availableSlots(typeId: string) {
  const type = types.find((t) => t.id === typeId) ?? types[0]!;
  const slots = [];
  for (const provider of providers)
    for (const room of operatories) {
      if (!provider.procedures.includes(type.id) || !room.procedures.includes(type.id)) continue;
      for (let start = 9 * 60; start < 17 * 60; start += 30) {
        const end = start + type.duration;
        if (
          start < minutes(provider.availability.start) ||
          end > minutes(provider.availability.end) ||
          start < minutes(room.availability.start) ||
          end > minutes(room.availability.end)
        )
          continue;
        if (
          appointments.some(
            (a) =>
              (a.providerId === provider.id || a.operatoryId === room.id) &&
              start < minutes(a.start) + a.duration &&
              end > minutes(a.start),
          )
        )
          continue;
        const time =
          String(Math.floor(start / 60)).padStart(2, '0') +
          ':' +
          String(start % 60).padStart(2, '0');
        slots.push({
          id: provider.id + '-' + room.id + '-' + time,
          time,
          providerId: provider.id,
          provider: provider.name,
          roomId: room.id,
          room: room.name,
          duration: type.duration,
        });
      }
    }
  return slots.sort((a, b) => a.time.localeCompare(b.time));
}
export type Slot = ReturnType<typeof availableSlots>[number];
