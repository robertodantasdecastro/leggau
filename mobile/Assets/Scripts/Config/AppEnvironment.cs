using System;
using UnityEngine;

namespace Leggau.Config
{
    [Serializable]
    public class AppEnvironment
    {
        public string environmentName;
        public string apiBaseUrl;
        public string fallbackApiBaseUrl;
        public string devLoginEmail;
        public string devLoginName;
    }

    public static class AppEnvironmentLoader
    {
        public static AppEnvironment Load(TextAsset asset)
        {
            if (asset == null)
            {
                throw new ArgumentNullException(nameof(asset), "Environment asset is required.");
            }

            return JsonUtility.FromJson<AppEnvironment>(asset.text);
        }
    }
}
