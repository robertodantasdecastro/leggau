using System;
using System.IO;
using Leggau.Models;
using UnityEngine;

namespace Leggau.Config
{
    public static class GauVariantsCatalogLoader
    {
        private const string RelativeCatalogPath = "config/gau-variants.json";

        public static GauVariantsCatalog LoadFromStreamingAssets()
        {
            var path = Path.Combine(Application.streamingAssetsPath, RelativeCatalogPath);
            if (!File.Exists(path))
            {
                throw new FileNotFoundException($"Gau variants catalog not found at {path}", path);
            }

            var json = File.ReadAllText(path);
            var catalog = JsonUtility.FromJson<GauVariantsCatalog>(json);
            if (catalog == null)
            {
                throw new InvalidOperationException("Failed to deserialize Gau variants catalog.");
            }

            return catalog;
        }
    }
}
