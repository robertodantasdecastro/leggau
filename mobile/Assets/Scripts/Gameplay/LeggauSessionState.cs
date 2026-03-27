using Leggau.Models;

namespace Leggau.Gameplay
{
    public class LeggauSessionState
    {
        private const string DefaultGauVariantId = "gau-rounded-pixel";
        private string preferredGauVariantId = DefaultGauVariantId;

        public string AccessToken { get; private set; }
        public string RefreshToken { get; private set; }
        public AppUserProfile User { get; private set; }
        public ParentProfile Parent { get; private set; }
        public MinorProfileRecord[] LinkedMinors { get; private set; }
        public MinorProfileRecord SelectedMinor { get; private set; }
        public InteractionPolicyRecord SelectedMinorPolicy { get; private set; }
        public MonitoredRoomRecord[] AvailableRooms { get; private set; }
        public MonitoredRoomRecord ActiveRoom { get; private set; }
        public PresenceStateRecord ActivePresence { get; private set; }
        public bool RoomsAllowed { get; private set; }
        public string RoomCatalogMessage { get; private set; }
        public RoomAccessRequirementsRecord RoomRequirements { get; private set; }
        public string ResolvedAgeBand { get; private set; }
        public string ActiveShell { get; private set; }
        public ChildProfile ActiveChild { get; private set; }
        public DailyMission[] Activities { get; private set; }
        public RewardItem[] Rewards { get; private set; }
        public int AvailablePoints { get; private set; }
        public int TotalPoints { get; private set; }
        public int CompletedActivities { get; private set; }
        public ProgressEntry[] LatestEntries { get; private set; }
        public AssetsCatalogResponse AssetsCatalog { get; private set; }
        public LegalDocumentRecord[] LegalDocuments { get; private set; }
        public GauVariantsCatalog GauVariantsCatalog { get; private set; }
        public int ActiveGauVariantIndex { get; private set; }
        public bool UsedDevLoginFallback { get; private set; }
        public bool ConsentsRecorded { get; private set; }
        public string DraftParentEmail { get; private set; }
        public string DraftParentName { get; private set; }
        public string DraftPassword { get; private set; }
        public string DraftChildName { get; private set; }
        public bool DraftConsentsAccepted { get; private set; }
        public bool DraftCreateAdolescent { get; private set; }
        public bool HomeReady { get; private set; }
        public bool IsAuthenticated => !string.IsNullOrWhiteSpace(AccessToken);
        public bool HasLinkedMinors => LinkedMinors != null && LinkedMinors.Length > 0;
        public bool HasMultipleLinkedMinors => LinkedMinors != null && LinkedMinors.Length > 1;
        public bool HasAvailableRooms => AvailableRooms != null && AvailableRooms.Length > 0;
        public bool HasActiveRoom => ActiveRoom != null && !string.IsNullOrWhiteSpace(ActiveRoom.id);
        public bool HasPersistableState =>
            IsAuthenticated ||
            HomeReady ||
            SelectedMinor != null ||
            HasLinkedMinors ||
            !string.IsNullOrWhiteSpace(DraftParentEmail) ||
            !string.IsNullOrWhiteSpace(DraftChildName);
        public string PreferredGauVariantId => preferredGauVariantId;
        public string CurrentUserEmail => Parent?.email ?? User?.email;
        public string SelectedMinorRole => ResolveMinorRole(SelectedMinor ?? ConvertToMinor(ActiveChild));

        public GauVariantDescriptor ActiveGauVariant
        {
            get
            {
                if (GauVariantsCatalog?.variants == null || GauVariantsCatalog.variants.Length == 0)
                {
                    return null;
                }

                if (ActiveGauVariantIndex < 0 || ActiveGauVariantIndex >= GauVariantsCatalog.variants.Length)
                {
                    return GauVariantsCatalog.variants[0];
                }

                return GauVariantsCatalog.variants[ActiveGauVariantIndex];
            }
        }

        public void SetDevLogin(DevLoginResponse response)
        {
            if (response == null)
            {
                return;
            }

            AccessToken = response.accessToken;
            RefreshToken = null;
            Parent = response.parent;
            UsedDevLoginFallback = true;
        }

