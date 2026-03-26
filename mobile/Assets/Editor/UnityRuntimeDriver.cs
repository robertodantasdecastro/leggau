using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Leggau.Editor
{
    public static class UnityRuntimeDriver
    {
        private const string BootstrapScenePath = "Assets/Scenes/Bootstrap/Bootstrap.unity";
        private const double ValidationTimeoutSeconds = 30d;
        private const string PendingPlayModeKey = "leggau.editor.pendingPlayMode";
        private const string PendingValidationKey = "leggau.editor.pendingValidation";
        private const string ValidationStartedAtKey = "leggau.editor.validationStartedAtUtc";
        private const string PendingExitAfterPlayModeKey = "leggau.editor.pendingExitAfterPlayMode";
        private const string PendingExitCodeKey = "leggau.editor.pendingExitCode";

        static UnityRuntimeDriver()
        {
            EditorApplication.update -= DrivePendingState;
            EditorApplication.update += DrivePendingState;
        }

        [MenuItem("Leggau/Run Bootstrap Play Mode")]
        public static void RunBootstrapPlayMode()
        {
            if (EditorApplication.isPlaying)
            {
                EditorApplication.isPlaying = false;
            }

            SessionState.SetBool(PendingPlayModeKey, true);
            EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo();
            EditorSceneManager.OpenScene(BootstrapScenePath);
        }

        [MenuItem("Leggau/Run Bootstrap Development Flow")]
        public static void RunBootstrapDevelopmentFlow()
        {
            Leggau.App.LeggauAppBootstrap.RequestAutomatedDevelopmentRun("child");
            RunBootstrapPlayMode();
        }

        [MenuItem("Leggau/Run Child Shell Development Flow")]
        public static void RunChildShellDevelopmentFlow()
        {
            Leggau.App.LeggauAppBootstrap.RequestAutomatedDevelopmentRun("child");
            RunBootstrapPlayMode();
        }

        [MenuItem("Leggau/Run Adolescent Shell Development Flow")]
        public static void RunAdolescentShellDevelopmentFlow()
        {
            Leggau.App.LeggauAppBootstrap.RequestAutomatedDevelopmentRun("adolescent");
            RunBootstrapPlayMode();
        }

        [MenuItem("Leggau/Stop Play Mode")]
        public static void StopPlayMode()
        {
            SessionState.SetBool(PendingPlayModeKey, false);
            SessionState.SetBool(PendingValidationKey, false);
            if (EditorApplication.isPlaying)
            {
                EditorApplication.isPlaying = false;
            }
        }

        public static void RunBootstrapValidationAndQuit()
        {
            var validationProbePath = ResolveProbePath();
            if (!string.IsNullOrWhiteSpace(validationProbePath) && File.Exists(validationProbePath))
            {
                File.Delete(validationProbePath);
            }

            Leggau.App.LeggauAppBootstrap.RequestAutomatedDevelopmentRun("child");
            SessionState.SetString("leggau.editor.expectedShell", "child");
            SessionState.SetString(ValidationStartedAtKey, DateTime.UtcNow.ToString("O"));
            SessionState.SetBool(PendingValidationKey, true);
            RunBootstrapPlayMode();
        }

        public static void RunChildShellValidationAndQuit()
        {
            PrepareShellValidation("child");
        }

        public static void RunAdolescentShellValidationAndQuit()
        {
            PrepareShellValidation("adolescent");
        }

        private static void DrivePendingState()
        {
            if (SessionState.GetBool(PendingExitAfterPlayModeKey, false) && !EditorApplication.isPlaying)
            {
                var exitCode = SessionState.GetInt(PendingExitCodeKey, 0);
                SessionState.SetBool(PendingExitAfterPlayModeKey, false);
                SessionState.EraseInt(PendingExitCodeKey);
                EditorApplication.Exit(exitCode);
                return;
            }

            if (SessionState.GetBool(PendingPlayModeKey, false))
            {
                if (!EditorApplication.isCompiling && !EditorApplication.isUpdating && !EditorApplication.isPlaying)
                {
                    SessionState.SetBool(PendingPlayModeKey, false);
                    EditorApplication.isPlaying = true;
                }
            }

            if (!SessionState.GetBool(PendingValidationKey, false))
            {
                return;
            }

            var startedAt = ResolveValidationStartedAt();
            if ((DateTime.UtcNow - startedAt).TotalSeconds > ValidationTimeoutSeconds)
            {
                Debug.LogError("Leggau bootstrap validation timed out.");
                FinishValidation(1);
                return;
            }

            var validationProbePath = ResolveProbePath();
            if (string.IsNullOrWhiteSpace(validationProbePath) || !File.Exists(validationProbePath))
            {
                return;
            }

            var json = File.ReadAllText(validationProbePath);
            var expectedShell = SessionState.GetString("leggau.editor.expectedShell", string.Empty);
            var shellMatches = string.IsNullOrWhiteSpace(expectedShell) || json.Contains($"\"activeShell\": \"{expectedShell}\"");

            if (json.Contains("\"state\": \"ready\"") && shellMatches)
            {
                Debug.Log("Leggau bootstrap validation finished successfully.");
                FinishValidation(0);
                return;
            }

            if (json.Contains("\"state\": \"ready\"") && !shellMatches)
            {
                Debug.LogError($"Leggau bootstrap validation reached ready with the wrong shell: {json}");
                FinishValidation(1);
                return;
            }

            if (json.Contains("\"state\": \"error\""))
            {
                Debug.LogError($"Leggau bootstrap validation failed: {json}");
                FinishValidation(1);
            }
        }

        private static void FinishValidation(int exitCode)
        {
            SessionState.SetBool(PendingValidationKey, false);
            SessionState.SetBool(PendingPlayModeKey, false);
            SessionState.EraseString(ValidationStartedAtKey);
            SessionState.EraseString("leggau.editor.expectedShell");

            if (EditorApplication.isPlaying)
            {
                SessionState.SetBool(PendingExitAfterPlayModeKey, true);
                SessionState.SetInt(PendingExitCodeKey, exitCode);
                EditorApplication.isPlaying = false;
                return;
            }

            EditorApplication.Exit(exitCode);
        }

        private static DateTime ResolveValidationStartedAt()
        {
            var raw = SessionState.GetString(ValidationStartedAtKey, string.Empty);
            if (DateTime.TryParse(raw, null, System.Globalization.DateTimeStyles.RoundtripKind, out var parsed))
            {
                return parsed;
            }

            return DateTime.UtcNow;
        }

        private static string ResolveProbePath()
        {
            var projectRoot = Directory.GetParent(UnityEngine.Application.dataPath)?.FullName;
            var repoRoot = Directory.GetParent(projectRoot ?? string.Empty)?.FullName;
            if (string.IsNullOrWhiteSpace(repoRoot))
            {
                return string.Empty;
            }

            return Path.Combine(repoRoot, ".data", "runtime", "unity", "bootstrap-playmode-status.json");
        }

        private static void PrepareShellValidation(string shell)
        {
            var validationProbePath = ResolveProbePath();
            if (!string.IsNullOrWhiteSpace(validationProbePath) && File.Exists(validationProbePath))
            {
                File.Delete(validationProbePath);
            }

            Leggau.App.LeggauAppBootstrap.RequestAutomatedDevelopmentRun(shell);
            SessionState.SetString("leggau.editor.expectedShell", shell);
            SessionState.SetString(ValidationStartedAtKey, DateTime.UtcNow.ToString("O"));
            SessionState.SetBool(PendingValidationKey, true);
            RunBootstrapPlayMode();
        }
    }
}
