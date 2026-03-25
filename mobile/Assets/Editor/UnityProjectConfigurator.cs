using System;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Leggau.Editor
{
    public static class UnityProjectConfigurator
    {
        private const string BootstrapScenePath = "Assets/Scenes/Bootstrap/Bootstrap.unity";
        private const string DevApiConfigPath = "Assets/StreamingAssets/config/dev-api.json";
        private const string GauCatalogPath = "Assets/StreamingAssets/config/gau-variants.json";
        private const string GauBaseModelPath = "Assets/Art/Characters/Gau/Exports/Gau.fbx";
        private const string GauRoundedModelPath = "Assets/Art/Characters/Gau/RoundedPixel/Gau-rounded-pixel.fbx";

        [MenuItem("Leggau/Configure Project")]
        public static void ConfigureProject()
        {
            PlayerSettings.companyName = "Leggau";
            PlayerSettings.productName = "Leggau";
            PlayerSettings.bundleVersion = "0.1.0";
            PlayerSettings.Android.bundleVersionCode = 1;
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, "com.leggau.mobile");
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.iOS, "com.leggau.mobile");
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Standalone, "com.leggau.mobile");

            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
            PlayerSettings.allowedAutorotateToPortrait = true;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;
            PlayerSettings.allowedAutorotateToLandscapeLeft = false;
            PlayerSettings.allowedAutorotateToLandscapeRight = false;
            PlayerSettings.colorSpace = ColorSpace.Linear;
            PlayerSettings.stripEngineCode = true;
            PlayerSettings.SetApiCompatibilityLevel(NamedBuildTarget.Android, ApiCompatibilityLevel.NET_Unity_4_8);
            PlayerSettings.SetApiCompatibilityLevel(NamedBuildTarget.iOS, ApiCompatibilityLevel.NET_Unity_4_8);

            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(BootstrapScenePath, true),
            };

            AssetDatabase.SaveAssets();
        }

        [MenuItem("Leggau/Configure And Validate Project")]
        public static void ConfigureAndValidateProject()
        {
            ConfigureProject();
            ValidateProject();
        }

        public static void ConfigureAndValidateForLeggau()
        {
            ConfigureAndValidateProject();
            EditorApplication.Exit(0);
        }

        [MenuItem("Leggau/Validate Project")]
        public static void ValidateProject()
        {
            var report = new StringBuilder();
            report.AppendLine("# Unity Environment Status");
            report.AppendLine();
            report.AppendLine($"Generated: `{DateTimeOffset.Now:yyyy-MM-dd HH:mm:ss zzz}`");
            report.AppendLine($"Editor: `{Application.unityVersion}`");
            report.AppendLine($"Project: `{Directory.GetParent(Application.dataPath)?.FullName}`");
            report.AppendLine();
            report.AppendLine("## Project Settings");
            report.AppendLine($"- Company: `{PlayerSettings.companyName}`");
            report.AppendLine($"- Product: `{PlayerSettings.productName}`");
            report.AppendLine($"- Android Application Identifier: `{PlayerSettings.GetApplicationIdentifier(NamedBuildTarget.Android)}`");
            report.AppendLine($"- iOS Application Identifier: `{PlayerSettings.GetApplicationIdentifier(NamedBuildTarget.iOS)}`");
            report.AppendLine($"- Bundle Version: `{PlayerSettings.bundleVersion}`");
            report.AppendLine($"- Android Bundle Version Code: `{PlayerSettings.Android.bundleVersionCode}`");
            report.AppendLine($"- Default Orientation: `{PlayerSettings.defaultInterfaceOrientation}`");
            report.AppendLine($"- Color Space: `{PlayerSettings.colorSpace}`");
            report.AppendLine();
            report.AppendLine("## Build Settings");

            foreach (var scene in EditorBuildSettings.scenes)
            {
                report.AppendLine($"- Scene: `{scene.path}` enabled=`{scene.enabled}` exists=`{File.Exists(Path.Combine(Directory.GetParent(Application.dataPath)?.FullName ?? string.Empty, scene.path))}`");
            }

            report.AppendLine();
            report.AppendLine("## Required Assets");
            AppendAssetStatus(report, DevApiConfigPath);
            AppendAssetStatus(report, GauCatalogPath);
            AppendAssetStatus(report, GauBaseModelPath);
            AppendAssetStatus(report, GauRoundedModelPath);
            AppendAssetStatus(report, BootstrapScenePath);

            report.AppendLine();
            report.AppendLine("## Editor Modules");
            var editorRoot = Directory.GetParent(EditorApplication.applicationPath)?.FullName ?? string.Empty;
            var androidSupportInstalled = Directory.Exists(Path.Combine(editorRoot, "PlaybackEngines", "AndroidPlayer"));
            var iosSupportInstalled = Directory.Exists(Path.Combine(editorRoot, "PlaybackEngines", "iOSSupport"));
            report.AppendLine($"- Editor Root: `{editorRoot}`");
            report.AppendLine($"- Android Support Installed: `{androidSupportInstalled}`");
            report.AppendLine($"- iOS Support Installed: `{iosSupportInstalled}`");

            var reportPath = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", "docs", "unity-environment-status.md"));
            Directory.CreateDirectory(Path.GetDirectoryName(reportPath) ?? throw new InvalidOperationException("Missing docs directory."));
            File.WriteAllText(reportPath, report.ToString());
            AssetDatabase.Refresh();
            Debug.Log($"Leggau Unity environment report written to {reportPath}");
        }

        private static void AppendAssetStatus(StringBuilder report, string assetPath)
        {
            var asset = AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(assetPath);
            report.AppendLine($"- `{assetPath}` loaded=`{asset != null}`");
        }
    }
}
