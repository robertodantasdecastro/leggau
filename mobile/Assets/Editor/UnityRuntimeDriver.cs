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

        private static DateTime validationStartedAtUtc;
        private static string validationProbePath;
        private static bool validationActive;

        [MenuItem("Leggau/Run Bootstrap Play Mode")]
        public static void RunBootstrapPlayMode()
        {
            if (EditorApplication.isPlaying)
            {
                EditorApplication.isPlaying = false;
            }

            EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo();
            EditorSceneManager.OpenScene(BootstrapScenePath);
            EditorApplication.delayCall += EnterPlayMode;
        }

        [MenuItem("Leggau/Stop Play Mode")]
        public static void StopPlayMode()
        {
            if (EditorApplication.isPlaying)
            {
                EditorApplication.isPlaying = false;
            }
        }

        public static void RunBootstrapValidationAndQuit()
        {
            validationProbePath = ResolveProbePath();
            if (!string.IsNullOrWhiteSpace(validationProbePath) && File.Exists(validationProbePath))
            {
                File.Delete(validationProbePath);
            }

            validationStartedAtUtc = DateTime.UtcNow;
            validationActive = true;

            if (EditorApplication.isPlaying)
            {
                EditorApplication.isPlaying = false;
            }

            EditorSceneManager.OpenScene(BootstrapScenePath);
            EditorApplication.update += PollValidation;
            EditorApplication.delayCall += EnterPlayMode;
        }

        private static void EnterPlayMode()
        {
            EditorApplication.delayCall -= EnterPlayMode;
            EditorApplication.isPlaying = true;
        }

        private static void PollValidation()
        {
            if (!validationActive)
            {
                EditorApplication.update -= PollValidation;
                return;
            }

            if ((DateTime.UtcNow - validationStartedAtUtc).TotalSeconds > ValidationTimeoutSeconds)
            {
                Debug.LogError("Leggau bootstrap validation timed out.");
                FinishValidation(1);
                return;
            }

            if (string.IsNullOrWhiteSpace(validationProbePath) || !File.Exists(validationProbePath))
            {
                return;
            }

            var json = File.ReadAllText(validationProbePath);
            if (json.Contains("\"state\": \"ready\""))
            {
                Debug.Log("Leggau bootstrap validation finished successfully.");
                FinishValidation(0);
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
            validationActive = false;
            EditorApplication.update -= PollValidation;
            if (EditorApplication.isPlaying)
            {
                EditorApplication.isPlaying = false;
            }

            EditorApplication.Exit(exitCode);
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
    }
}
