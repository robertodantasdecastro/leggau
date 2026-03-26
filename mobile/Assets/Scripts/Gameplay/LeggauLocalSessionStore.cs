using System;
using Leggau.Models;
using UnityEngine;

namespace Leggau.Gameplay
{
    [Serializable]
    public class LeggauLocalSessionSnapshot
    {
        public string accessToken;
        public string refreshToken;
        public AppUserProfile user;
        public ParentProfile parent;
        public MinorProfileRecord[] linkedMinors;
        public MinorProfileRecord selectedMinor;
        public InteractionPolicyRecord selectedMinorPolicy;
        public string resolvedAgeBand;
        public string activeShell;
        public ChildProfile activeChild;
        public DailyMission[] activities;
        public RewardItem[] rewards;
        public int availablePoints;
        public int totalPoints;
        public int completedActivities;
        public ProgressEntry[] latestEntries;
        public AssetsCatalogResponse assetsCatalog;
        public LegalDocumentRecord[] legalDocuments;
        public GauVariantsCatalog gauVariantsCatalog;
        public string preferredGauVariantId;
        public bool usedDevLoginFallback;
        public bool consentsRecorded;
        public string draftParentEmail;
        public string draftParentName;
        public string draftPassword;
        public string draftChildName;
        public bool draftConsentsAccepted;
        public bool draftCreateAdolescent;
        public bool homeReady;
    }

    public static class LeggauLocalSessionStore
    {
        private const string SnapshotKey = "leggau.localSession.snapshot.v1";

        public static bool TryLoad(out LeggauLocalSessionSnapshot snapshot)
        {
            snapshot = null;
            if (!PlayerPrefs.HasKey(SnapshotKey))
            {
                return false;
            }

            var json = PlayerPrefs.GetString(SnapshotKey, string.Empty);
            if (string.IsNullOrWhiteSpace(json))
            {
                return false;
            }

            try
            {
                snapshot = JsonUtility.FromJson<LeggauLocalSessionSnapshot>(json);
                return snapshot != null;
            }
            catch
            {
                Clear();
                snapshot = null;
                return false;
            }
        }

        public static void Save(LeggauSessionState session)
        {
            if (session == null || !session.HasPersistableState)
            {
                return;
            }

            var json = JsonUtility.ToJson(session.ToSnapshot());
            PlayerPrefs.SetString(SnapshotKey, json);
            PlayerPrefs.Save();
        }

        public static void Clear()
        {
            PlayerPrefs.DeleteKey(SnapshotKey);
            PlayerPrefs.Save();
        }
    }
}
