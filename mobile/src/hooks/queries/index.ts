/**
 * TanStack Query hooks — the only way screens should talk to the API.
 *
 * One hook per read (useQuery) and per write (useMutation), each wrapping the
 * existing service module. Hooks pull the token from AuthContext themselves and
 * return the unwrapped `response.data` payload. Mutations invalidate the exact
 * keys they affect, so the old lib/staleness `markDataChanged()` / `isFresh()`
 * throttle is gone.
 *
 * ── MIGRATION EXAMPLE ─────────────────────────────────────────────────────
 *
 * BEFORE:
 *   const [profiles, setProfiles] = useState<Profile[]>([]);
 *   const [loading, setLoading] = useState(true);
 *   const lastFetchRef = useRef(0);
 *
 *   const fetchProfiles = useCallback(async () => {
 *     if (!accessToken || isFresh(lastFetchRef.current)) return;
 *     setLoading(true);
 *     try {
 *       const res = await profileService.getProfiles(accessToken);
 *       setProfiles(res.data.profiles);
 *       lastFetchRef.current = Date.now();
 *     } finally {
 *       setLoading(false);
 *     }
 *   }, [accessToken]);
 *
 *   useFocusEffect(useCallback(() => { fetchProfiles(); }, [fetchProfiles]));
 *
 *   const handleDelete = async (id: string) => {
 *     await profileService.deleteProfile(id, accessToken!);   // markDataChanged()
 *     fetchProfiles();
 *   };
 *
 * AFTER:
 *   const { data, isLoading, refetch } = useProfiles();
 *   const profiles = data?.profiles ?? [];
 *   const deleteProfile = useDeleteProfile();
 *
 *   const handleDelete = (id: string) => deleteProfile.mutate(id);  // invalidates for you
 *
 * Notes:
 *   - No useFocusEffect needed: refetchOnWindowFocus is 'always' (queryClient.ts).
 *   - Pull-to-refresh: `refetch()`, spinner from `isRefetching`.
 *   - Mutation in flight: `deleteProfile.isPending`; errors: `onError` on mutate().
 *   - Never build query keys in a screen — import from lib/queryKeys, or ask for
 *     a new key to be added there.
 * ──────────────────────────────────────────────────────────────────────────
 */

export {
  useExpenses,
  useInfiniteExpenses,
  useExpense,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from './useExpenses';

export {
  useGroups,
  useGroup,
  useGroupExpenses,
  useGroupExpense,
  useGroupBalances,
  useSuggestedTransfers,
  useSettlements,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useRemoveGroupMember,
  useCreateGroupExpense,
  useUpdateGroupExpense,
  useDeleteGroupExpense,
  useCreateSettlement,
  useDeleteSettlement,
} from './useGroups';

export {
  useProfiles,
  useProfile,
  useCreateProfile,
  useUpdateProfile,
  useDeleteProfile,
} from './useProfiles';

export {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from './useCategories';

export {
  useMyInvitations,
  useGroupInvitations,
  useSendInvitation,
  useCancelInvitation,
  useAcceptInvitation,
  useDeclineInvitation,
} from './useInvitations';

export {
  useAnalyticsSummary,
  useAnalyticsByProfile,
  useAnalyticsByCategory,
  useAnalyticsTrends,
  useBalance,
} from './useAnalytics';