        public void SetAuthSession(AuthSessionResponse response)
        {
            if (response == null)
            {
                return;
            }

            AccessToken = response.accessToken;
            RefreshToken = response.refreshToken;
            User = response.user;
            UsedDevLoginFallback = false;

            if (response.parent != null)
            {
                Parent = response.parent;
            }
        }

        public void InvalidateAuthentication()
        {
            AccessToken = null;
            RefreshToken = null;
            User = null;
            Parent = null;
            LinkedMinors = null;
            SelectedMinor = null;
            SelectedMinorPolicy = null;
            AvailableRooms = null;
            ActiveRoom = null;
            ActivePresence = null;
            RoomsAllowed = false;
            RoomCatalogMessage = string.Empty;
            RoomRequirements = null;
            ActiveChild = null;
            Activities = null;
            Rewards = null;
            AvailablePoints = 0;
            TotalPoints = 0;
            CompletedActivities = 0;
            LatestEntries = null;
            AssetsCatalog = null;
            LegalDocuments = null;
            UsedDevLoginFallback = false;
            ConsentsRecorded = false;
            HomeReady = false;
            ResolvedAgeBand = string.Empty;
            ActiveShell = string.Empty;
        }

        public void SetFamily(FamilyOverviewResponse response)
        {
            if (response?.parent != null)
            {
                Parent = response.parent;
            }
            else if (response?.guardian != null)
            {
                Parent = response.guardian;
            }

            SetLinkedMinors(ResolveMinorProfiles(response), true);
        }

        public void SetLinkedMinors(MinorProfileRecord[] items, bool preserveSelection)
        {
            LinkedMinors = NormalizeMinorList(items);

            if (LinkedMinors.Length == 0)
            {
                SelectMinor(null);
                return;
            }

            if (preserveSelection && !string.IsNullOrWhiteSpace(SelectedMinor?.id))
            {
                for (var index = 0; index < LinkedMinors.Length; index += 1)
                {
                    if (LinkedMinors[index]?.id == SelectedMinor.id)
                    {
                        SelectMinor(LinkedMinors[index], true);
                        return;
                    }
                }
            }

            if (LinkedMinors.Length == 1)
            {
                SelectMinor(LinkedMinors[0]);
                return;
            }

            SelectMinor(LinkedMinors[0]);
        }

        public void SelectMinorById(string minorId)
        {
            if (LinkedMinors == null || LinkedMinors.Length == 0)
            {
                SelectMinor(null);
                return;
            }

            if (string.IsNullOrWhiteSpace(minorId))
            {
                SelectMinor(LinkedMinors[0]);
                return;
            }

            for (var index = 0; index < LinkedMinors.Length; index += 1)
            {
                if (LinkedMinors[index]?.id == minorId)
                {
                    SelectMinor(LinkedMinors[index]);
                    return;
                }
            }

            SelectMinor(LinkedMinors[0]);
        }

        public void SelectNextMinor()
        {
            CycleMinor(1);
        }

        public void SelectPreviousMinor()
        {
            CycleMinor(-1);
        }

        public void SetSelectedMinorPolicy(InteractionPolicyRecord policy)
        {
            SelectedMinorPolicy = policy;
            RefreshShellMetadata();
        }

        public void SetMonitoredRooms(MonitoredRoomsEnvelope response)
        {
            if (response == null)
            {
                AvailableRooms = new MonitoredRoomRecord[0];
                ActiveRoom = null;
                ActivePresence = null;
                RoomsAllowed = false;
                RoomCatalogMessage = string.Empty;
                RoomRequirements = null;
                return;
            }

            AvailableRooms = NormalizeRoomList(response.items);
            RoomsAllowed = response.allowed;
            RoomCatalogMessage = response.reason?.Trim() ?? string.Empty;
            RoomRequirements = response.requirements;

            var nextRoom = ResolveRoomById(response.activeRoomId);
            if (nextRoom == null && ActiveRoom != null)
            {
                if (response.allowed)
                {
                    nextRoom = ResolveRoomById(ActiveRoom.id);
                }
            }

            ActiveRoom = nextRoom;
            if (ActiveRoom == null)
            {
                ActivePresence = null;
            }
        }

