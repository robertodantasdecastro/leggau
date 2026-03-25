using Leggau.App;
using Leggau.Networking;
using Leggau.UI;
using UnityEditor;
using UnityEditor.Events;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Leggau.Editor
{
    public static class BootstrapSceneBuilder
    {
        private const string SceneDirectory = "Assets/Scenes/Bootstrap";
        private const string ScenePath = "Assets/Scenes/Bootstrap/Bootstrap.unity";
        private const string DevEnvironmentPath = "Assets/StreamingAssets/config/dev-api.json";
        private static readonly GauVariantAsset[] GauVariantAssets =
        {
            new("gau-rounded-pixel", "Assets/Art/Characters/Gau/RoundedPixel/Gau-rounded-pixel.fbx", new Vector3(2.6f, 0f, 0f), new Vector3(0f, -18f, 0f), Vector3.one),
            new("gau-mario-pixel", "Assets/Art/Characters/Gau/MarioPixel/Gau-mario-pixel.fbx", new Vector3(2.6f, 0f, 0f), new Vector3(0f, -18f, 0f), Vector3.one),
            new("gau-roblox-pixel", "Assets/Art/Characters/Gau/RobloxPixel/Gau-roblox-pixel.fbx", new Vector3(2.65f, 0f, 0f), new Vector3(0f, -18f, 0f), Vector3.one),
            new("gau-pixel-textured", "Assets/Art/Characters/Gau/PixelTextured/Gau-pixel-textured.fbx", new Vector3(2.6f, 0f, 0f), new Vector3(0f, -18f, 0f), Vector3.one),
            new("gau-base-3d", "Assets/Art/Characters/Gau/Exports/Gau.fbx", new Vector3(2.6f, 0f, 0f), new Vector3(0f, -18f, 0f), Vector3.one),
        };

        [MenuItem("Leggau/Build Bootstrap Scene")]
        public static void Build()
        {
            EnsureDirectory(SceneDirectory);

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var runtime = new GameObject("LeggauRuntime");
            var apiClient = runtime.AddComponent<ApiClient>();
            var runtimeProbe = runtime.AddComponent<BootstrapRuntimeProbe>();
            var rewardHud = runtime.AddComponent<RewardHudPresenter>();
            var dashboard = runtime.AddComponent<DashboardTextPresenter>();
            var previewPresenter = runtime.AddComponent<GauVariantPreviewPresenter>();
            var bootstrap = runtime.AddComponent<LeggauAppBootstrap>();

            var camera = CreateCamera();
            CreateLight();
            var stageRoot = CreateStage();
            CreateEventSystem();

            var canvas = CreateCanvas(camera);
            var views = BuildHud(canvas.transform);
            rewardHud.BindPointsLabel(views.points);
            dashboard.BindViews(
                views.status,
                views.parent,
                views.child,
                views.progress,
                views.activities,
                views.rewards,
                views.gauVariant,
                views.catalog,
                rewardHud,
                runtimeProbe);

            bootstrap.Configure(
                null,
                "config/dev-api.json",
                apiClient,
                dashboard,
                previewPresenter);
            PersistBootstrapBindings(bootstrap, "config/dev-api.json", apiClient, dashboard, previewPresenter);

            BuildActionButton(canvas.transform, bootstrap);
            BuildVariantControls(canvas.transform, bootstrap);
            ConfigureVariantPreview(previewPresenter, stageRoot);
            EditorSceneManager.SaveScene(scene, ScenePath);
            EnsureBuildSettings(ScenePath);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        public static void BuildAndExit()
        {
            Build();
            EditorApplication.Exit(0);
        }

        private static Camera CreateCamera()
        {
            var cameraObject = new GameObject("Main Camera");
            cameraObject.tag = "MainCamera";
            var camera = cameraObject.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.95f, 0.93f, 0.87f);
            camera.transform.position = new Vector3(0f, 2.5f, -6.5f);
            camera.transform.rotation = Quaternion.Euler(12f, 0f, 0f);
            return camera;
        }

        private static void CreateLight()
        {
            var lightObject = new GameObject("Sun");
            var light = lightObject.AddComponent<Light>();
            light.type = LightType.Directional;
            light.color = new Color(1f, 0.96f, 0.91f);
            light.intensity = 1.3f;
            lightObject.transform.rotation = Quaternion.Euler(36f, -25f, 0f);
        }

        private static Transform CreateStage()
        {
            var stageRoot = new GameObject("MascotStage").transform;
            stageRoot.position = Vector3.zero;

            var floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
            floor.name = "PlayFloor";
            floor.transform.SetParent(stageRoot, true);
            floor.transform.position = Vector3.zero;
            floor.transform.localScale = new Vector3(0.9f, 1f, 0.75f);

            var renderer = floor.GetComponent<MeshRenderer>();
            if (renderer != null)
            {
                var shader = Shader.Find("Standard");
                if (shader != null)
                {
                    var material = new Material(shader)
                    {
                        color = new Color(0.87f, 0.94f, 0.83f),
                    };
                    renderer.sharedMaterial = material;
                }
            }

            return stageRoot;
        }

        private static void CreateEventSystem()
        {
            if (Object.FindAnyObjectByType<EventSystem>() != null)
            {
                return;
            }

            var eventSystem = new GameObject("EventSystem");
            eventSystem.AddComponent<EventSystem>();
            eventSystem.AddComponent<StandaloneInputModule>();
        }

        private static Canvas CreateCanvas(Camera camera)
        {
            var canvasObject = new GameObject("BootstrapCanvas");
            var canvas = canvasObject.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.worldCamera = camera;
            canvasObject.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasObject.AddComponent<GraphicRaycaster>();
            return canvas;
        }

        private static HudViews BuildHud(Transform parent)
        {
            var panelObject = CreateUiObject("DashboardPanel", parent);
            var panelRect = panelObject.AddComponent<RectTransform>();
            panelRect.anchorMin = new Vector2(0.04f, 0.05f);
            panelRect.anchorMax = new Vector2(0.48f, 0.95f);
            panelRect.offsetMin = Vector2.zero;
            panelRect.offsetMax = Vector2.zero;

            var panelImage = panelObject.AddComponent<Image>();
            panelImage.color = new Color(1f, 0.99f, 0.96f, 0.88f);

            return new HudViews
            {
                status = CreateLabel("StatusLabel", panelObject.transform, new Vector2(0.05f, 0.88f), new Vector2(0.95f, 0.98f), 22, FontStyle.Bold, TextAnchor.MiddleLeft, "Status"),
                parent = CreateLabel("ParentLabel", panelObject.transform, new Vector2(0.05f, 0.79f), new Vector2(0.95f, 0.87f), 18, FontStyle.Bold, TextAnchor.MiddleLeft, "Responsavel"),
                child = CreateLabel("ChildLabel", panelObject.transform, new Vector2(0.05f, 0.72f), new Vector2(0.95f, 0.79f), 18, FontStyle.Bold, TextAnchor.MiddleLeft, "Crianca"),
                points = CreateLabel("PointsLabel", panelObject.transform, new Vector2(0.05f, 0.65f), new Vector2(0.95f, 0.72f), 17, FontStyle.Bold, TextAnchor.MiddleLeft, "Pontos"),
                progress = CreateLabel("ProgressLabel", panelObject.transform, new Vector2(0.05f, 0.5f), new Vector2(0.95f, 0.65f), 15, FontStyle.Normal, TextAnchor.UpperLeft, "Progresso"),
                activities = CreateLabel("ActivitiesLabel", panelObject.transform, new Vector2(0.05f, 0.34f), new Vector2(0.95f, 0.5f), 15, FontStyle.Normal, TextAnchor.UpperLeft, "Atividades"),
                rewards = CreateLabel("RewardsLabel", panelObject.transform, new Vector2(0.05f, 0.2f), new Vector2(0.95f, 0.34f), 15, FontStyle.Normal, TextAnchor.UpperLeft, "Recompensas"),
                gauVariant = CreateLabel("GauVariantLabel", panelObject.transform, new Vector2(0.05f, 0.1f), new Vector2(0.95f, 0.2f), 14, FontStyle.Bold, TextAnchor.UpperLeft, "Mascote"),
                catalog = CreateLabel("CatalogLabel", panelObject.transform, new Vector2(0.05f, 0.01f), new Vector2(0.95f, 0.1f), 14, FontStyle.Italic, TextAnchor.UpperLeft, "Catalogo"),
            };
        }

        private static void BuildActionButton(Transform parent, LeggauAppBootstrap bootstrap)
        {
            var buttonObject = CreateUiObject("CheckinButton", parent);
            var rectTransform = buttonObject.AddComponent<RectTransform>();
            rectTransform.anchorMin = new Vector2(0.72f, 0.08f);
            rectTransform.anchorMax = new Vector2(0.94f, 0.16f);
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;

            var image = buttonObject.AddComponent<Image>();
            image.color = new Color(1f, 0.78f, 0.3f, 0.92f);

            var button = buttonObject.AddComponent<Button>();
            var colors = button.colors;
            colors.normalColor = image.color;
            colors.highlightedColor = new Color(1f, 0.84f, 0.45f, 0.98f);
            colors.pressedColor = new Color(0.97f, 0.68f, 0.22f, 0.98f);
            button.colors = colors;
            UnityEventTools.AddPersistentListener(button.onClick, bootstrap.DevCheckinFirstActivity);

            CreateLabel("CheckinButtonLabel", buttonObject.transform, Vector2.zero, Vector2.one, 18, FontStyle.Bold, TextAnchor.MiddleCenter, "Registrar primeira atividade");
        }

        private static void BuildVariantControls(Transform parent, LeggauAppBootstrap bootstrap)
        {
            BuildSecondaryButton(
                parent,
                "PrevVariantButton",
                new Vector2(0.72f, 0.18f),
                new Vector2(0.82f, 0.25f),
                "Mascote anterior",
                bootstrap.SelectPreviousGauVariant);

            BuildSecondaryButton(
                parent,
                "NextVariantButton",
                new Vector2(0.84f, 0.18f),
                new Vector2(0.94f, 0.25f),
                "Proximo mascote",
                bootstrap.SelectNextGauVariant);
        }

        private static void BuildSecondaryButton(
            Transform parent,
            string name,
            Vector2 anchorMin,
            Vector2 anchorMax,
            string label,
            UnityEngine.Events.UnityAction action)
        {
            var buttonObject = CreateUiObject(name, parent);
            var rectTransform = buttonObject.AddComponent<RectTransform>();
            rectTransform.anchorMin = anchorMin;
            rectTransform.anchorMax = anchorMax;
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;

            var image = buttonObject.AddComponent<Image>();
            image.color = new Color(0.42f, 0.72f, 0.98f, 0.92f);

            var button = buttonObject.AddComponent<Button>();
            var colors = button.colors;
            colors.normalColor = image.color;
            colors.highlightedColor = new Color(0.56f, 0.79f, 1f, 0.98f);
            colors.pressedColor = new Color(0.29f, 0.61f, 0.87f, 0.98f);
            button.colors = colors;
            UnityEventTools.AddPersistentListener(button.onClick, action);

            CreateLabel($"{name}Label", buttonObject.transform, Vector2.zero, Vector2.one, 14, FontStyle.Bold, TextAnchor.MiddleCenter, label);
        }

        private static void ConfigureVariantPreview(GauVariantPreviewPresenter presenter, Transform stageRoot)
        {
            var bindings = new GauVariantPreviewPresenter.GauVariantBinding[GauVariantAssets.Length];

            for (var index = 0; index < GauVariantAssets.Length; index += 1)
            {
                var asset = GauVariantAssets[index];
                bindings[index] = new GauVariantPreviewPresenter.GauVariantBinding
                {
                    variantId = asset.variantId,
                    prefab = AssetDatabase.LoadAssetAtPath<GameObject>(asset.assetPath),
                    position = asset.position,
                    rotationEuler = asset.rotationEuler,
                    scale = asset.scale,
                };
            }

            presenter.Configure(bindings, stageRoot);
        }

        private static void PersistBootstrapBindings(
            LeggauAppBootstrap bootstrap,
            string environmentPath,
            ApiClient apiClient,
            DashboardTextPresenter dashboard,
            GauVariantPreviewPresenter previewPresenter)
        {
            var serializedBootstrap = new SerializedObject(bootstrap);
            serializedBootstrap.FindProperty("environmentAsset").objectReferenceValue = null;
            serializedBootstrap.FindProperty("environmentRelativePath").stringValue = environmentPath;
            serializedBootstrap.FindProperty("apiClient").objectReferenceValue = apiClient;
            serializedBootstrap.FindProperty("dashboardPresenter").objectReferenceValue = dashboard;
            serializedBootstrap.FindProperty("gauVariantPreviewPresenter").objectReferenceValue = previewPresenter;
            serializedBootstrap.ApplyModifiedPropertiesWithoutUndo();
        }

        private static TextValueView CreateLabel(
            string name,
            Transform parent,
            Vector2 anchorMin,
            Vector2 anchorMax,
            int fontSize,
            FontStyle fontStyle,
            TextAnchor alignment,
            string initialText)
        {
            var labelObject = CreateUiObject(name, parent);
            var rectTransform = labelObject.AddComponent<RectTransform>();
            rectTransform.anchorMin = anchorMin;
            rectTransform.anchorMax = anchorMax;
            rectTransform.offsetMin = new Vector2(8f, 4f);
            rectTransform.offsetMax = new Vector2(-8f, -4f);

            var text = labelObject.AddComponent<Text>();
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = fontSize;
            text.fontStyle = fontStyle;
            text.alignment = alignment;
            text.color = new Color(0.17f, 0.19f, 0.2f);
            text.horizontalOverflow = HorizontalWrapMode.Wrap;
            text.verticalOverflow = VerticalWrapMode.Overflow;
            text.text = initialText;

            var valueView = labelObject.AddComponent<TextValueView>();
            valueView.BindLegacyText(text);
            return valueView;
        }

        private static GameObject CreateUiObject(string name, Transform parent)
        {
            var gameObject = new GameObject(name);
            gameObject.transform.SetParent(parent, false);
            return gameObject;
        }

        private static void EnsureDirectory(string path)
        {
            if (AssetDatabase.IsValidFolder(path))
            {
                return;
            }

            var segments = path.Split('/');
            var current = segments[0];
            for (var index = 1; index < segments.Length; index += 1)
            {
                var next = $"{current}/{segments[index]}";
                if (!AssetDatabase.IsValidFolder(next))
                {
                    AssetDatabase.CreateFolder(current, segments[index]);
                }

                current = next;
            }
        }

        private static void EnsureBuildSettings(string scenePath)
        {
            var scenes = EditorBuildSettings.scenes;
            foreach (var item in scenes)
            {
                if (item.path == scenePath)
                {
                    return;
                }
            }

            var updated = new EditorBuildSettingsScene[scenes.Length + 1];
            scenes.CopyTo(updated, 0);
            updated[updated.Length - 1] = new EditorBuildSettingsScene(scenePath, true);
            EditorBuildSettings.scenes = updated;
        }

        private sealed class HudViews
        {
            public TextValueView status;
            public TextValueView parent;
            public TextValueView child;
            public TextValueView points;
            public TextValueView progress;
            public TextValueView activities;
            public TextValueView rewards;
            public TextValueView gauVariant;
            public TextValueView catalog;
        }

        private readonly struct GauVariantAsset
        {
            public GauVariantAsset(string variantId, string assetPath, Vector3 position, Vector3 rotationEuler, Vector3 scale)
            {
                this.variantId = variantId;
                this.assetPath = assetPath;
                this.position = position;
                this.rotationEuler = rotationEuler;
                this.scale = scale;
            }

            public readonly string variantId;
            public readonly string assetPath;
            public readonly Vector3 position;
            public readonly Vector3 rotationEuler;
            public readonly Vector3 scale;
        }
    }
}
