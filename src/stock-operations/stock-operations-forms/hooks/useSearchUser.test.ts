import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useConfig } from '@openmrs/esm-framework';
import { useUsers } from '../../../stock-lookups/stock-lookups.resource';
import useSearchUser from './useSearchUser';

vi.mock('../../../stock-lookups/stock-lookups.resource', () => ({ useUsers: vi.fn() }));

const users = [
  { uuid: 'admin', display: 'admin', roles: [{ display: 'System Developer' }] },
  { uuid: 'eip', display: 'eip', roles: [{ display: 'System developer' }] },
  { uuid: 'integration', display: 'integration', roles: [{ display: 'EIP Integration' }] },
  { uuid: 'pharmacist', display: 'pharmacist', roles: [{ display: 'Pharmacist' }] },
];

describe('useSearchUser', () => {
  it('leaves out users holding a configured excluded role, whatever its case', () => {
    vi.mocked(useUsers).mockReturnValue({ items: { results: users }, isLoading: false, error: null } as any);
    vi.mocked(useConfig).mockReturnValue({ responsiblePersonExcludedRoles: ['System Developer', 'EIP Integration'] });

    const { result } = renderHook(() => useSearchUser());

    expect(result.current.userList.map((u) => u.uuid)).toEqual(['pharmacist']);
  });

  it('lists every user when no role is excluded', () => {
    vi.mocked(useUsers).mockReturnValue({ items: { results: users }, isLoading: false, error: null } as any);
    vi.mocked(useConfig).mockReturnValue({ responsiblePersonExcludedRoles: [] });

    const { result } = renderHook(() => useSearchUser());

    expect(result.current.userList).toHaveLength(4);
  });
});