        public void SetActiveRoom(MonitoredRoomRecord room)
        {
            ActiveRoom = NormalizeRoom(room);
            if (ActiveRoom == null)
            {
                ActivePresence = null;
            }
        }

        public void ClearActiveRoom()
        {
            ActiveRoom = null;
            ActivePresence = null;
        }

        public void SetPresenceState(PresenceStateRecord presence)
        {
            ActivePresence = NormalizePresence(presence);
            if (ActivePresence == null)
            {
                return;
            }

            if (ActiveRoom == null || ActiveRoom.id != ActivePresence.roomId)
            {
                ActiveRoom = ResolveRoomById(ActivePresence.roomId) ?? ActiveRoom;
            }
        }

        public void SetActiveChild(ChildProfile child)
        {
            ActiveChild = child;
            if (SelectedMinor == null || child == null || SelectedMinor.id == child.id)
            {
                SelectedMinor = ConvertToMinor(child);
            }

            RefreshShellMetadata();
        }

        public void SetActivities(DailyMission[] items)
        {
            Activities = items;
        }

        public void SetRewards(RewardItem[] items, int availablePoints)
        {
            Rewards = items;
            AvailablePoints = availablePoints;
        }

        public void SetProgressSummary(ProgressSummaryResponse response)
        {
            if (response == null)
            {
                return;
            }

            if (response.child != null)
            {
                SetActiveChild(response.child);
            }

            TotalPoints = response.totalPoints;
            CompletedActivities = response.completedActivities;
            LatestEntries = response.latestEntries;
        }

        public void ApplyCheckin(CreateCheckinResponse response)
        {
            if (response == null)
            {
                return;
            }

            if (response.child != null)
            {
                SetActiveChild(response.child);
            }

            TotalPoints = response.totalPoints;
            AvailablePoints = response.totalPoints;

            if (response.entry == null)
            {
                return;
            }

            CompletedActivities += 1;

            if (LatestEntries == null || LatestEntries.Length == 0)
            {
                LatestEntries = new[] { response.entry };
                return;
            }

            var next = new ProgressEntry[LatestEntries.Length + 1];
            next[0] = response.entry;
            for (var index = 0; index < LatestEntries.Length; index += 1)
            {
                next[index + 1] = LatestEntries[index];
            }

            LatestEntries = next;
        }

        public void SetAssetsCatalog(AssetsCatalogResponse response)
        {
            AssetsCatalog = response;
        }

        public void SetLegalDocuments(LegalDocumentRecord[] items)
        {
            LegalDocuments = items;
        }

        public void MarkConsentsRecorded()
        {
            ConsentsRecorded = true;
            DraftConsentsAccepted = true;
        }

        public void SetGauVariantsCatalog(GauVariantsCatalog response)
        {
            GauVariantsCatalog = response;
            ActiveGauVariantIndex = ResolvePreferredVariantIndex(response, preferredGauVariantId);
        }

        public void ResetForBootstrap()
        {
            AccessToken = null;
            RefreshToken = null;
            User = null;
            Parent = null;
            LinkedMinors = null;
            SelectedMinor = null;
            SelectedMinorPolicy = null;
            AvailableRooms = null;
            ActiveRoom = null;
            ActivePresence = null;
            RoomsAllowed = false;
            RoomCatalogMessage = string.Empty;
            RoomRequirements = null;
            ResolvedAgeBand = string.Empty;
            ActiveShell = string.Empty;
            ActiveChild = null;
            Activities = null;
            Rewards = null;
            AvailablePoints = 0;
            TotalPoints = 0;
            CompletedActivities = 0;
            LatestEntries = null;
            AssetsCatalog = null;
            LegalDocuments = null;
            UsedDevLoginFallback = false;
            ConsentsRecorded = false;
            DraftParentEmail = string.Empty;
            DraftParentName = string.Empty;
            DraftPassword = string.Empty;
            DraftChildName = string.Empty;
            DraftConsentsAccepted = false;
            DraftCreateAdolescent = false;
            HomeReady = false;
            preferredGauVariantId = DefaultGauVariantId;
        }

