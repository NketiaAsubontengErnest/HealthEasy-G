import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { formatDate, parseDate, requireDate, toDateOnly, toInventoryItem, toPatient } from '../src/lib/adapters';

/**
 * Dates used to be stored as text, so every comparison was lexical. That is
 * fine for well-formed ISO strings and quietly wrong for anything else — and
 * nothing stopped anything else from being written.
 */
describe('date handling', () => {
  describe('formatting out of the database', () => {
    it('renders a Date as the YYYY-MM-DD the UI expects', () => {
      assert.equal(formatDate(new Date('1985-04-12T00:00:00.000Z')), '1985-04-12');
    });

    it('trims the time component off a timestamp', () => {
      assert.equal(formatDate(new Date('2026-08-14T13:45:30.000Z')), '2026-08-14');
    });

    it('returns an empty string for a missing date rather than "null"', () => {
      assert.equal(formatDate(null), '');
      assert.equal(formatDate(undefined), '');
      assert.equal(formatDate(new Date('nonsense')), '');
    });
  });

  describe('parsing into the database', () => {
    it('accepts an ISO date from a form input', () => {
      assert.equal(parseDate('2026-08-14')?.toISOString(), '2026-08-14T00:00:00.000Z');
    });

    it('normalises to midnight UTC so a DATE column cannot shift a day', () => {
      assert.equal(toDateOnly('2026-08-14T23:30:00+05:30')?.toISOString(), '2026-08-14T00:00:00.000Z');
    });

    it('treats blank input as "no date"', () => {
      assert.equal(parseDate(''), null);
      assert.equal(parseDate(null), null);
    });

    it('rejects malformed input at the boundary instead of storing it', () => {
      // The old text columns accepted every one of these without complaint.
      assert.throws(() => parseDate('not-a-date', 'date of birth'), /not a valid date of birth/);
      assert.throws(() => parseDate('14/08/2026', 'attendance date'), /not a valid attendance date/);
      assert.throws(() => requireDate('', 'date of birth'), /date of birth is required/);
    });
  });

  describe('comparisons that text columns got wrong', () => {
    it('orders dates chronologically, not alphabetically', () => {
      const dates = ['2026-9-1', '2026-10-01', '2026-08-15'];

      // Lexical order on the old text column: "2026-08-15" < "2026-10-01" < "2026-9-1",
      // which puts October before September.
      assert.deepEqual([...dates].sort(), ['2026-08-15', '2026-10-01', '2026-9-1']);

      const chronological = dates
        .map((value) => parseDate(value)!)
        .sort((a, b) => a.getTime() - b.getTime())
        .map(formatDate);

      assert.deepEqual(chronological, ['2026-08-15', '2026-09-01', '2026-10-01']);
    });

    it('flags a batch expiring next month as Near Expiry', () => {
      const soon = new Date(Date.now() + 30 * 86_400_000);
      assert.equal(toInventoryItem({ quantity: 500, reorderPoint: 20, expiryDate: soon }).status, 'Near Expiry');
    });

    it('treats a consumable with no expiry as in stock, not expired', () => {
      // Printing paper has no expiry. The old column defaulted to "", which
      // `new Date("")` turned into Invalid Date.
      const item = toInventoryItem({ quantity: 60, reorderPoint: 20, expiryDate: null });
      assert.equal(item.status, 'In Stock');
      assert.equal(item.expiryDate, '');
    });

    it('round-trips a patient date of birth unchanged', () => {
      const patient = toPatient({
        dob: new Date('1962-02-09T00:00:00.000Z'),
        nhisExpiry: new Date('2027-01-31T00:00:00.000Z'),
        registrationDate: new Date('2026-07-30T00:00:00.000Z'),
        patientCategory: 'NHIS',
        allergies: [],
        chronicConditions: []
      });

      assert.equal(patient.dob, '1962-02-09');
      assert.equal(patient.nhisExpiry, '2027-01-31');
      assert.equal(patient.registrationDate, '2026-07-30');
    });
  });
});
