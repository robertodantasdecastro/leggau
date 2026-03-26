using System;
using System.IO;
using Leggau.Gameplay;
using UnityEngine;

namespace Leggau.App
{
    public class BootstrapRuntimeProbe : MonoBehaviour
    {
        [Serializable]
        private class ProbeSnapshot
        {
            public string updatedAtUtc;
            public string state;
            public string status;
            public string error;
            public string parentName;
            public string childName;
            public string selectedMinorId;
            public string minorRole;
            public string ageBand;
            public string activeShell;
            public string activeGauVariant;
            public int availablePoints;
            public int totalPoints;
            public int completedActivities;
            public int activityCount;
            public int rewardCount;
        }

        private readonly ProbeSnapshot snapshot = new()
        {
            state = "booting",
            status = "Unity runtime started",
        };

        private string outputPath;

        private void Awake()
        {
            outputPath = ResolveOutputPath();
            Flush();
        }

        public void ReportStatus(string status)
        {
            snapshot.status = status;
            if (snapshot.state != "error" && snapshot.state != "ready")
            {
                snapshot.state = "running";
            }

            Flush();
        }

        public void ReportError(string error)
        {
            snapshot.state = "error";
            snapshot.error = error;
            snapshot.status = error;
            Flush();
        }

        public void ReportSession(LeggauSessionState session)
        {
            if (session == null)
            {
                return;
            }

            snapshot.state = "ready";
            snapshot.parentName = session.Parent?.name ?? string.Empty;
            snapshot.childName = session.ActiveChild?.name ?? string.Empty;
            snapshot.selectedMinorId = session.SelectedMinor?.id ?? string.Empty;
            snapshot.minorRole = session.SelectedMinorRole ?? string.Empty;
            snapshot.ageBand = session.ResolvedAgeBand ?? string.Empty;
            snapshot.activeShell = session.ActiveShell ?? string.Empty;
            snapshot.activeGauVariant = session.ActiveGauVariant?.id ?? string.Empty;
            snapshot.availablePoints = session.AvailablePoints;
            snapshot.totalPoints = session.TotalPoints;
            snapshot.completedActivities = session.CompletedActivities;
            snapshot.activityCount = session.Activities?.Length ?? 0;
            snapshot.rewardCount = session.Rewards?.Length ?? 0;
            Flush();
        }

        private void Flush()
        {
            if (string.IsNullOrWhiteSpace(outputPath))
            {
                return;
            }

            try
            {
                snapshot.updatedAtUtc = DateTime.UtcNow.ToString("O");
                Directory.CreateDirectory(Path.GetDirectoryName(outputPath) ?? string.Empty);
                File.WriteAllText(outputPath, JsonUtility.ToJson(snapshot, true));
            }
            catch (Exception exception)
            {
                Debug.LogWarning($"BootstrapRuntimeProbe failed to write status file: {exception.Message}");
            }
        }

        private static string ResolveOutputPath()
        {
            var assetsPath = Application.dataPath;
            var projectRoot = Directory.GetParent(assetsPath)?.FullName;
            var repoRoot = Directory.GetParent(projectRoot ?? string.Empty)?.FullName;
            if (string.IsNullOrWhiteSpace(repoRoot))
            {
                return string.Empty;
            }

            return Path.Combine(repoRoot, ".data", "runtime", "unity", "bootstrap-playmode-status.json");
        }
    }
}