        public void SetDraftResponsible(string email, string name, string password)
        {
            DraftParentEmail = email?.Trim() ?? string.Empty;
            DraftParentName = name?.Trim() ?? string.Empty;
            DraftPassword = password ?? string.Empty;
        }

        public void SetDraftChildName(string name)
        {
            DraftChildName = name?.Trim() ?? string.Empty;
        }

        public void SetDraftConsentsAccepted(bool accepted)
        {
            DraftConsentsAccepted = accepted;
        }

        public void SetDraftCreateAdolescent(bool enabled)
        {
            DraftCreateAdolescent = enabled;
        }

        public void SetHomeReady(bool ready)
        {
            HomeReady = ready;
        }

        public void SelectNextGauVariant()
        {
            if (GauVariantsCatalog?.variants == null || GauVariantsCatalog.variants.Length == 0)
            {
                return;
            }

            ActiveGauVariantIndex = (ActiveGauVariantIndex + 1) % GauVariantsCatalog.variants.Length;
            preferredGauVariantId = ActiveGauVariant?.id ?? preferredGauVariantId;
        }

        public void SelectPreviousGauVariant()
        {
            if (GauVariantsCatalog?.variants == null || GauVariantsCatalog.variants.Length == 0)
            {
                return;
            }

            ActiveGauVariantIndex -= 1;
            if (ActiveGauVariantIndex < 0)
            {
                ActiveGauVariantIndex = GauVariantsCatalog.variants.Length - 1;
            }

            preferredGauVariantId = ActiveGauVariant?.id ?? preferredGauVariantId;
        }

        public void RestoreFromSnapshot(LeggauLocalSessionSnapshot snapshot)
        {
            if (snapshot == null)
            {
                return;
            }

            AccessToken = snapshot.accessToken;
            RefreshToken = snapshot.refreshToken;
            User = snapshot.user;
            Parent = snapshot.parent;
            LinkedMinors = NormalizeMinorList(snapshot.linkedMinors);
            SelectedMinor = NormalizeMinor(snapshot.selectedMinor) ?? ConvertToMinor(snapshot.activeChild);
            SelectedMinorPolicy = NormalizePolicy(snapshot.selectedMinorPolicy);
            AvailableRooms = NormalizeRoomList(snapshot.availableRooms);
            ActiveRoom = NormalizeRoom(snapshot.activeRoom);
            ActivePresence = NormalizePresence(snapshot.activePresence);
            RoomsAllowed = snapshot.roomsAllowed;
            RoomCatalogMessage = snapshot.roomCatalogMessage ?? string.Empty;
            RoomRequirements = snapshot.roomRequirements;
            ResolvedAgeBand = snapshot.resolvedAgeBand ?? string.Empty;
            ActiveShell = snapshot.activeShell ?? string.Empty;
            ActiveChild = snapshot.activeChild ?? ConvertToChild(SelectedMinor, Parent?.id);
            Activities = snapshot.activities;
            Rewards = snapshot.rewards;
            AvailablePoints = snapshot.availablePoints;
            TotalPoints = snapshot.totalPoints;
            CompletedActivities = snapshot.completedActivities;
            LatestEntries = snapshot.latestEntries;
            AssetsCatalog = snapshot.assetsCatalog;
            LegalDocuments = snapshot.legalDocuments;
            GauVariantsCatalog = snapshot.gauVariantsCatalog;
            UsedDevLoginFallback = snapshot.usedDevLoginFallback;
            ConsentsRecorded = snapshot.consentsRecorded;
            DraftParentEmail = snapshot.draftParentEmail ?? string.Empty;
            DraftParentName = snapshot.draftParentName ?? string.Empty;
            DraftPassword = snapshot.draftPassword ?? string.Empty;
            DraftChildName = snapshot.draftChildName ?? string.Empty;
            DraftConsentsAccepted = snapshot.draftConsentsAccepted;
            DraftCreateAdolescent = snapshot.draftCreateAdolescent;
            HomeReady = snapshot.homeReady;
            preferredGauVariantId = string.IsNullOrWhiteSpace(snapshot.preferredGauVariantId)
                ? DefaultGauVariantId
                : snapshot.preferredGauVariantId;

            if ((LinkedMinors == null || LinkedMinors.Length == 0) && SelectedMinor != null)
            {
                LinkedMinors = new[] { SelectedMinor };
            }

            ActiveGauVariantIndex = ResolvePreferredVariantIndex(GauVariantsCatalog, preferredGauVariantId);
            RefreshShellMetadata();
        }

