import { expect, it } from 'vitest';
import { availableSlots } from '../../../data/scheduling';

it('offers only compatible full-duration slots without provider or room conflicts', () => {
  const assessment = availableSlots('assessment');
  expect(assessment.some((slot) => slot.providerId === 'p1' && slot.time === '10:00')).toBe(false);
  expect(assessment.some((slot) => slot.roomId === 'o1' && slot.time === '10:30')).toBe(false);
  expect(assessment.some((slot) => slot.providerId === 'p2' && slot.time === '11:00')).toBe(false);
  const treatment = availableSlots('treatment');
  expect(treatment.length).toBeGreaterThan(0);
  expect(
    treatment.every(
      (slot) => slot.providerId === 'p1' && slot.roomId === 'o1' && slot.duration === 60,
    ),
  ).toBe(true);
  expect(treatment.some((slot) => ['09:30', '16:30'].includes(slot.time))).toBe(false);
});
