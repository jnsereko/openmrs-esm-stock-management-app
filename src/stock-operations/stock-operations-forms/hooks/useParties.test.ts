import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SWRConfig } from 'swr';
import { renderHook, waitFor } from '@testing-library/react';
import { openmrsFetch, useSession } from '@openmrs/esm-framework';
import { receiptOperationTypeMock, requisitionOperationTypeMock } from '@mocks';
import { type StockOperationType } from '../../../core/api/types/stockOperation/StockOperationType';
import useParties from './useParties';

const mockOpenmrsFetch = vi.mocked(openmrsFetch);
const mockUseSession = vi.mocked(useSession);

const party = (name: string, tags: string[], extra: object = {}) => ({
  uuid: `party-${name}`,
  name,
  acronym: name,
  locationUuid: `location-${name}`,
  stockSourceUuid: undefined,
  tags,
  ...extra,
});

const parties = [
  party('box1', ['Dispensary']),
  party('box2', ['Dispensary']),
  party('central', ['Main Store']),
  { ...party('supplier', []), locationUuid: undefined, stockSourceUuid: 'source-supplier' },
];

const scope = (userUuid: string, operationTypeUuid: string, locationUuids: string[]) => ({
  uuid: `scope-${userUuid}`,
  userUuid,
  enabled: true,
  permanent: true,
  operationTypes: [{ operationTypeUuid }],
  locations: locationUuids.map((locationUuid) => ({ locationUuid, enableDescendants: false })),
});

function mockServer(scopes: Array<object>) {
  mockOpenmrsFetch.mockImplementation((url: string) => {
    if (url.includes('/stockmanagement/party')) return Promise.resolve({ data: { results: parties } } as any);
    if (url.includes('/stockmanagement/userrolescope')) return Promise.resolve({ data: { results: scopes } } as any);
    return Promise.reject(new Error(`unexpected ${url}`));
  });
}

function signIn(roles: Array<{ display: string }> = []) {
  mockUseSession.mockReturnValue({ user: { uuid: 'user-box1', roles } } as any);
}

async function renderParties(operationType: object) {
  const { result } = renderHook(() => useParties(operationType as unknown as StockOperationType), {
    wrapper: ({ children }) => React.createElement(SWRConfig, { value: { provider: () => new Map() } }, children),
  });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await waitFor(() => expect(result.current.parties.length).toBeGreaterThan(0));
  return result.current;
}

describe('useParties scope filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers only the user's scoped locations as a requisition's source, and leaves the destination open", async () => {
    signIn();
    mockServer([
      scope('user-box1', requisitionOperationTypeMock.uuid, ['location-box1']),
      scope('user-other', requisitionOperationTypeMock.uuid, ['location-box2']),
    ]);

    const { sourceParties, destinationParties } = await renderParties(requisitionOperationTypeMock);

    expect(sourceParties.map((p) => p.name)).toEqual(['box1']);
    expect(destinationParties.map((p) => p.name)).toEqual(['central']);
  });

  it("narrows a receipt's destination, the side the server checks when the source is a supplier", async () => {
    signIn();
    mockServer([scope('user-box1', receiptOperationTypeMock.uuid, ['location-central'])]);

    const { sourceParties, destinationParties } = await renderParties(receiptOperationTypeMock);

    expect(sourceParties.map((p) => p.name)).toEqual(['supplier']);
    expect(destinationParties.every((p) => p.locationUuid === 'location-central')).toBe(true);
  });

  it('leaves the lists unchanged for a super user', async () => {
    signIn([{ display: 'System Developer' }]);
    mockServer([scope('user-box1', requisitionOperationTypeMock.uuid, ['location-box1'])]);

    const { sourceParties } = await renderParties(requisitionOperationTypeMock);

    expect(sourceParties.map((p) => p.name)).toEqual(['box1', 'box2']);
  });

  it('leaves the lists unchanged when the user has no scope for the operation type', async () => {
    signIn();
    mockServer([scope('user-box1', 'another-operation-type', ['location-box1'])]);

    const { sourceParties } = await renderParties(requisitionOperationTypeMock);

    expect(sourceParties.map((p) => p.name)).toEqual(['box1', 'box2']);
  });
});