        public LeggauLocalSessionSnapshot ToSnapshot()
        {
            return new LeggauLocalSessionSnapshot
            {
                accessToken = AccessToken,
                refreshToken = RefreshToken,
                user = User,
                parent = Parent,
                linkedMinors = LinkedMinors,
                selectedMinor = SelectedMinor,
                selectedMinorPolicy = SelectedMinorPolicy,
                availableRooms = AvailableRooms,
                activeRoom = ActiveRoom,
                activePresence = ActivePresence,
                roomsAllowed = RoomsAllowed,
                roomCatalogMessage = RoomCatalogMessage,
                roomRequirements = RoomRequirements,
                resolvedAgeBand = ResolvedAgeBand,
                activeShell = ActiveShell,
                activeChild = ActiveChild,
                activities = Activities,
                rewards = Rewards,
                availablePoints = AvailablePoints,
                totalPoints = TotalPoints,
                completedActivities = CompletedActivities,
                latestEntries = LatestEntries,
                assetsCatalog = AssetsCatalog,
                legalDocuments = LegalDocuments,
                gauVariantsCatalog = GauVariantsCatalog,
                preferredGauVariantId = preferredGauVariantId,
                usedDevLoginFallback = UsedDevLoginFallback,
                consentsRecorded = ConsentsRecorded,
                draftParentEmail = DraftParentEmail,
                draftParentName = DraftParentName,
                draftPassword = DraftPassword,
                draftChildName = DraftChildName,
                draftConsentsAccepted = DraftConsentsAccepted,
                draftCreateAdolescent = DraftCreateAdolescent,
                homeReady = HomeReady,
            };
        }

        public string ResolveResumeStep()
        {
            if (HomeReady && ActiveChild != null)
            {
                return "Home";
            }

            if (!IsAuthenticated)
            {
                return "Auth";
            }

            if (LinkedMinors == null)
            {
                return "Familia";
            }

            if (SelectedMinor == null)
            {
                return "Menor";
            }

            if (SelectedMinorPolicy == null)
            {
                return "Politica";
            }

            return "Entrada";
        }

        private void CycleMinor(int direction)
        {
            if (LinkedMinors == null || LinkedMinors.Length <= 1)
            {
                return;
            }

            var currentIndex = 0;
            for (var index = 0; index < LinkedMinors.Length; index += 1)
            {
                if (LinkedMinors[index]?.id == SelectedMinor?.id)
                {
                    currentIndex = index;
                    break;
                }
            }

            currentIndex += direction;
            if (currentIndex < 0)
            {
                currentIndex = LinkedMinors.Length - 1;
            }
            else if (currentIndex >= LinkedMinors.Length)
            {
                currentIndex = 0;
            }

            SelectMinor(LinkedMinors[currentIndex]);
        }

        private void SelectMinor(MinorProfileRecord minor, bool preservePolicyIfSame = false)
        {
            var selectionChanged = SelectedMinor?.id != minor?.id;
            SelectedMinor = minor;
            ActiveChild = ConvertToChild(minor, Parent?.id);

            if (selectionChanged || !preservePolicyIfSame)
            {
                SelectedMinorPolicy = null;
                AvailableRooms = null;
                ActiveRoom = null;
                ActivePresence = null;
                RoomsAllowed = false;
                RoomCatalogMessage = string.Empty;
                RoomRequirements = null;
                HomeReady = false;
                Activities = null;
                Rewards = null;
                AvailablePoints = 0;
                TotalPoints = 0;
                CompletedActivities = 0;
                LatestEntries = null;
            }

            RefreshShellMetadata();
        }

