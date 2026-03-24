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
    }
}
