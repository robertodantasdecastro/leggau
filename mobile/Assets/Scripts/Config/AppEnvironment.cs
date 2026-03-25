using System;
using System.IO;
using UnityEngine;

namespace Leggau.Config
{
    [Serializable]
    public class AppEnvironment
    {
        public string environmentName;
        public string apiBaseUrl;
        public string fallbackApiBaseUrl;
        public bool useRealAuthBootstrap;
        public bool autoAcceptLegalConsents;
        public bool allowDevLoginFallback;
        public string devLoginEmail;
        public string devLoginName;
        public string devAuthPassword;
    }

    public static class AppEnvironmentLoader
    {
        private const string DefaultEnvironmentRelativePath = "config/dev-api.json";

        public static AppEnvironment Load(TextAsset asset)
        {
            if (asset != null)
            {
                return JsonUtility.FromJson<AppEnvironment>(asset.text);
            }

            return LoadFromStreamingAssets(DefaultEnvironmentRelativePath);
        }

        public static AppEnvironment LoadFromStreamingAssets(string relativePath)
        {
            var resolvedPath = string.IsNullOrWhiteSpace(relativePath) ? DefaultEnvironmentRelativePath : relativePath;
            var path = Path.Combine(Application.streamingAssetsPath, resolvedPath);
            if (!File.Exists(path))
            {
                throw new ArgumentNullException(nameof(relativePath), $"Environment file is required at {path}.");
            }

            return JsonUtility.FromJson<AppEnvironment>(File.ReadAllText(path));
        }
    }
}
