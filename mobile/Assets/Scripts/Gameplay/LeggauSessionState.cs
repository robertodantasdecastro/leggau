using Leggau.Models;

namespace Leggau.Gameplay
{
    public class LeggauSessionState
    {
        public string AccessToken { get; private set; }
        public ParentProfile Parent { get; private set; }
        public ChildProfile ActiveChild { get; private set; }
        public DailyMission[] Activities { get; private set; }
        public RewardItem[] Rewards { get; private set; }
        public int AvailablePoints { get; private set; }
        public int TotalPoints { get; private set; }
        public int CompletedActivities { get; private set; }
        public ProgressEntry[] LatestEntries { get; private set; }
        public AssetsCatalogResponse AssetsCatalog { get; private set; }
        public GauVariantsCatalog GauVariantsCatalog { get; private set; }

        public void SetLogin(DevLoginResponse response)
        {
            AccessToken = response.accessToken;
            Parent = response.parent;
        }

        public void SetFamily(FamilyOverviewResponse response)
        {
            if (response.children != null && response.children.Length > 0)
            {
                ActiveChild = response.children[0];
            }
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

        public void SetGauVariantsCatalog(GauVariantsCatalog response)
        {
            GauVariantsCatalog = response;
        }
    }
}
