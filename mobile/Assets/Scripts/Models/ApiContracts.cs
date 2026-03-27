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
    public class AppUserProfile
    {
        public string id;
        public string email;
        public string displayName;
        public string role;
        public bool isActive;
    }

    [Serializable]
    public class ChildProfile
    {
        public string id;
        public string parentId;
        public string name;
        public int age;
        public string ageBand;
        public string avatar;
        public string role;
    }

    [Serializable]
    public class GuardianLinkRecord
    {
        public string id;
        public string parentUserId;
        public string parentProfileId;
        public string minorProfileId;
        public string minorRole;
        public string status;
        public string approvedAt;
        public string revokedAt;
    }

    [Serializable]
    public class MinorProfileRecord
    {
        public string id;
        public string name;
        public int age;
        public string ageBand;
        public string avatar;
        public string role;
        public GuardianLinkRecord guardianLink;
    }

    [Serializable]
    public class GuardianOverrideRecord
    {
        public string updatedBy;
        public string preferredAgeBand;
        public string shellTone;
        public string preferredGauVariantId;
        public bool hideMascot;
        public bool compactLayout;
        public string focusArea;
    }

    [Serializable]
    public class InteractionPolicyRecord
    {
        public string id;
        public string minorProfileId;
        public string minorRole;
        public string ageBand;
        public bool roomsEnabled;
        public bool presenceEnabled;
        public string messagingMode;
        public bool therapistParticipationAllowed;
        public GuardianOverrideRecord guardianOverride;
        public string effectiveFrom;
        public string effectiveTo;
    }

    [Serializable]
    public class PolicySnapshotRecord
    {
        public string minorProfileId;
        public string minorRole;
        public string ageBand;
        public bool roomsEnabled;
        public bool presenceEnabled;
        public string messagingMode;
        public bool therapistParticipationAllowed;
    }

    [Serializable]
    public class RoomAccessRequirementsRecord
    {
        public string guardianLinkStatus;
        public string careTeamStatus;
        public string parentApprovalStatus;
        public string adminApprovalStatus;
        public string presenceApprovalStatus;
        public string therapistLinkingStatus;
        public string roomInviteStatus;
        public string activeInviteId;
        public string inviteExpiresAt;
        public string sessionStatus;
        public string participantStatus;
        public string heartbeatTimeoutAt;
        public string endedAt;
        public string endedBy;
        public string closeReason;
        public PolicySnapshotRecord policySnapshot;
        public string accessSource;
        public string operationalStatus;
        public string operationalMessage;
        public string lockExpiresAt;
        public string[] blockedBy;
        public string blockedReason;
    }

    [Serializable]
    public class MonitoredRoomRecord
    {
        public string id;
        public string title;
        public string description;
        public string audience;
        public string ageBand;
        public string shell;
        public string presenceMode;
        public string inviteStatus;
        public string activeInviteId;
        public string inviteExpiresAt;
        public string sessionStatus;
        public string participantStatus;
        public string heartbeatTimeoutAt;
        public string endedAt;
        public string endedBy;
        public string closeReason;
    }

    [Serializable]
    public class PresenceParticipantRecord
    {
        public string participantKey;
        public string minorProfileId;
        public string minorRole;
        public string actorRole;
        public string activeShell;
        public string accessSource;
        public string joinedAt;
        public string lastHeartbeatAt;
    }

    [Serializable]
    public class PresenceStateRecord
    {
        public bool allowed;
        public string reason;
        public RoomAccessRequirementsRecord requirements;
        public string roomId;
        public string roomTitle;
        public string minorProfileId;
        public string activeShell;
        public string status;
        public string presenceMode;
        public string sessionStatus;
        public string participantStatus;
        public string heartbeatTimeoutAt;
        public string endedAt;
        public string endedBy;
        public string closeReason;
        public int participantCount;
        public PresenceParticipantRecord[] participants;
        public string operationalStatus;
        public string operationalMessage;
        public string lockExpiresAt;
    }

    [Serializable]
    public class MonitoredRoomsEnvelope
    {
        public bool allowed;
        public string reason;
        public bool presenceEnabled;
        public string activeRoomId;
        public string sessionStatus;
        public string participantStatus;
        public string heartbeatTimeoutAt;
        public string endedAt;
        public string endedBy;
        public string closeReason;
        public MonitoredRoomRecord[] items;
        public RoomAccessRequirementsRecord requirements;
        public string operationalStatus;
        public string operationalMessage;
        public string lockExpiresAt;
    }

    [Serializable]
    public class RoomActionRequest
    {
        public string minorProfileId;
        public string activeShell;
    }

    [Serializable]
    public class RoomActionResponse
    {
        public bool allowed;
        public string activeRoomId;
        public MonitoredRoomRecord room;
        public PresenceStateRecord presence;
    }

    [Serializable]
    public class PresenceHeartbeatRequest
    {
        public string roomId;
        public string minorProfileId;
        public string activeShell;
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
    public class RegisterRequest
    {
        public string email;
        public string password;
        public string displayName;
    }

    [Serializable]
    public class LoginRequest
    {
        public string email;
        public string password;
    }

    [Serializable]
    public class AuthSessionResponse
    {
        public string accessToken;
        public string refreshToken;
        public AppUserProfile user;
        public ParentProfile parent;
        public string actorRole;
    }

    [Serializable]
    public class LegalDocumentRecord
    {
        public string id;
        public string key;
        public string version;
        public string title;
        public string audience;
        public string contentMarkdown;
        public bool isActive;
        public string effectiveAt;
    }

    [Serializable]
    public class LegalDocumentsEnvelope
    {
        public LegalDocumentRecord[] items;
    }

    [Serializable]
    public class RecordConsentRequest
    {
        public string userEmail;
        public string documentKey;
    }

    [Serializable]
    public class CreateChildRequest
    {
        public string parentEmail;
        public string name;
        public int age;
        public string avatar;
    }

    [Serializable]
    public class FamilyOverviewResponse
    {
        public ParentProfile parent;
        public ParentProfile guardian;
        public ChildProfile[] children;
        public GuardianLinkRecord[] guardianLinks;
        public MinorProfileRecord[] minorProfiles;
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
