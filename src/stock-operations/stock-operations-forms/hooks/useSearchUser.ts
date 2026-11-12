import React, { useEffect, useMemo, useState } from 'react';
import { useConfig } from '@openmrs/esm-framework';
import { type ConfigObject } from '../../../config-schema';
import {
  type ConceptFilterCriteria,
  type UserFilterCriteria,
  useUsers,
} from '../../../stock-lookups/stock-lookups.resource';
import { ResourceRepresentation } from '../../../core/api/api';

const useSearchUser = (filter?: ConceptFilterCriteria) => {
  const [conceptFilter, setConceptFilter] = useState<UserFilterCriteria>(
    filter || {
      v: ResourceRepresentation.Default,
      limit: 10,
      startIndex: 0,
    },
  );

  const {
    items: { results },
    isLoading,
  } = useUsers(conceptFilter);
  const { responsiblePersonExcludedRoles } = useConfig<ConfigObject>();

  // Leave out system and integration accounts, recognised by their roles
  const userList = useMemo(() => {
    // Role names are compared without regard to case: OpenMRS has both "System Developer" and "System developer"
    const excluded = new Set((responsiblePersonExcludedRoles ?? []).map((role) => role.trim().toLowerCase()));
    if (!excluded.size) return results;
    return results?.filter(
      (user) =>
        !user.roles?.some(
          (role) => excluded.has(role.display?.trim().toLowerCase()) || excluded.has(role.role?.trim().toLowerCase()),
        ),
    );
  }, [results, responsiblePersonExcludedRoles]);

  const [searchString, setSearchString] = useState(null);

  // Drug filter type
  const [limit, setLimit] = useState(filter?.limit || 10);
  const [representation, setRepresentation] = useState<string>(filter?.v || ResourceRepresentation.Default);

  useEffect(() => {
    setConceptFilter({
      startIndex: 0,
      v: representation as ResourceRepresentation,
      limit: limit,
      q: searchString,
    });
  }, [searchString, limit, representation]);

  return {
    userList,
    setLimit,
    setRepresentation,
    setSearchString,
    isLoading,
  };
};

export default useSearchUser;
