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
        private const string DevApiAliasEnvVar = "DEV_API_ALIAS_URL";
        private const string DevApiBaseEnvVar = "DEV_API_BASE_URL";

        public static AppEnvironment Load(TextAsset asset)
        {
            AppEnvironment environment;
            if (asset != null)
            {
                environment = JsonUtility.FromJson<AppEnvironment>(asset.text);
            }
            else
            {
                environment = LoadFromStreamingAssets(DefaultEnvironmentRelativePath);
            }

            ApplyEnvironmentOverrides(environment);
            return environment;
        }

        public static AppEnvironment LoadFromStreamingAssets(string relativePath)
        {
            var resolvedPath = string.IsNullOrWhiteSpace(relativePath) ? DefaultEnvironmentRelativePath : relativePath;
            var path = Path.Combine(Application.streamingAssetsPath, resolvedPath);
            if (!File.Exists(path))
            {
                throw new ArgumentNullException(nameof(relativePath), $"Environment file is required at {path}.");
            }

            var environment = JsonUtility.FromJson<AppEnvironment>(File.ReadAllText(path));
            ApplyEnvironmentOverrides(environment);
            return environment;
        }

        private static void ApplyEnvironmentOverrides(AppEnvironment environment)
        {
            if (environment == null)
            {
                return;
            }

            var aliasUrl = Environment.GetEnvironmentVariable(DevApiAliasEnvVar);
            if (!string.IsNullOrWhiteSpace(aliasUrl))
            {
                environment.apiBaseUrl = aliasUrl.TrimEnd('/');
            }

            var fallbackUrl = Environment.GetEnvironmentVariable(DevApiBaseEnvVar);
            if (!string.IsNullOrWhiteSpace(fallbackUrl))
            {
                environment.fallbackApiBaseUrl = fallbackUrl.TrimEnd('/');
            }
        }
    }
}