        private void RefreshShellMetadata()
        {
            var policyAgeBand = SelectedMinorPolicy?.guardianOverride != null &&
                                !string.IsNullOrWhiteSpace(SelectedMinorPolicy.guardianOverride.preferredAgeBand)
                ? SelectedMinorPolicy.guardianOverride.preferredAgeBand
                : SelectedMinorPolicy?.ageBand;
            var selectedMinorAgeBand = !string.IsNullOrWhiteSpace(SelectedMinor?.ageBand)
                ? SelectedMinor.ageBand
                : ResolveAgeBand(SelectedMinor?.age ?? ActiveChild?.age ?? 6);

            ResolvedAgeBand = !string.IsNullOrWhiteSpace(policyAgeBand) ? policyAgeBand : selectedMinorAgeBand;
            ActiveShell = ResolveMinorRole(SelectedMinor ?? ConvertToMinor(ActiveChild)) == "adolescent"
                ? "adolescent"
                : "child";
        }

        private static MinorProfileRecord[] ResolveMinorProfiles(FamilyOverviewResponse response)
        {
            var canonicalProfiles = NormalizeMinorList(response?.minorProfiles);
            if (canonicalProfiles.Length > 0)
            {
                return canonicalProfiles;
            }

            if (response?.children == null || response.children.Length == 0)
            {
                return new MinorProfileRecord[0];
            }

            var items = new MinorProfileRecord[response.children.Length];
            for (var index = 0; index < response.children.Length; index += 1)
            {
                var child = response.children[index];
                var minor = ConvertToMinor(child);
                minor.guardianLink = FindGuardianLink(response.guardianLinks, child?.id, minor?.role);
                items[index] = NormalizeMinor(minor);
            }

            return NormalizeMinorList(items);
        }

        private static ChildProfile ConvertToChild(MinorProfileRecord minor, string parentId)
        {
            if (minor == null)
            {
                return null;
            }

            return new ChildProfile
            {
                id = minor.id,
                parentId = parentId,
                name = minor.name,
                age = minor.age,
                ageBand = minor.ageBand,
                avatar = minor.avatar,
                role = minor.role,
            };
        }

        private static MinorProfileRecord ConvertToMinor(ChildProfile child)
        {
            if (child == null)
            {
                return null;
            }

            return new MinorProfileRecord
            {
                id = child.id,
                name = child.name,
                age = child.age,
                ageBand = string.IsNullOrWhiteSpace(child.ageBand) ? ResolveAgeBand(child.age) : child.ageBand,
                avatar = child.avatar,
                role = ResolveMinorRole(child),
            };
        }

        private static MinorProfileRecord[] NormalizeMinorList(MinorProfileRecord[] items)
        {
            if (items == null || items.Length == 0)
            {
                return new MinorProfileRecord[0];
            }

            var normalized = new MinorProfileRecord[items.Length];
            var count = 0;
            for (var index = 0; index < items.Length; index += 1)
            {
                var item = NormalizeMinor(items[index]);
                if (item == null)
                {
                    continue;
                }

                normalized[count] = item;
                count += 1;
            }

            if (count == normalized.Length)
            {
                return normalized;
            }

            var trimmed = new MinorProfileRecord[count];
            for (var index = 0; index < count; index += 1)
            {
                trimmed[index] = normalized[index];
            }

            return trimmed;
        }

        private static MinorProfileRecord NormalizeMinor(MinorProfileRecord minor)
        {
            if (minor == null || string.IsNullOrWhiteSpace(minor.id))
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(minor.ageBand))
            {
                minor.ageBand = ResolveAgeBand(minor.age);
            }

            if (string.IsNullOrWhiteSpace(minor.role))
            {
                minor.role = minor.age >= 13 ? "adolescent" : "child";
            }

            minor.guardianLink = NormalizeGuardianLink(minor.guardianLink);
            return minor;
        }

        private static GuardianLinkRecord NormalizeGuardianLink(GuardianLinkRecord link)
        {
            if (link == null || string.IsNullOrWhiteSpace(link.minorProfileId))
            {
                return null;
            }

            return link;
        }

