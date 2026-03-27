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
            var onboardingControls = runtime.AddComponent<OnboardingControlView>();
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
                views.heroTitle,
                views.heroBody,
                views.status,
                views.onboardingTitle,
                views.onboardingBody,
                views.authStep,
                views.familyStep,
                views.minorStep,
                views.homeStep,
                views.parent,
                views.child,
                views.policy,
                views.points,
                views.progress,
                views.activities,
                views.rewards,
                views.gauVariant,
                views.catalog,
                views.flow,
                rewardHud,
                runtimeProbe,
                onboardingControls,
                views.onboardingRoot.gameObject,
                views.homeRoot.gameObject);
            onboardingControls.Bind(
                views.parentEmailInput,
                views.parentNameInput,
                views.passwordInput,
                views.developmentMinorNameInput,
                views.developmentAdolescentToggle,
                views.familySummary,
                views.minorSummary,
                views.policySummary,
                views.entrySummary,
                views.authAction,
                views.familyAction,
                views.previousMinorAction,
                views.nextMinorAction,
                views.minorAction,
                views.homeAction,
                views.devAction);

            bootstrap.Configure(
                null,
                "config/dev-api.json",
                apiClient,
                dashboard,
                previewPresenter);
            PersistBootstrapBindings(bootstrap, "config/dev-api.json", apiClient, dashboard, previewPresenter);

            BuildHomeActionButton(views.actionsRoot, bootstrap);
            BuildVariantControls(views.actionsRoot, bootstrap);
            BuildOnboardingActions(views, bootstrap);
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
            var onboardingPanel = CreatePanel("OnboardingPanel", parent, new Vector2(0.04f, 0.05f), new Vector2(0.34f, 0.95f), new Color(0.99f, 0.97f, 0.92f, 0.94f));
            var homePanel = CreatePanel("HomePanel", parent, new Vector2(0.36f, 0.05f), new Vector2(0.66f, 0.95f), new Color(1f, 0.99f, 0.96f, 0.92f));
            var actionPanel = CreatePanel("ActionPanel", parent, new Vector2(0.68f, 0.05f), new Vector2(0.96f, 0.95f), new Color(0.99f, 0.98f, 0.94f, 0.92f));

            CreateLabel("ActionTitle", actionPanel.transform, new Vector2(0.08f, 0.92f), new Vector2(0.92f, 0.98f), 22, FontStyle.Bold, TextAnchor.MiddleLeft, "Gau e shells");
            CreateLabel("ActionHint", actionPanel.transform, new Vector2(0.08f, 0.86f), new Vector2(0.92f, 0.92f), 13, FontStyle.Italic, TextAnchor.MiddleLeft, "Acompanhe a policy, troque o Gau e valide os shells infantil e adolescente.");

            var authCard = CreatePanel("AuthCard", onboardingPanel.transform, new Vector2(0.06f, 0.56f), new Vector2(0.94f, 0.82f), new Color(1f, 1f, 1f, 0.74f));
            var familyCard = CreatePanel("FamilyCard", onboardingPanel.transform, new Vector2(0.06f, 0.31f), new Vector2(0.94f, 0.54f), new Color(1f, 1f, 1f, 0.74f));
            var shellCard = CreatePanel("ShellCard", onboardingPanel.transform, new Vector2(0.06f, 0.13f), new Vector2(0.94f, 0.29f), new Color(1f, 1f, 1f, 0.74f));
            var devCard = CreatePanel("DevCard", onboardingPanel.transform, new Vector2(0.06f, 0.02f), new Vector2(0.94f, 0.12f), new Color(1f, 1f, 1f, 0.74f));

            var authStep = CreateLabel("AuthStepValue", authCard.transform, new Vector2(0.04f, 0.74f), new Vector2(0.96f, 0.96f), 13, FontStyle.Bold, TextAnchor.UpperLeft, "1. Ative o responsavel");
            var parentEmailInput = CreateInputField("ParentEmailInput", authCard.transform, new Vector2(0.04f, 0.47f), new Vector2(0.96f, 0.67f), "Email do responsavel");
            var parentNameInput = CreateInputField("ParentNameInput", authCard.transform, new Vector2(0.04f, 0.26f), new Vector2(0.96f, 0.46f), "Nome do responsavel");
            var passwordInput = CreateInputField("ParentPasswordInput", authCard.transform, new Vector2(0.04f, 0.05f), new Vector2(0.52f, 0.25f), "Senha");
            passwordInput.contentType = InputField.ContentType.Password;
            passwordInput.ForceLabelUpdate();

            var authAction = BuildPrimaryButton(authCard.transform, "SubmitAuthButton", new Vector2(0.56f, 0.05f), new Vector2(0.96f, 0.17f), "Ativar responsavel");
            var familyAction = BuildSecondaryButton(
                authCard.transform,
                "RefreshFamilyButton",
                new Vector2(0.56f, 0.19f),
                new Vector2(0.96f, 0.31f),
                "Atualizar perfis",
                null);

            var familyStep = CreateLabel("FamilyStepValue", familyCard.transform, new Vector2(0.04f, 0.75f), new Vector2(0.96f, 0.96f), 13, FontStyle.Bold, TextAnchor.UpperLeft, "2. Carregue os perfis");
            var familySummary = CreateLabel("FamilySummaryValue", familyCard.transform, new Vector2(0.04f, 0.45f), new Vector2(0.96f, 0.74f), 11, FontStyle.Normal, TextAnchor.UpperLeft, "Sessao e vinculos");
            var minorStep = CreateLabel("MinorStepValue", familyCard.transform, new Vector2(0.04f, 0.24f), new Vector2(0.96f, 0.44f), 12, FontStyle.Bold, TextAnchor.UpperLeft, "3. Escolha o menor");
            var minorSummary = CreateLabel("MinorSummaryValue", familyCard.transform, new Vector2(0.04f, 0.08f), new Vector2(0.96f, 0.24f), 11, FontStyle.Normal, TextAnchor.UpperLeft, "Menor selecionado");

            var previousMinorAction = BuildSecondaryButton(
                familyCard.transform,
                "PreviousMinorButton",
                new Vector2(0.04f, 0.01f),
                new Vector2(0.24f, 0.12f),
                "Anterior",
                null);
            var minorAction = BuildPrimaryButton(familyCard.transform, "UseMinorButton", new Vector2(0.27f, 0.01f), new Vector2(0.73f, 0.12f), "Usar perfil");
            var nextMinorAction = BuildSecondaryButton(
                familyCard.transform,
                "NextMinorButton",
                new Vector2(0.76f, 0.01f),
                new Vector2(0.96f, 0.12f),
                "Proximo",
                null);

            var homeStep = CreateLabel("HomeStepValue", shellCard.transform, new Vector2(0.04f, 0.72f), new Vector2(0.96f, 0.96f), 12, FontStyle.Bold, TextAnchor.UpperLeft, "4. Policy e shell");
            var policySummary = CreateLabel("PolicySummaryValue", shellCard.transform, new Vector2(0.04f, 0.35f), new Vector2(0.96f, 0.72f), 11, FontStyle.Normal, TextAnchor.UpperLeft, "Policy ativa");
            var entrySummary = CreateLabel("EntrySummaryValue", shellCard.transform, new Vector2(0.04f, 0.14f), new Vector2(0.96f, 0.34f), 11, FontStyle.Normal, TextAnchor.UpperLeft, "Entrada no shell");
            var homeAction = BuildPrimaryButton(shellCard.transform, "EnterHomeButton", new Vector2(0.04f, 0.01f), new Vector2(0.96f, 0.12f), "Abrir experiencia");

            var developmentMinorNameInput = CreateInputField("DevelopmentMinorNameInput", devCard.transform, new Vector2(0.04f, 0.54f), new Vector2(0.96f, 0.96f), "Nome do perfil demo");
            var developmentAdolescentToggle = CreateToggleField("DevelopmentAdolescentToggle", devCard.transform, new Vector2(0.04f, 0.22f), new Vector2(0.96f, 0.5f), "Criar como adolescente (13-17)");
            var devAction = BuildSecondaryButton(
                devCard.transform,
                "FastDevButton",
                new Vector2(0.04f, 0.02f),
                new Vector2(0.96f, 0.18f),
                "Modo dev rapido",
                null,
                new Color(0.48f, 0.84f, 0.67f, 0.94f),
                new Color(0.61f, 0.9f, 0.76f, 0.98f),
                new Color(0.35f, 0.74f, 0.57f, 0.98f));

            var catalogCard = CreatePanel("CatalogCard", actionPanel.transform, new Vector2(0.08f, 0.19f), new Vector2(0.92f, 0.33f), new Color(1f, 1f, 1f, 0.7f));
            CreateLabel("CatalogCardTitle", catalogCard.transform, new Vector2(0.04f, 0.7f), new Vector2(0.96f, 0.96f), 13, FontStyle.Bold, TextAnchor.MiddleLeft, "Interacoes monitoradas");
            var catalog = CreateLabel("CatalogCardValue", catalogCard.transform, new Vector2(0.04f, 0.32f), new Vector2(0.96f, 0.76f), 12, FontStyle.Normal, TextAnchor.UpperLeft, "Interacoes");
            var refreshRoomsAction = BuildSecondaryButton(
                catalogCard.transform,
                "RefreshRoomsButton",
                new Vector2(0.04f, 0.15f),
                new Vector2(0.48f, 0.29f),
                "Atualizar salas",
                null);
            var joinRoomAction = BuildSecondaryButton(
                catalogCard.transform,
                "JoinRoomButton",
                new Vector2(0.52f, 0.15f),
                new Vector2(0.96f, 0.29f),
                "Entrar na sala",
                null);
            var leaveRoomAction = BuildSecondaryButton(
                catalogCard.transform,
                "LeaveRoomButton",
                new Vector2(0.04f, 0.02f),
                new Vector2(0.48f, 0.12f),
                "Sair da sala",
                null);
            var heartbeatAction = BuildSecondaryButton(
                catalogCard.transform,
                "PresenceHeartbeatButton",
                new Vector2(0.52f, 0.02f),
                new Vector2(0.96f, 0.12f),
                "Enviar heartbeat",
                null,
                new Color(0.48f, 0.84f, 0.67f, 0.94f),
                new Color(0.61f, 0.9f, 0.76f, 0.98f),
                new Color(0.35f, 0.74f, 0.57f, 0.98f));

            return new HudViews
            {
                onboardingRoot = onboardingPanel.transform,
                homeRoot = homePanel.transform,
                heroTitle = CreateLabel("HomeTitle", homePanel.transform, new Vector2(0.05f, 0.93f), new Vector2(0.95f, 0.99f), 25, FontStyle.Bold, TextAnchor.MiddleLeft, "Sua home no Leggau"),
                heroBody = CreateLabel("HomeSubtitle", homePanel.transform, new Vector2(0.05f, 0.87f), new Vector2(0.95f, 0.93f), 14, FontStyle.Italic, TextAnchor.UpperLeft, "O shell do menor respeita faixa etaria, policy e o mascote Gau."),
                status = CreateCardLabel("StatusCard", "Status da jornada", actionPanel.transform, new Vector2(0.08f, 0.76f), new Vector2(0.92f, 0.85f), 15, "Status"),
                onboardingTitle = CreateLabel("OnboardingTitle", onboardingPanel.transform, new Vector2(0.06f, 0.91f), new Vector2(0.94f, 0.98f), 24, FontStyle.Bold, TextAnchor.MiddleLeft, "Vamos comecar"),
                onboardingBody = CreateLabel("OnboardingBody", onboardingPanel.transform, new Vector2(0.06f, 0.84f), new Vector2(0.94f, 0.91f), 14, FontStyle.Italic, TextAnchor.UpperLeft, "Ative o responsavel, escolha o menor vinculado e carregue a policy antes do shell."),
                authStep = authStep,
                familyStep = familyStep,
                minorStep = minorStep,
                homeStep = homeStep,
                parent = CreateCardLabel("ParentCard", "Responsavel", homePanel.transform, new Vector2(0.05f, 0.74f), new Vector2(0.95f, 0.86f), 14, "Responsavel"),
                child = CreateCardLabel("ChildCard", "Menor em foco", homePanel.transform, new Vector2(0.05f, 0.61f), new Vector2(0.95f, 0.73f), 14, "Menor"),
                points = CreateCardLabel("PointsCard", "Resumo do shell", homePanel.transform, new Vector2(0.05f, 0.33f), new Vector2(0.95f, 0.44f), 14, "Shell"),
                policy = CreateCardLabel("PolicyCard", "Policy aplicada", homePanel.transform, new Vector2(0.05f, 0.45f), new Vector2(0.95f, 0.6f), 12, "Policy"),
                progress = CreateCardLabel("ProgressCard", "Progresso", homePanel.transform, new Vector2(0.05f, 0.18f), new Vector2(0.95f, 0.32f), 12, "Progresso"),
                activities = CreateCardLabel("ActivitiesCard", "Atividades do dia", homePanel.transform, new Vector2(0.05f, 0.02f), new Vector2(0.48f, 0.17f), 12, "Atividades"),
                rewards = CreateCardLabel("RewardsCard", "Recompensas", homePanel.transform, new Vector2(0.52f, 0.02f), new Vector2(0.95f, 0.17f), 12, "Recompensas"),
                flow = CreateCardLabel("FlowCard", "Checklist da jornada", actionPanel.transform, new Vector2(0.08f, 0.53f), new Vector2(0.92f, 0.74f), 12, "Etapas"),
                gauVariant = CreateCardLabel("GauVariantCard", "Mascote ativo", actionPanel.transform, new Vector2(0.08f, 0.34f), new Vector2(0.92f, 0.51f), 13, "Mascote"),
                catalog = catalog,
                familySummary = familySummary,
                minorSummary = minorSummary,
                policySummary = policySummary,
                entrySummary = entrySummary,
                parentEmailInput = parentEmailInput,
                parentNameInput = parentNameInput,
                passwordInput = passwordInput,
                developmentMinorNameInput = developmentMinorNameInput,
                developmentAdolescentToggle = developmentAdolescentToggle,
                authAction = authAction,
                familyAction = familyAction,
                previousMinorAction = previousMinorAction,
                nextMinorAction = nextMinorAction,
                minorAction = minorAction,
                homeAction = homeAction,
                devAction = devAction,
                refreshRoomsAction = refreshRoomsAction,
                joinRoomAction = joinRoomAction,
                leaveRoomAction = leaveRoomAction,
                heartbeatAction = heartbeatAction,
                actionsRoot = actionPanel.transform,
            };
        }

        private static void BuildHomeActionButton(Transform parent, LeggauAppBootstrap bootstrap)
        {
            var buttonObject = CreateUiObject("CheckinButton", parent);
            var rectTransform = buttonObject.AddComponent<RectTransform>();
            rectTransform.anchorMin = new Vector2(0.08f, 0.12f);
            rectTransform.anchorMax = new Vector2(0.92f, 0.18f);
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

            CreateLabel("CheckinButtonLabel", buttonObject.transform, Vector2.zero, Vector2.one, 16, FontStyle.Bold, TextAnchor.MiddleCenter, "Registrar check-in do dia");
        }

        private static void BuildOnboardingActions(HudViews views, LeggauAppBootstrap bootstrap)
        {
            UnityEventTools.AddPersistentListener(views.authAction.onClick, bootstrap.SubmitResponsibleStep);
            UnityEventTools.AddPersistentListener(views.familyAction.onClick, bootstrap.SubmitConsentStep);
            UnityEventTools.AddPersistentListener(views.previousMinorAction.onClick, bootstrap.SelectPreviousMinor);
            UnityEventTools.AddPersistentListener(views.nextMinorAction.onClick, bootstrap.SelectNextMinor);
            UnityEventTools.AddPersistentListener(views.minorAction.onClick, bootstrap.SubmitChildStep);
            UnityEventTools.AddPersistentListener(views.homeAction.onClick, bootstrap.CompleteHomeStep);
            UnityEventTools.AddPersistentListener(views.devAction.onClick, bootstrap.RunDevelopmentOnboarding);
            UnityEventTools.AddPersistentListener(views.refreshRoomsAction.onClick, bootstrap.RefreshMonitoredInteractions);
            UnityEventTools.AddPersistentListener(views.joinRoomAction.onClick, bootstrap.JoinFirstAvailableRoom);
            UnityEventTools.AddPersistentListener(views.leaveRoomAction.onClick, bootstrap.LeaveActiveRoom);
            UnityEventTools.AddPersistentListener(views.heartbeatAction.onClick, bootstrap.SendPresenceHeartbeat);
        }

        private static Button BuildPrimaryButton(
            Transform parent,
            string name,
            Vector2 anchorMin,
            Vector2 anchorMax,
            string label)
        {
            return BuildSecondaryButton(
                parent,
                name,
                anchorMin,
                anchorMax,
                label,
                null,
                new Color(1f, 0.78f, 0.3f, 0.92f),
                new Color(1f, 0.84f, 0.45f, 0.98f),
                new Color(0.97f, 0.68f, 0.22f, 0.98f));
        }

        private static void BuildVariantControls(Transform parent, LeggauAppBootstrap bootstrap)
        {
            BuildSecondaryButton(
                parent,
                "PrevVariantButton",
                new Vector2(0.08f, 0.02f),
                new Vector2(0.47f, 0.1f),
                "Mascote anterior",
                bootstrap.SelectPreviousGauVariant);

            BuildSecondaryButton(
                parent,
                "NextVariantButton",
                new Vector2(0.53f, 0.02f),
                new Vector2(0.92f, 0.1f),
                "Proximo mascote",
                bootstrap.SelectNextGauVariant);

            BuildSecondaryButton(
                parent,
                "RetryBootstrapButton",
                new Vector2(0.08f, 0.06f),
                new Vector2(0.47f, 0.11f),
                "Atualizar jornada",
                bootstrap.RetryBootstrap,
                new Color(0.48f, 0.84f, 0.67f, 0.94f),
                new Color(0.61f, 0.9f, 0.76f, 0.98f),
                new Color(0.35f, 0.74f, 0.57f, 0.98f));

            BuildSecondaryButton(
                parent,
                "ResetJourneyButton",
                new Vector2(0.53f, 0.06f),
                new Vector2(0.92f, 0.11f),
                "Reiniciar jornada local",
                bootstrap.ResetLocalJourney,
                new Color(0.95f, 0.67f, 0.48f, 0.94f),
                new Color(0.98f, 0.76f, 0.58f, 0.98f),
                new Color(0.89f, 0.56f, 0.35f, 0.98f));
        }

        private static Button BuildSecondaryButton(
            Transform parent,
            string name,
            Vector2 anchorMin,
            Vector2 anchorMax,
            string label,
            UnityEngine.Events.UnityAction action,
            Color? normalColor = null,
            Color? highlightedColor = null,
            Color? pressedColor = null)
        {
            var buttonObject = CreateUiObject(name, parent);
            var rectTransform = buttonObject.AddComponent<RectTransform>();
            rectTransform.anchorMin = anchorMin;
            rectTransform.anchorMax = anchorMax;
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;

            var image = buttonObject.AddComponent<Image>();
            image.color = normalColor ?? new Color(0.42f, 0.72f, 0.98f, 0.92f);

            var button = buttonObject.AddComponent<Button>();
            var colors = button.colors;
            colors.normalColor = image.color;
            colors.highlightedColor = highlightedColor ?? new Color(0.56f, 0.79f, 1f, 0.98f);
            colors.pressedColor = pressedColor ?? new Color(0.29f, 0.61f, 0.87f, 0.98f);
            button.colors = colors;
            if (action != null)
            {
                UnityEventTools.AddPersistentListener(button.onClick, action);
            }

            CreateLabel($"{name}Label", buttonObject.transform, Vector2.zero, Vector2.one, 14, FontStyle.Bold, TextAnchor.MiddleCenter, label);
            return button;
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

        private static GameObject CreatePanel(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, Color color)
        {
            var panelObject = CreateUiObject(name, parent);
            var rectTransform = panelObject.AddComponent<RectTransform>();
            rectTransform.anchorMin = anchorMin;
            rectTransform.anchorMax = anchorMax;
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;

            var image = panelObject.AddComponent<Image>();
            image.color = color;
            return panelObject;
        }

        private static TextValueView CreateCardLabel(
            string name,
            string title,
            Transform parent,
            Vector2 anchorMin,
            Vector2 anchorMax,
            int fontSize,
            string initialText)
        {
            var cardObject = CreatePanel(name, parent, anchorMin, anchorMax, new Color(1f, 1f, 1f, 0.7f));
            CreateLabel($"{name}Title", cardObject.transform, new Vector2(0.04f, 0.7f), new Vector2(0.96f, 0.96f), 13, FontStyle.Bold, TextAnchor.MiddleLeft, title);
            return CreateLabel($"{name}Value", cardObject.transform, new Vector2(0.04f, 0.08f), new Vector2(0.96f, 0.76f), fontSize, FontStyle.Normal, TextAnchor.UpperLeft, initialText);
        }

        private static InputField CreateInputField(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, string placeholder)
        {
            var fieldObject = CreatePanel(name, parent, anchorMin, anchorMax, new Color(0.98f, 0.97f, 0.94f, 0.98f));
            var image = fieldObject.GetComponent<Image>();
            if (image != null)
            {
                image.color = new Color(0.98f, 0.97f, 0.94f, 0.98f);
            }

            var inputField = fieldObject.AddComponent<InputField>();
            var text = CreateLabel($"{name}Text", fieldObject.transform, new Vector2(0.04f, 0.16f), new Vector2(0.96f, 0.84f), 14, FontStyle.Normal, TextAnchor.MiddleLeft, string.Empty);
            var placeholderView = CreateLabel($"{name}Placeholder", fieldObject.transform, new Vector2(0.04f, 0.16f), new Vector2(0.96f, 0.84f), 14, FontStyle.Italic, TextAnchor.MiddleLeft, placeholder);

            inputField.textComponent = text.GetComponent<Text>();
            inputField.placeholder = placeholderView.GetComponent<Text>();
            inputField.lineType = InputField.LineType.SingleLine;
            inputField.text = string.Empty;
            return inputField;
        }

        private static Toggle CreateToggleField(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, string label)
        {
            var toggleObject = CreateUiObject(name, parent);
            var rectTransform = toggleObject.AddComponent<RectTransform>();
            rectTransform.anchorMin = anchorMin;
            rectTransform.anchorMax = anchorMax;
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;

            var background = CreatePanel($"{name}Background", toggleObject.transform, new Vector2(0f, 0f), new Vector2(0.12f, 1f), new Color(1f, 1f, 1f, 0.88f));
            var checkmark = CreatePanel($"{name}Checkmark", background.transform, new Vector2(0.22f, 0.22f), new Vector2(0.78f, 0.78f), new Color(0.31f, 0.72f, 0.49f, 0.98f));
            var labelView = CreateLabel($"{name}Label", toggleObject.transform, new Vector2(0.16f, 0f), new Vector2(1f, 1f), 12, FontStyle.Normal, TextAnchor.MiddleLeft, label);

            var toggle = toggleObject.AddComponent<Toggle>();
            toggle.graphic = checkmark.GetComponent<Image>();
            toggle.targetGraphic = background.GetComponent<Image>();
            checkmark.SetActive(false);
            return toggle;
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
            public Transform onboardingRoot;
            public Transform homeRoot;
            public TextValueView heroTitle;
            public TextValueView heroBody;
            public TextValueView status;
            public TextValueView onboardingTitle;
            public TextValueView onboardingBody;
            public TextValueView authStep;
            public TextValueView familyStep;
            public TextValueView minorStep;
            public TextValueView homeStep;
            public TextValueView parent;
            public TextValueView child;
            public TextValueView policy;
            public TextValueView points;
            public TextValueView progress;
            public TextValueView activities;
            public TextValueView rewards;
            public TextValueView gauVariant;
            public TextValueView catalog;
            public TextValueView flow;
            public TextValueView familySummary;
            public TextValueView minorSummary;
            public TextValueView policySummary;
            public TextValueView entrySummary;
            public InputField parentEmailInput;
            public InputField parentNameInput;
            public InputField passwordInput;
            public InputField developmentMinorNameInput;
            public Toggle developmentAdolescentToggle;
            public Button authAction;
            public Button familyAction;
            public Button previousMinorAction;
            public Button nextMinorAction;
            public Button minorAction;
            public Button homeAction;
            public Button devAction;
            public Button refreshRoomsAction;
            public Button joinRoomAction;
            public Button leaveRoomAction;
            public Button heartbeatAction;
            public Transform actionsRoot;
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
