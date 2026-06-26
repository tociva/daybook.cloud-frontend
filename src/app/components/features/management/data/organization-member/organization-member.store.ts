import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import type {
  OrganizationMember,
  OrganizationMemberGetQuery,
  OrganizationMemberListQuery,
  OrganizationMemberPayload,
} from './organization-member.model';
import { OrganizationMemberService } from './organization-member.service';
import { initialOrganizationMemberState } from './organization-member.state';

export const OrganizationMemberStore = signalStore(
  { providedIn: 'root' },
  withState(initialOrganizationMemberState),
  withComputed(
    ({ members, selectedMember, selectedMemberId, count, isLoading, error, search }) => ({
      count: computed(() => count()),
      error: computed(() => error()),
      isLoading: computed(() => isLoading()),
      items: computed(() => members()),
      members: computed(() => members()),
      search: computed(() => search()),
      selectedItem: computed(() => selectedMember()),
      selectedMember: computed(() => selectedMember()),
      selectedMemberId: computed(() => selectedMemberId()),
    }),
  ),
  withMethods((store, service = inject(OrganizationMemberService)) => {
    const setLoading = (): void => {
      patchState(store, { error: null, isLoading: true });
    };

    const setError = (error: string): void => {
      patchState(store, { error, isLoading: false });
    };

    return {
      clear(): void {
        patchState(store, initialOrganizationMemberState);
      },

      clearError(): void {
        patchState(store, { error: null });
      },

      setSearch(search: string): void {
        patchState(store, { search });
      },

      async loadMembers(query: OrganizationMemberListQuery = {}): Promise<void> {
        setLoading();
        try {
          const [members, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, { members, count, error: null, isLoading: false });
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load users.'));
        }
      },

      async loadMemberById(
        id: string,
        query?: OrganizationMemberGetQuery,
      ): Promise<OrganizationMember | null> {
        setLoading();
        try {
          const member = await service.getById(id, query);
          patchState(store, {
            selectedMember: member,
            selectedMemberId: member.id ?? null,
            error: null,
            isLoading: false,
          });
          return member;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load user.'));
          return null;
        }
      },

      async createMember(payload: OrganizationMemberPayload): Promise<OrganizationMember | null> {
        setLoading();
        try {
          const member = await service.create(payload);
          patchState(store, (state) => ({
            members: [member, ...state.members],
            count: state.count + 1,
            selectedMember: member,
            selectedMemberId: member.id ?? null,
            error: null,
            isLoading: false,
          }));
          return member;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to invite user.'));
          return null;
        }
      },

      async updateMember(id: string, payload: OrganizationMemberPayload): Promise<boolean> {
        setLoading();
        try {
          const member = await service.update(id, payload);
          patchState(store, (state) => ({
            members: state.members.map((item) => (item.id === id ? member : item)),
            selectedMember: state.selectedMember?.id === id ? member : state.selectedMember,
            selectedMemberId: member.id ?? id,
            error: null,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update user.'));
          return false;
        }
      },

      async deleteMember(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            members: state.members.filter((member) => member.id !== id),
            count: Math.max(state.count - 1, 0),
            selectedMember: state.selectedMember?.id === id ? null : state.selectedMember,
            selectedMemberId: state.selectedMemberId === id ? null : state.selectedMemberId,
            error: null,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to remove user.'));
          return false;
        }
      },
    };
  }),
);
