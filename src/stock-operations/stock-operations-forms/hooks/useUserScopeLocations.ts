import { useMemo } from 'react';
import useSWR from 'swr';
import { type FetchResponse, openmrsFetch, restBaseUrl, useSession } from '@openmrs/esm-framework';
import { type UserRoleScope } from '../../../core/api/types/identity/UserRoleScope';
import { type StockOperationType } from '../../../core/api/types/stockOperation/StockOperationType';

const SUPER_USER_ROLE = 'System Developer';

type LocationWithChildren = { uuid: string; childLocations?: Array<LocationWithChildren> };

// Three levels below a scope location, enough for a store's sub-stores and their rooms
const descendantsRepresentation = 'custom:(uuid,childLocations:(uuid,childLocations:(uuid,childLocations:(uuid))))';

function collectUuids(location: LocationWithChildren, into: Set<string>) {
  if (!location?.uuid) return;
  into.add(location.uuid);
  location.childLocations?.forEach((child) => collectUuids(child, into));
}

function isActive(scope: UserRoleScope, now: Date) {
  if (scope.enabled === false) return false;
  if (scope.permanent !== false) return true;
  const from = scope.activeFrom ? new Date(scope.activeFrom) : null;
  const to = scope.activeTo ? new Date(scope.activeTo) : null;
  return (!from || from <= now) && (!to || to >= now);
}

/**
 * The user's active stock role scopes that cover this operation type.
 */
export function getApplicableScopes(
  scopes: Array<UserRoleScope> | undefined,
  userUuid: string | undefined,
  operationTypeUuid: string | undefined,
  now = new Date(),
) {
  return (scopes ?? []).filter(
    (scope) =>
      scope.userUuid === userUuid &&
      isActive(scope, now) &&
      scope.operationTypes?.some((operationType) => operationType.operationTypeUuid === operationTypeUuid),
  );
}

/**
 * The locations at which the user may run this operation type, from the stock role scopes the app
 * already loads (`stockmanagement/userrolescope`), descendants included where the scope allows them.
 *
 * Returns `null` when the pickers should not be narrowed: for a super user, for a user with no scope
 * for this operation type (the server decides, as before) and while the scopes load.
 */
const useUserScopeLocations = (stockOperationType: StockOperationType) => {
  const { user } = useSession();
  const isSuperUser = useMemo(() => user?.roles?.some((role) => role?.display === SUPER_USER_ROLE) ?? false, [user]);

  const scopesUrl = isSuperUser ? null : `${restBaseUrl}/stockmanagement/userrolescope`;
  const { data: scopesResponse, isLoading: isScopesLoading } = useSWR<FetchResponse<{ results: Array<UserRoleScope> }>>(
    scopesUrl,
    openmrsFetch,
  );

  const applicableScopes = useMemo(
    () => getApplicableScopes(scopesResponse?.data?.results, user?.uuid, stockOperationType?.uuid),
    [scopesResponse, user, stockOperationType],
  );

  const parentUuids = useMemo(
    () =>
      [
        ...new Set(
          applicableScopes.flatMap(
            (scope) => scope.locations?.filter((l) => l.enableDescendants).map((l) => l.locationUuid) ?? [],
          ),
        ),
      ].sort(),
    [applicableScopes],
  );

  const { data: descendants, isLoading: isDescendantsLoading } = useSWR(
    parentUuids.length ? ['stock-scope-descendants', ...parentUuids] : null,
    () =>
      Promise.all(
        parentUuids.map((uuid) =>
          openmrsFetch<LocationWithChildren>(`${restBaseUrl}/location/${uuid}?v=${descendantsRepresentation}`).then(
            (response) => response.data,
          ),
        ),
      ),
  );

  const locationUuids = useMemo(() => {
    if (isSuperUser || isScopesLoading || isDescendantsLoading || applicableScopes.length === 0) return null;
    const uuids = new Set<string>();
    applicableScopes.forEach((scope) => scope.locations?.forEach((l) => uuids.add(l.locationUuid)));
    descendants?.forEach((location) => collectUuids(location, uuids));
    return uuids;
  }, [isSuperUser, isScopesLoading, isDescendantsLoading, applicableScopes, descendants]);

  return { locationUuids, isLoading: !isSuperUser && (isScopesLoading || isDescendantsLoading) };
};

export default useUserScopeLocations;
