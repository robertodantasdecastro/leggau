using System;

namespace Leggau.Models
{
    [Serializable]
    public class ParentProfile
    {
        public string id;
        public string name;
        public string email;
        public string role;
    }

    [Serializable]
    public class ChildProfile
    {
        public string id;
        public string parentId;
        public string name;
        public int age;
        public string avatar;
    }

    [Serializable]
    public class DailyMission
    {
        public string id;
        public string code;
        public string title;
        public string description;
        public int points;
        public string scene3d;
        public string icon2d;
        public bool active;
    }

    [Serializable]
    public class RewardItem
    {
        public string id;
        public string title;
        public string description;
        public int cost;
        public string imageUrl;
        public bool unlocked;
    }

    [Serializable]
    public class ProgressEntry
    {
        public string id;
        public string childId;
        public string activityId;
        public string notes;
        public int pointsEarned;
        public string performedAt;
        public DailyMission activity;
    }

    [Serializable]
    public class DevLoginRequest
    {
        public string email;
        public string name;
    }

    [Serializable]
    public class DevLoginResponse
    {
        public string accessToken;
        public ParentProfile parent;
    }

    [Serializable]
    public class FamilyOverviewResponse
    {
        public ParentProfile parent;
        public ChildProfile[] children;
    }

    [Serializable]
    public class ActivitiesResponse
    {
        public string source;
        public DailyMission[] items;
    }

    [Serializable]
    public class RewardsResponse
    {
        public int availablePoints;
        public RewardItem[] items;
    }

    [Serializable]
    public class ProgressSummaryResponse
    {
        public ChildProfile child;
        public int totalPoints;
        public int completedActivities;
        public ProgressEntry[] latestEntries;
    }

    [Serializable]
    public class AssetPalette
    {
        public string primary;
        public string success;
        public string accent;
        public string outline;
    }

    [Serializable]
    public class MascotDescriptor
    {
        public string name;
        public string brand;
        public string visualStyle;
        public AssetPalette palette;
    }

    [Serializable]
    public class ApiDescriptor
    {
        public string devBaseUrl;
        public string prodBaseUrl;
    }

    [Serializable]
    public class SceneDescriptor
    {
        public string key;
        public string mode;
        public string objective;
    }

    [Serializable]
    public class OverlayDescriptor
    {
        public string key;
        public string mode;
        public string objective;
    }

    [Serializable]
    public class AudioCueDescriptor
    {
        public string success;
        public string reminder;
    }

    [Serializable]
    public class AssetsCatalogResponse
    {
        public MascotDescriptor mascot;
        public ApiDescriptor api;
        public SceneDescriptor[] scenes;
        public OverlayDescriptor[] overlays;
        public AudioCueDescriptor audioCues;
    }

    [Serializable]
    public class CreateCheckinRequest
    {
        public string childId;
        public string activityId;
        public string notes;
    }

    [Serializable]
    public class CreateCheckinResponse
    {
        public ProgressEntry entry;
        public ChildProfile child;
        public DailyMission activity;
        public int totalPoints;
    }
}
