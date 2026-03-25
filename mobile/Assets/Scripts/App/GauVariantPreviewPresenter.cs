using System;
using Leggau.Models;
using UnityEngine;

namespace Leggau.App
{
    public class GauVariantPreviewPresenter : MonoBehaviour
    {
        [Serializable]
        public class GauVariantBinding
        {
            public string variantId;
            public GameObject prefab;
            public Vector3 position = new(2.6f, 0f, 0f);
            public Vector3 rotationEuler = new(0f, -18f, 0f);
            public Vector3 scale = Vector3.one;
        }

        [SerializeField] private GauVariantBinding[] bindings;
        [SerializeField] private Transform stageRoot;

        private GameObject currentInstance;
        private string activeVariantId;

        public void Configure(GauVariantBinding[] configuredBindings, Transform configuredStageRoot)
        {
            bindings = configuredBindings;
            stageRoot = configuredStageRoot;
        }

        public void ShowVariant(GauVariantDescriptor descriptor)
        {
            if (descriptor == null)
            {
                ClearCurrentInstance();
                activeVariantId = null;
                return;
            }

            ShowVariant(descriptor.id);
        }

        public void ShowVariant(string variantId)
        {
            if (string.IsNullOrWhiteSpace(variantId))
            {
                ClearCurrentInstance();
                activeVariantId = null;
                return;
            }

            var binding = ResolveBinding(variantId);
            if (binding == null || binding.prefab == null)
            {
                return;
            }

            if (activeVariantId == variantId && currentInstance != null)
            {
                return;
            }

            ClearCurrentInstance();
            activeVariantId = variantId;

            currentInstance = Instantiate(binding.prefab, stageRoot != null ? stageRoot : transform);
            currentInstance.name = $"GauVariant_{variantId}";
            currentInstance.transform.localPosition = binding.position;
            currentInstance.transform.localRotation = Quaternion.Euler(binding.rotationEuler);
            currentInstance.transform.localScale = binding.scale;
        }

        private GauVariantBinding ResolveBinding(string variantId)
        {
            if (bindings == null)
            {
                return null;
            }

            foreach (var item in bindings)
            {
                if (item != null && item.variantId == variantId)
                {
                    return item;
                }
            }

            return null;
        }

        private void ClearCurrentInstance()
        {
            if (currentInstance == null)
            {
                return;
            }

            if (Application.isPlaying)
            {
                Destroy(currentInstance);
            }
            else
            {
                DestroyImmediate(currentInstance);
            }

            currentInstance = null;
        }
    }
}