        private static GuardianLinkRecord FindGuardianLink(GuardianLinkRecord[] items, string minorProfileId, string minorRole)
        {
            if (items == null || items.Length == 0 || string.IsNullOrWhiteSpace(minorProfileId))
            {
                return null;
            }

            for (var index = 0; index < items.Length; index += 1)
            {
                var link = NormalizeGuardianLink(items[index]);
                if (link == null)
                {
                    continue;
                }

                if (link.minorProfileId == minorProfileId &&
                    (string.IsNullOrWhiteSpace(minorRole) || string.IsNullOrWhiteSpace(link.minorRole) || link.minorRole == minorRole))
                {
                    return link;
                }
            }

            return null;
        }

        private static InteractionPolicyRecord NormalizePolicy(InteractionPolicyRecord policy)
        {
            if (policy == null)
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(policy.id) && string.IsNullOrWhiteSpace(policy.minorProfileId))
            {
                return null;
            }

            return policy;
        }

        private MonitoredRoomRecord ResolveRoomById(string roomId)
        {
            if (AvailableRooms == null || AvailableRooms.Length == 0 || string.IsNullOrWhiteSpace(roomId))
            {
                return null;
            }

            for (var index = 0; index < AvailableRooms.Length; index += 1)
            {
                var room = NormalizeRoom(AvailableRooms[index]);
                if (room != null && room.id == roomId)
                {
                    return room;
                }
            }

            return null;
        }

        private static MonitoredRoomRecord[] NormalizeRoomList(MonitoredRoomRecord[] items)
        {
            if (items == null || items.Length == 0)
            {
                return new MonitoredRoomRecord[0];
            }

            var normalized = new MonitoredRoomRecord[items.Length];
            var count = 0;
            for (var index = 0; index < items.Length; index += 1)
            {
                var room = NormalizeRoom(items[index]);
                if (room == null)
                {
                    continue;
                }

                normalized[count] = room;
                count += 1;
            }

            if (count == normalized.Length)
            {
                return normalized;
            }

            var trimmed = new MonitoredRoomRecord[count];
            for (var index = 0; index < count; index += 1)
            {
                trimmed[index] = normalized[index];
            }

            return trimmed;
        }

        private static MonitoredRoomRecord NormalizeRoom(MonitoredRoomRecord room)
        {
            if (room == null || string.IsNullOrWhiteSpace(room.id))
            {
                return null;
            }

            return room;
        }

        private static PresenceStateRecord NormalizePresence(PresenceStateRecord presence)
        {
            if (presence == null || string.IsNullOrWhiteSpace(presence.roomId))
            {
                return null;
            }

            if (presence.participants == null)
            {
                presence.participants = new PresenceParticipantRecord[0];
            }

            return presence;
        }

        private static string ResolveMinorRole(ChildProfile child)
        {
            if (child == null)
            {
                return "child";
            }

            if (!string.IsNullOrWhiteSpace(child.role))
            {
                return child.role;
            }

            return child.age >= 13 ? "adolescent" : "child";
        }

        private static string ResolveMinorRole(MinorProfileRecord minor)
        {
            if (minor == null)
            {
                return "child";
            }

            if (!string.IsNullOrWhiteSpace(minor.role))
            {
                return minor.role;
            }

            return minor.age >= 13 ? "adolescent" : "child";
        }

        private static string ResolveAgeBand(int age)
        {
            if (age >= 13)
            {
                return "13-17";
            }

            if (age >= 10)
            {
                return "10-12";
            }

            return "6-9";
        }

        private static int ResolvePreferredVariantIndex(GauVariantsCatalog response, string preferredId)
        {
            if (response?.variants == null || response.variants.Length == 0)
            {
                return 0;
            }

            for (var index = 0; index < response.variants.Length; index += 1)
            {
                if (!string.IsNullOrWhiteSpace(preferredId) && response.variants[index].id == preferredId)
                {
                    return index;
                }
            }

            for (var index = 0; index < response.variants.Length; index += 1)
            {
                if (response.variants[index].id == DefaultGauVariantId)
                {
                    return index;
                }
            }

            return 0;
        }
    }
}
