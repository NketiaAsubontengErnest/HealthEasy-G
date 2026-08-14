import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { API_POLICY, ALL_ROLES, AccessRule } from '../src/lib/api-policy';
import { ROLE_DEFINITIONS, UserRole } from '../src/lib/types/rbac';

/** Mirrors the check inside `withAuth`, without needing a live request. */
function allows(rule: AccessRule | undefined, role: UserRole): boolean {
  if (!rule) return false;
  switch (rule.kind) {
    case 'authenticated':
      return true;
    case 'roles':
      return rule.roles.includes(role);
    case 'permission':
      return rule.anyOf.some((p) => ROLE_DEFINITIONS[role]?.permissions.includes(p));
  }
}

const can = (endpoint: string, method: 'GET' | 'POST' | 'PATCH', role: UserRole) =>
  allows(API_POLICY[endpoint]?.[method], role);

describe('API access policy', () => {
  it('covers every endpoint with at least one method rule', () => {
    for (const [endpoint, methods] of Object.entries(API_POLICY)) {
      assert.ok(Object.keys(methods).length > 0, `${endpoint} has no method rules`);
    }
  });

  it('only references roles that exist in the RBAC catalogue', () => {
    for (const [endpoint, methods] of Object.entries(API_POLICY)) {
      for (const [method, rule] of Object.entries(methods)) {
        if (rule.kind !== 'roles') continue;
        for (const role of rule.roles) {
          assert.ok(ROLE_DEFINITIONS[role], `${method} ${endpoint} references unknown role "${role}"`);
        }
      }
    }
  });

  it('only references permissions that some role actually holds', () => {
    const granted = new Set(Object.values(ROLE_DEFINITIONS).flatMap((d) => d.permissions));

    for (const [endpoint, methods] of Object.entries(API_POLICY)) {
      for (const [method, rule] of Object.entries(methods)) {
        if (rule.kind !== 'permission') continue;
        for (const permission of rule.anyOf) {
          assert.ok(
            granted.has(permission),
            `${method} ${endpoint} requires "${permission}", which no role is granted — the endpoint would be unreachable`
          );
        }
      }
    }
  });

  describe('Data Protection Commission constraint on Super Admin', () => {
    // ROLE_DEFINITIONS states the system administrator may not reach the
    // patient index or clinical records. These assertions are what make that
    // published constraint real rather than documentation.
    for (const endpoint of ['/api/patients', '/api/vitals', '/api/encounters']) {
      it(`denies Super Admin ${endpoint}`, () => {
        assert.equal(can(endpoint, 'GET', 'Super Admin'), false);
      });
    }

    it('still allows Super Admin the aggregate dashboard counts', () => {
      assert.equal(can('/api/stats', 'GET', 'Super Admin'), true);
    });

    it('denies the System Auditor identifiable patient data too', () => {
      assert.equal(can('/api/patients', 'GET', 'System Auditor'), false);
      assert.equal(can('/api/audit-logs', 'GET', 'System Auditor'), true);
    });
  });

  describe('separation of clinical duties', () => {
    it('lets a nurse record vitals but not diagnose', () => {
      assert.equal(can('/api/vitals', 'POST', 'Nurse'), true);
      assert.equal(can('/api/encounters', 'POST', 'Nurse'), false);
    });

    it('lets a doctor consult but not dispense medicine', () => {
      assert.equal(can('/api/encounters', 'POST', 'Doctor'), true);
      assert.equal(can('/api/pharmacy/dispense', 'POST', 'Doctor'), false);
    });

    it('lets a pharmacist dispense but not order laboratory tests', () => {
      assert.equal(can('/api/pharmacy/dispense', 'POST', 'Pharmacist'), true);
      assert.equal(can('/api/lab-orders', 'POST', 'Pharmacist'), false);
    });

    it('lets a cashier collect payment but not touch clinical records', () => {
      assert.equal(can('/api/billing', 'PATCH', 'Cashier'), true);
      assert.equal(can('/api/vitals', 'GET', 'Cashier'), false);
      assert.equal(can('/api/encounters', 'GET', 'Cashier'), false);
    });

    it('lets a laboratory technician run tests but not register patients', () => {
      assert.equal(can('/api/lab-orders', 'PATCH', 'Laboratory Technician'), true);
      assert.equal(can('/api/patients', 'POST', 'Laboratory Technician'), false);
    });

    it('reserves hospital creation for the Super Admin', () => {
      const allowed = ALL_ROLES.filter((role) => can('/api/facilities', 'POST', role));
      assert.deepEqual(allowed, ['Super Admin']);
    });

    it('reserves patient registration for records staff', () => {
      const allowed = ALL_ROLES.filter((role) => can('/api/patients', 'POST', role));
      assert.deepEqual(allowed, ['OPD / Medical Records']);
    });
  });

  describe('role catalogue integrity', () => {
    it('gives every role at least one permission and one route', () => {
      for (const role of ALL_ROLES) {
        const definition = ROLE_DEFINITIONS[role];
        assert.ok(definition, `${role} is missing from ROLE_DEFINITIONS`);
        assert.ok(definition.permissions.length > 0, `${role} has no permissions`);
        assert.ok(definition.allowedRoutes.length > 0, `${role} has no allowed routes`);
      }
    });

    it('lists every catalogued role exactly once', () => {
      assert.equal(new Set(ALL_ROLES).size, ALL_ROLES.length);
      assert.equal(ALL_ROLES.length, Object.keys(ROLE_DEFINITIONS).length);
    });

    it('keeps every reporting line pointing at a real role', () => {
      for (const definition of Object.values(ROLE_DEFINITIONS)) {
        if (definition.parentRole) {
          assert.ok(ROLE_DEFINITIONS[definition.parentRole], `${definition.name} reports to an unknown role`);
        }
        for (const subordinate of definition.subordinateRoles) {
          assert.ok(ROLE_DEFINITIONS[subordinate], `${definition.name} supervises an unknown role`);
        }
      }
    });
  });
});
