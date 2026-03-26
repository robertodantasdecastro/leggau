using Leggau.Models;

namespace Leggau.Gameplay
{
    public class LeggauSessionState
    {
        private string preferredGauVariantId = "gau-rounded-pixel";

        public string AccessToken { get; private set; }
        public string RefreshToken { get; private set; }
        public AppUserProfile User { get; private set; }
        public ParentProfile Parent { get; private set; }
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
        public bool HomeReady { get; private set; }
        public bool IsAuthenticated => !string.IsNullOrWhiteSpace(AccessToken);
        public bool HasPersistableState =>
            IsAuthenticated ||
            HomeReady ||
            !string.IsNullOrWhiteSpace(DraftParentEmail) ||
            !string.IsNullOrWhiteSpace(DraftChildName);
        public string PreferredGauVariantId => preferredGauVariantId;

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

        public string CurrentUserEmail => Parent?.email ?? User?.email;

        public void SetDevLogin(DevLoginResponse response)
        {
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

        public void SetFamily(FamilyOverviewResponse response)
        {
            if (response?.parent != null)
            {
                Parent = response.parent;
            }

            if (response.children != null && response.children.Length > 0)
            {
                ActiveChild = response.children[0];
            }
        }

        public void SetActiveChild(ChildProfile child)
        {
            ActiveChild = child;
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
            DraftConsentsAccepted = false;
            HomeReady = false;
            preferredGauVariantId = "gau-rounded-pixel";
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
            ActiveChild = snapshot.activeChild;
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
            HomeReady = snapshot.homeReady;
            preferredGauVariantId = string.IsNullOrWhiteSpace(snapshot.preferredGauVariantId)
                ? "gau-rounded-pixel"
                : snapshot.preferredGauVariantId;
            ActiveGauVariantIndex = ResolvePreferredVariantIndex(GauVariantsCatalog, preferredGauVariantId);
        }

        public LeggauLocalSessionSnapshot ToSnapshot()
        {
            return new LeggauLocalSessionSnapshot
            {
                accessToken = AccessToken,
                refreshToken = RefreshToken,
                user = User,
                parent = Parent,
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

            if (LegalDocuments != null && LegalDocuments.Length > 0 && !ConsentsRecorded)
            {
                return "Legal";
            }

            if (ActiveChild == null)
            {
                return "Crianca";
            }

            return "Entrada";
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
                if (response.variants[index].id == "gau-rounded-pixel")
                {
                    return index;
                }
            }

            return 0;
        }
    }
}
