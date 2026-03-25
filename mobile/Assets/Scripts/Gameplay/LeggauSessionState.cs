using Leggau.Models;

namespace Leggau.Gameplay
{
    public class LeggauSessionState
    {
        public string AccessToken { get; private set; }
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
        }

        public void SetGauVariantsCatalog(GauVariantsCatalog response)
        {
            GauVariantsCatalog = response;
            ActiveGauVariantIndex = ResolvePreferredVariantIndex(response);
        }

        public void SelectNextGauVariant()
        {
            if (GauVariantsCatalog?.variants == null || GauVariantsCatalog.variants.Length == 0)
            {
                return;
            }

            ActiveGauVariantIndex = (ActiveGauVariantIndex + 1) % GauVariantsCatalog.variants.Length;
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
        }

        private static int ResolvePreferredVariantIndex(GauVariantsCatalog response)
        {
            if (response?.variants == null || response.variants.Length == 0)
            {
                return 0;
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
