using System;

namespace Leggau.Models
{
    [Serializable]
    public class GauVariantDescriptor
    {
        public string id;
        public string displayName;
        public string styleTag;
        public string sourceOfTruth;
        public string blendPath;
        public string fbxPath;
        public string previewPath;
        public string summary;
        public string recommendedUse;
        public bool is3d;
    }

    [Serializable]
    public class GauVariantsCatalog
    {
        public string mascot;
        public string generatedAt;
        public GauVariantDescriptor[] variants;
    }
}
