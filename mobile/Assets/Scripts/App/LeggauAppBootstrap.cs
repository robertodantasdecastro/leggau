using System.Collections;
using Leggau.Config;
using Leggau.Gameplay;
using Leggau.Models;
using Leggau.Networking;
using Leggau.UI;
using UnityEngine;

namespace Leggau.App
{
    public class LeggauAppBootstrap : MonoBehaviour
    {
        private const string AutomatedDevelopmentRunKey = "leggau.bootstrap.automatedDevRun";
        private const string AutomatedDevelopmentModeKey = "leggau.bootstrap.automatedDevRunMode";
        private const string ChildShellMode = "child";
        private const string AdolescentShellMode = "adolescent";
        private const float AutoRoomRefreshIntervalSeconds = 25f;
        private const float AutoRoomRecoveryRefreshIntervalSeconds = 8f;
        private const float AutoPresenceHeartbeatIntervalSeconds = 20f;
        private static bool automatedDevelopmentRunRequested;
        private static string automatedDevelopmentMode = ChildShellMode;

        [SerializeField] private TextAsset environmentAsset;
        [SerializeField] private string environmentRelativePath = "config/dev-api.json";
        [SerializeField] private ApiClient apiClient;
        [SerializeField] private DashboardTextPresenter dashboardPresenter;
        [SerializeField] private GauVariantPreviewPresenter gauVariantPreviewPresenter;

        private readonly LeggauSessionState sessionState = new();
        private AppEnvironment currentEnvironment;
        private bool isBusy;
        private bool environmentReady;
        private bool autoRoomRefreshInFlight;
        private bool autoPresenceHeartbeatInFlight;
        private float nextAutoRoomRefreshAt = -1f;
        private float nextAutoPresenceHeartbeatAt = -1f;

        public static void RequestAutomatedDevelopmentRun(string mode = ChildShellMode)
        {
            automatedDevelopmentRunRequested = true;
            automatedDevelopmentMode = mode == AdolescentShellMode ? AdolescentShellMode : ChildShellMode;
            PlayerPrefs.SetInt(AutomatedDevelopmentRunKey, 1);
            PlayerPrefs.SetString(AutomatedDevelopmentModeKey, automatedDevelopmentMode);
            PlayerPrefs.Save();
        }

        public void Configure(TextAsset environment, string environmentPath, ApiClient client, DashboardTextPresenter presenter, GauVariantPreviewPresenter previewPresenter)
        {
            environmentAsset = environment;
            environmentRelativePath = string.IsNullOrWhiteSpace(environmentPath) ? "config/dev-api.json" : environmentPath;
            apiClient = client;
            dashboardPresenter = presenter;
            gauVariantPreviewPresenter = previewPresenter;
        }

        private void Start()
        {
            StartCoroutine(PrepareBootstrap());
        }

        private void Update()
        {
            if (!ShouldRunRuntimeMonitoring())
            {
                return;
            }

            var now = Time.realtimeSinceStartup;
            PrimeRuntimeMonitoringTimers(now);

            if (!autoRoomRefreshInFlight && now >= nextAutoRoomRefreshAt)
            {
                autoRoomRefreshInFlight = true;
                nextAutoRoomRefreshAt = now + ResolveRoomRefreshDelay();
                StartCoroutine(AutoRefreshMonitoredInteractionsRoutine());
                return;
            }

            if (sessionState.CanAutoHeartbeat && !autoPresenceHeartbeatInFlight && now >= nextAutoPresenceHeartbeatAt)
            {
                autoPresenceHeartbeatInFlight = true;
                nextAutoPresenceHeartbeatAt = now + AutoPresenceHeartbeatIntervalSeconds;
                StartCoroutine(AutoPresenceHeartbeatRoutine());
            }
        }

        public void SubmitResponsibleStep()
        {
            if (isBusy || !environmentReady)
            {
                return;
            }

            StartCoroutine(SubmitResponsibleStepRoutine(false));
        }

        public void SubmitConsentStep()
        {
            if (isBusy || !environmentReady)
            {
                return;
            }

            StartCoroutine(RefreshFamilySelectionRoutine(false));
        }

        public void SelectPreviousMinor()
        {
            if (isBusy || !environmentReady || !sessionState.HasMultipleLinkedMinors)
            {
                return;
            }

            sessionState.SelectPreviousMinor();
            PersistLocalSession();
            RenderSelectionState("Perfil anterior selecionado. Confirme para carregar a policy.");
        }

        public void SelectNextMinor()
        {
            if (isBusy || !environmentReady || !sessionState.HasMultipleLinkedMinors)
            {
                return;
            }

            sessionState.SelectNextMinor();
            PersistLocalSession();
            RenderSelectionState("Proximo perfil selecionado. Confirme para carregar a policy.");
        }

        public void SubmitChildStep()
        {
            if (isBusy || !environmentReady)
            {
                return;
            }

            StartCoroutine(SubmitMinorStepRoutine());
        }

        public void CompleteHomeStep()
        {
            if (isBusy || !environmentReady)
            {
                return;
            }

            StartCoroutine(CompleteHomeStepRoutine());
        }

        public void RefreshMonitoredInteractions()
        {
            if (isBusy || !environmentReady)
            {
                return;
            }

            StartCoroutine(RefreshMonitoredInteractionsRoutine(true, false));
        }

        public void JoinFirstAvailableRoom()
        {
            if (isBusy || !environmentReady)
            {
                return;
            }

            StartCoroutine(JoinFirstAvailableRoomRoutine());
        }

        public void LeaveActiveRoom()
        {
            if (isBusy || !environmentReady)
            {
                return;
            }

            StartCoroutine(LeaveActiveRoomRoutine());
        }

        public void SendPresenceHeartbeat()
        {
            if (isBusy || !environmentReady)
            {
                return;
            }

            StartCoroutine(SendPresenceHeartbeatRoutine(true));
        }

        public void RunDevelopmentOnboarding()
        {
            if (isBusy || !environmentReady)
            {
                return;
            }

            StartCoroutine(RunDevelopmentOnboardingRoutine(
                sessionState.DraftCreateAdolescent ? AdolescentShellMode : ChildShellMode));
        }

        public void RetryBootstrap()
        {
            if (isBusy)
            {
                return;
            }

            StartCoroutine(PrepareBootstrap());
        }

        public void ResetLocalJourney()
        {
            if (isBusy)
            {
                return;
            }

            LeggauLocalSessionStore.Clear();
            apiClient?.ClearAccessToken();
            sessionState.ResetForBootstrap();
            ResetRuntimeMonitoringTimers();
            dashboardPresenter?.SetStatus("Jornada local limpa. Reiniciando a ativacao do shell...");
            StartCoroutine(PrepareBootstrap());
        }

        public void DevCheckinFirstActivity()
        {
            if (isBusy)
            {
                return;
            }

            StartCoroutine(DevCheckinFirstActivityRoutine());
        }

        public void SelectNextGauVariant()
        {
            sessionState.SelectNextGauVariant();
            PersistLocalSession();
            if (sessionState.HomeReady)
            {
                dashboardPresenter?.Render(sessionState);
            }
            else
            {
                dashboardPresenter?.RenderLoadingState(sessionState, "Mascote atualizado para a proxima abertura do shell.");
            }

            dashboardPresenter?.SyncOnboardingControls(sessionState, isBusy);
            gauVariantPreviewPresenter?.ShowVariant(sessionState.ActiveGauVariant);
            dashboardPresenter?.SetStatus($"Mascote ativo: {sessionState.ActiveGauVariant?.displayName ?? "-"}");
        }

        public void SelectPreviousGauVariant()
        {
            sessionState.SelectPreviousGauVariant();
            PersistLocalSession();
            if (sessionState.HomeReady)
            {
                dashboardPresenter?.Render(sessionState);
            }
            else
            {
                dashboardPresenter?.RenderLoadingState(sessionState, "Mascote atualizado para a proxima abertura do shell.");
            }

            dashboardPresenter?.SyncOnboardingControls(sessionState, isBusy);
            gauVariantPreviewPresenter?.ShowVariant(sessionState.ActiveGauVariant);
            dashboardPresenter?.SetStatus($"Mascote ativo: {sessionState.ActiveGauVariant?.displayName ?? "-"}");
        }

        private IEnumerator PrepareBootstrap()
        {
            if (isBusy)
            {
                yield break;
            }

            isBusy = true;
            environmentReady = false;
            apiClient?.ClearAccessToken();
            sessionState.ResetForBootstrap();
            ResetRuntimeMonitoringTimers();
            dashboardPresenter?.ResetFlow();
            dashboardPresenter?.SetHero("Ativando a experiencia do menor", "O shell do menor abre por sessao do responsavel, escolha do perfil e leitura da policy.");
            dashboardPresenter?.RenderLoadingState(sessionState, "Carregando ambiente...");

            currentEnvironment = environmentAsset != null
                ? AppEnvironmentLoader.Load(environmentAsset)
                : AppEnvironmentLoader.LoadFromStreamingAssets(environmentRelativePath);

            apiClient.SetBaseUrls(currentEnvironment.apiBaseUrl, currentEnvironment.fallbackApiBaseUrl);
            TryLoadLocalGauCatalog();

            var automatedMode = ConsumeAutomatedDevelopmentRunMode();
            var restoredSession = false;

            if (!string.IsNullOrWhiteSpace(automatedMode))
            {
                LeggauLocalSessionStore.Clear();
                sessionState.ResetForBootstrap();
                apiClient?.ClearAccessToken();
                ResetRuntimeMonitoringTimers();
                ApplyDevelopmentDefaults(currentEnvironment, automatedMode);
            }
            else
            {
                restoredSession = TryRestoreLocalSession();
                if (!restoredSession)
                {
                    ApplyDevelopmentDefaults(currentEnvironment, ChildShellMode);
                }
            }

            if (sessionState.IsAuthenticated)
            {
                apiClient.SetAccessToken(sessionState.AccessToken);
            }

            SyncFlowFromSession();

            if (restoredSession)
            {
                dashboardPresenter?.SetHero("Bem-vindo de volta", "Retomando a sessao do responsavel, o menor salvo e o shell mais adequado.");
                dashboardPresenter?.RenderLoadingState(sessionState, BuildResumeStatus());
            }
            else
            {
                dashboardPresenter?.SetHero("Ative o responsavel", "Entre com a conta adulta, carregue os perfis vinculados e so entao abra o shell infantil ou adolescente.");
                dashboardPresenter?.RenderLoadingState(sessionState, $"Conectado a {apiClient.ActiveBaseUrl}. Aguardando a ativacao do responsavel.");
            }

            environmentReady = true;
            isBusy = false;
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
            PersistLocalSession();

            if (restoredSession)
            {
                if (sessionState.HomeReady && sessionState.SelectedMinor != null)
                {
                    StartCoroutine(ResumePersistedHomeRoutine());
                    yield break;
                }

                if (sessionState.IsAuthenticated)
                {
                    StartCoroutine(ResumePersistedOnboardingRoutine());
                    yield break;
                }
            }

            if (!string.IsNullOrWhiteSpace(automatedMode))
            {
                StartCoroutine(RunDevelopmentOnboardingRoutine(automatedMode));
            }
        }

        private void OnApplicationPause(bool pauseStatus)
        {
            if (!pauseStatus)
            {
                return;
            }

            dashboardPresenter?.ReadOnboardingDrafts(sessionState);
            PersistLocalSession();
        }

        private void OnApplicationQuit()
        {
            dashboardPresenter?.ReadOnboardingDrafts(sessionState);
            PersistLocalSession();
        }

        private static string ConsumeAutomatedDevelopmentRunMode()
        {
            var shouldRun = automatedDevelopmentRunRequested || PlayerPrefs.GetInt(AutomatedDevelopmentRunKey, 0) == 1;
            if (!shouldRun)
            {
                return string.Empty;
            }

            var mode = automatedDevelopmentMode;
            var storedMode = PlayerPrefs.GetString(AutomatedDevelopmentModeKey, mode);
            automatedDevelopmentRunRequested = false;
            automatedDevelopmentMode = ChildShellMode;
            PlayerPrefs.DeleteKey(AutomatedDevelopmentRunKey);
            PlayerPrefs.DeleteKey(AutomatedDevelopmentModeKey);
            PlayerPrefs.Save();
            return storedMode == AdolescentShellMode ? AdolescentShellMode : ChildShellMode;
        }

        private IEnumerator SubmitResponsibleStepRoutine(bool allowDevFallback)
        {
            dashboardPresenter?.ReadOnboardingDrafts(sessionState);
            PersistLocalSession();

            if (string.IsNullOrWhiteSpace(sessionState.DraftParentEmail) ||
                string.IsNullOrWhiteSpace(sessionState.DraftParentName) ||
                string.IsNullOrWhiteSpace(sessionState.DraftPassword))
            {
                dashboardPresenter?.SetError("Preencha email, nome e senha do responsavel para continuar.");
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SyncOnboardingControls(sessionState, true);
            dashboardPresenter?.SetHero("Ativando o responsavel", "Tentando registro ou login para carregar os menores vinculados.");
            dashboardPresenter?.MarkFlowLoading("Auth", "registro/login");
            dashboardPresenter?.RenderLoadingState(sessionState, "Autenticando responsavel...");

            var requestFailed = false;
            yield return AuthenticateWithRealAuth(allowDevFallback, value => requestFailed = value);

            if (requestFailed || !sessionState.IsAuthenticated)
            {
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            apiClient.SetAccessToken(sessionState.AccessToken);
            dashboardPresenter?.MarkFlowDone("Auth", sessionState.UsedDevLoginFallback ? "login dev" : "sessao ativa");
            yield return RefreshFamilySelectionRoutine(true);
        }

        private IEnumerator RefreshFamilySelectionRoutine(bool triggeredByAuth)
        {
            if (!sessionState.IsAuthenticated)
            {
                dashboardPresenter?.SetError("Ative o responsavel antes de carregar os perfis vinculados.");
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SyncOnboardingControls(sessionState, true);
            dashboardPresenter?.SetHero("Carregando os menores vinculados", "A familia vem da vm2 e passa a governar a entrada no shell.");
            dashboardPresenter?.MarkFlowLoading("Familia", "overview");
            dashboardPresenter?.RenderLoadingState(sessionState, $"Carregando familia via {apiClient.ActiveBaseUrl}...");

            var requestFailed = false;
            yield return LoadFamilyOverview(value => requestFailed = value);

            if (requestFailed)
            {
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            if (sessionState.HasLinkedMinors)
            {
                dashboardPresenter?.MarkFlowDone("Familia", $"{sessionState.LinkedMinors.Length} perfil(is)");
            }
            else
            {
                dashboardPresenter?.MarkFlowDone("Familia", "sem menores");
            }

            if (!sessionState.HasLinkedMinors)
            {
                dashboardPresenter?.SetHero("Nenhum menor vinculado", "A superficie /pais continua sendo o caminho canonico para provisionar perfis. No editor, o atalho dev pode criar um perfil de teste.");
                dashboardPresenter?.RenderLoadingState(sessionState, "Sem menores ativos. Use /pais ou o atalho dev para criar um perfil demo.");
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                PersistLocalSession();
                yield break;
            }

            dashboardPresenter?.MarkFlowDone("Menor", sessionState.SelectedMinor != null
                ? $"{sessionState.SelectedMinor.name} em foco"
                : "escolha pendente");

            if (sessionState.LinkedMinors.Length == 1 || sessionState.SelectedMinorPolicy != null)
            {
                yield return EnsureSelectedMinorPolicyLoaded(value => requestFailed = value);
                if (requestFailed)
                {
                    isBusy = false;
                    dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                    yield break;
                }
            }

            dashboardPresenter?.SetHero(
                sessionState.SelectedMinorPolicy != null
                    ? $"Shell pronta para {sessionState.SelectedMinor.name}"
                    : "Escolha o menor certo",
                sessionState.SelectedMinorPolicy != null
                    ? $"A policy de {sessionState.SelectedMinor.name} ja foi carregada. Falta entrar na home."
                    : "Selecione o menor vinculado e confirme o perfil que deve abrir o app.");
            dashboardPresenter?.RenderLoadingState(sessionState, BuildSelectionStatus(triggeredByAuth));
            isBusy = false;
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
            PersistLocalSession();
        }

        private IEnumerator SubmitMinorStepRoutine()
        {
            if (!sessionState.IsAuthenticated)
            {
                dashboardPresenter?.SetError("Ative a conta do responsavel antes de escolher o menor.");
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            if (sessionState.SelectedMinor == null)
            {
                dashboardPresenter?.SetError("Nenhum menor foi selecionado para continuar.");
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SyncOnboardingControls(sessionState, true);
            dashboardPresenter?.SetHero("Carregando a policy do menor", "A policy da vm2 define o shell, a faixa etaria efetiva e o que deve permanecer escondido.");
            dashboardPresenter?.MarkFlowLoading("Menor", sessionState.SelectedMinor.name);
            dashboardPresenter?.MarkFlowLoading("Politica", "carregando policy");
            dashboardPresenter?.RenderLoadingState(sessionState, $"Lendo policy para {sessionState.SelectedMinor.name}...");

            var requestFailed = false;
            yield return EnsureSelectedMinorPolicyLoaded(value => requestFailed = value);

            if (requestFailed)
            {
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            dashboardPresenter?.SetHero(
                sessionState.ActiveShell == AdolescentShellMode ? "Shell adolescente pronta" : "Shell infantil pronta",
                $"Policy confirmada para {sessionState.SelectedMinor.name} em {sessionState.ResolvedAgeBand}. Agora a home pode ser carregada.");
            dashboardPresenter?.RenderLoadingState(sessionState, $"{sessionState.SelectedMinor.name} pronta(o) em {sessionState.ResolvedAgeBand}. Abra a experiencia.");
            isBusy = false;
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
            PersistLocalSession();
        }

        private IEnumerator CompleteHomeStepRoutine()
        {
            if (sessionState.SelectedMinor == null)
            {
                dashboardPresenter?.SetError("Escolha o menor antes de entrar na home.");
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            if (sessionState.SelectedMinorPolicy == null)
            {
                dashboardPresenter?.SetError("Carregue a policy do menor antes de abrir o shell.");
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SyncOnboardingControls(sessionState, true);
            dashboardPresenter?.SetHero(
                sessionState.ActiveShell == AdolescentShellMode ? "Abrindo shell adolescente" : "Abrindo shell infantil",
                BuildShellOpeningCopy());
            dashboardPresenter?.MarkFlowLoading("Atividades", "catalogo do dia");
            dashboardPresenter?.RenderLoadingState(sessionState, "Carregando atividades...");

            var requestFailed = false;
            yield return apiClient.GetJson(
                "activities",
                response =>
                {
                    var activities = JsonUtility.FromJson<ActivitiesResponse>(response);
                    sessionState.SetActivities(activities.items);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.MarkFlowFailed("Atividades", "erro");
                    dashboardPresenter?.SetError($"Falha ao carregar atividades: {error}");
                });

            if (requestFailed)
            {
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            dashboardPresenter?.MarkFlowDone("Atividades", "atividades prontas");
            dashboardPresenter?.RenderLoadingState(sessionState, "Carregando catalogo 3D...");

            yield return apiClient.GetJson(
                "assets-catalog",
                response =>
                {
                    var catalog = JsonUtility.FromJson<AssetsCatalogResponse>(response);
                    sessionState.SetAssetsCatalog(catalog);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao carregar catalogo: {error}");
                });

            if (requestFailed)
            {
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            dashboardPresenter?.MarkFlowLoading("Recompensas", "saldo e premios");
            dashboardPresenter?.RenderLoadingState(sessionState, "Carregando recompensas...");

            yield return apiClient.GetJson(
                $"rewards?childId={sessionState.SelectedMinor.id}",
                response =>
                {
                    var rewards = JsonUtility.FromJson<RewardsResponse>(response);
                    sessionState.SetRewards(rewards.items, rewards.availablePoints);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.MarkFlowFailed("Recompensas", "erro");
                    dashboardPresenter?.SetError($"Falha ao carregar recompensas: {error}");
                });

            if (requestFailed)
            {
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            dashboardPresenter?.MarkFlowDone("Recompensas", "saldo pronto");
            dashboardPresenter?.MarkFlowLoading("Progresso", "resumo do menor");
            yield return LoadProgressSummary();

            if (!isBusy)
            {
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            yield return RefreshMonitoredInteractionsRoutine(false, true);

            sessionState.SetHomeReady(true);
            PrimeRuntimeMonitoringTimers(Time.realtimeSinceStartup);
            dashboardPresenter?.MarkFlowDone("Progresso", "shell pronta");
            dashboardPresenter?.SetHero(
                sessionState.ActiveShell == AdolescentShellMode ? "Shell adolescente carregada" : "Shell infantil carregada",
                "Atividades, recompensas, progresso e Gau foram atualizados na vm2 para este menor.");
            dashboardPresenter?.Render(sessionState);
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
            gauVariantPreviewPresenter?.ShowVariant(sessionState.ActiveGauVariant);
            isBusy = false;
            PersistLocalSession();
        }

        private IEnumerator RunDevelopmentOnboardingRoutine(string targetShell)
        {
            var normalizedShell = targetShell == AdolescentShellMode ? AdolescentShellMode : ChildShellMode;
            EnsureDevelopmentDrafts(normalizedShell);

            if (!sessionState.IsAuthenticated)
            {
                yield return SubmitResponsibleStepRoutine(currentEnvironment != null && currentEnvironment.allowDevLoginFallback);
                if (!sessionState.IsAuthenticated)
                {
                    yield break;
                }
            }

            if (!sessionState.HasLinkedMinors || FindMinorByRole(normalizedShell) == null)
            {
                var requestFailed = false;
                yield return EnsureProvisioningRequirementsForDevelopment(value => requestFailed = value);
                if (requestFailed)
                {
                    yield break;
                }

                yield return CreateDevelopmentMinorRoutine(normalizedShell, value => requestFailed = value);
                if (requestFailed)
                {
                    yield break;
                }
            }

            var targetMinor = FindMinorByRole(normalizedShell) ?? sessionState.SelectedMinor;
            sessionState.SelectMinorById(targetMinor?.id);
            PersistLocalSession();

            if (sessionState.SelectedMinorPolicy == null || sessionState.SelectedMinor?.id != targetMinor?.id)
            {
                yield return SubmitMinorStepRoutine();
                if (sessionState.SelectedMinorPolicy == null)
                {
                    yield break;
                }
            }

            if (!sessionState.HomeReady)
            {
                yield return CompleteHomeStepRoutine();
            }
        }

        private IEnumerator AuthenticateWithRealAuth(bool allowDevFallback, System.Action<bool> setFailed)
        {
            var registerSucceeded = false;
            var shouldTryLogin = false;
            string authError = null;

            var registerRequest = new RegisterRequest
            {
                email = sessionState.DraftParentEmail,
                password = sessionState.DraftPassword,
                displayName = sessionState.DraftParentName,
            };

            yield return apiClient.PostJson(
                "auth/register",
                JsonUtility.ToJson(registerRequest),
                response =>
                {
                    var session = JsonUtility.FromJson<AuthSessionResponse>(response);
                    sessionState.SetAuthSession(session);
                    registerSucceeded = true;
                },
                error =>
                {
                    authError = error;
                    shouldTryLogin = error != null && (error.Contains("409") || error.Contains("already exists"));
                });

            if (!registerSucceeded && shouldTryLogin)
            {
                var loginRequest = new LoginRequest
                {
                    email = sessionState.DraftParentEmail,
                    password = sessionState.DraftPassword,
                };

                yield return apiClient.PostJson(
                    "auth/login",
                    JsonUtility.ToJson(loginRequest),
                    response =>
                    {
                        var session = JsonUtility.FromJson<AuthSessionResponse>(response);
                        sessionState.SetAuthSession(session);
                        registerSucceeded = true;
                        authError = null;
                    },
                    error => authError = error);
            }

            if (registerSucceeded)
            {
                apiClient.SetAccessToken(sessionState.AccessToken);
                PersistLocalSession();
                setFailed?.Invoke(false);
                yield break;
            }

            if (allowDevFallback && currentEnvironment != null && currentEnvironment.allowDevLoginFallback)
            {
                dashboardPresenter?.SetStatus("Auth real indisponivel, usando login dev para continuar a validacao do shell.");
                dashboardPresenter?.MarkFlowLoading("Auth", "fallback dev");
                yield return AuthenticateWithDevLogin(setFailed);
                yield break;
            }

            setFailed?.Invoke(true);
            dashboardPresenter?.MarkFlowFailed("Auth", "falha");
            dashboardPresenter?.SetError($"Falha na autenticacao real: {authError}");
        }

        private IEnumerator AuthenticateWithDevLogin(System.Action<bool> setFailed)
        {
            var requestFailed = false;
            var loginRequest = new DevLoginRequest
            {
                email = string.IsNullOrWhiteSpace(sessionState.DraftParentEmail) ? currentEnvironment.devLoginEmail : sessionState.DraftParentEmail,
                name = string.IsNullOrWhiteSpace(sessionState.DraftParentName) ? currentEnvironment.devLoginName : sessionState.DraftParentName,
            };

            yield return apiClient.PostJson(
                "auth/dev-login",
                JsonUtility.ToJson(loginRequest),
                response =>
                {
                    var login = JsonUtility.FromJson<DevLoginResponse>(response);
                    sessionState.SetDevLogin(login);
                    apiClient.SetAccessToken(sessionState.AccessToken);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.MarkFlowFailed("Auth", "dev indisponivel");
                    dashboardPresenter?.SetError($"Falha no login dev: {error}");
                });

            if (requestFailed)
            {
                setFailed?.Invoke(true);
                yield break;
            }

            dashboardPresenter?.MarkFlowDone("Auth", "login dev");
            PersistLocalSession();
            setFailed?.Invoke(false);
        }

        private IEnumerator LoadLegalDocumentsOnly(System.Action<bool> setFailed)
        {
            var requestFailed = false;

            yield return apiClient.GetJson(
                "legal/documents",
                response =>
                {
                    var wrapped = $"{{\"items\":{response}}}";
                    var documents = JsonUtility.FromJson<LegalDocumentsEnvelope>(wrapped);
                    sessionState.SetLegalDocuments(documents?.items);
                    sessionState.SetDraftConsentsAccepted(false);
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao carregar documentos legais: {error}");
                });

            setFailed?.Invoke(requestFailed);
        }

        private IEnumerator RecordLegalConsents(System.Action<bool> setFailed)
        {
            var requestFailed = false;
            var currentUserEmail = sessionState.CurrentUserEmail;
            if (string.IsNullOrWhiteSpace(currentUserEmail))
            {
                setFailed?.Invoke(true);
                dashboardPresenter?.SetError("Nao foi possivel registrar consentimentos sem email do responsavel.");
                yield break;
            }

            foreach (var document in sessionState.LegalDocuments)
            {
                if (document == null || string.IsNullOrWhiteSpace(document.key))
                {
                    continue;
                }

                var request = new RecordConsentRequest
                {
                    userEmail = currentUserEmail,
                    documentKey = document.key,
                };

                yield return apiClient.PostJson(
                    "legal/consents",
                    JsonUtility.ToJson(request),
                    _ => sessionState.MarkConsentsRecorded(),
                    error =>
                    {
                        requestFailed = true;
                        dashboardPresenter?.SetError($"Falha ao registrar consentimento: {error}");
                    });

                if (requestFailed)
                {
                    setFailed?.Invoke(true);
                    yield break;
                }
            }

            setFailed?.Invoke(false);
        }

        private IEnumerator LoadFamilyOverview(System.Action<bool> setFailed)
        {
            var requestFailed = false;

            yield return apiClient.GetJson(
                $"families/overview?email={sessionState.CurrentUserEmail}",
                response =>
                {
                    var family = JsonUtility.FromJson<FamilyOverviewResponse>(response);
                    sessionState.SetFamily(family);
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.MarkFlowFailed("Familia", "erro");
                    dashboardPresenter?.SetError($"Falha ao carregar familia: {error}");
                });

            setFailed?.Invoke(requestFailed);
        }

        private IEnumerator EnsureSelectedMinorPolicyLoaded(System.Action<bool> setFailed)
        {
            if (sessionState.SelectedMinor == null)
            {
                setFailed?.Invoke(true);
                dashboardPresenter?.MarkFlowFailed("Menor", "sem perfil");
                dashboardPresenter?.SetError("Nenhum menor foi selecionado para carregar a policy.");
                yield break;
            }

            if (sessionState.SelectedMinorPolicy != null)
            {
                dashboardPresenter?.MarkFlowDone("Menor", sessionState.SelectedMinor.name);
                dashboardPresenter?.MarkFlowDone("Politica", $"{sessionState.ResolvedAgeBand} · {sessionState.ActiveShell}");
                setFailed?.Invoke(false);
                yield break;
            }

            var requestFailed = false;

            yield return apiClient.GetJson(
                $"interaction-policies/{sessionState.SelectedMinor.id}",
                response =>
                {
                    var policy = JsonUtility.FromJson<InteractionPolicyRecord>(response);
                    sessionState.SetSelectedMinorPolicy(policy);
                    ApplyRecognizedGuardianOverride(policy);
                    dashboardPresenter?.MarkFlowDone("Menor", sessionState.SelectedMinor.name);
                    dashboardPresenter?.MarkFlowDone("Politica", $"{sessionState.ResolvedAgeBand} · {sessionState.ActiveShell}");
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.MarkFlowFailed("Politica", "erro");
                    if (IsSessionError(error))
                    {
                        HandleExpiredSession("Sua sessao expirou antes de carregar a policy do menor.");
                    }
                    else
                    {
                        dashboardPresenter?.SetError($"Falha ao carregar a policy do menor: {error}");
                    }
                });

            setFailed?.Invoke(requestFailed);
        }

        private IEnumerator CreateDevelopmentMinorRoutine(string targetShell, System.Action<bool> setFailed)
        {
            var parentEmail = sessionState.CurrentUserEmail;
            if (string.IsNullOrWhiteSpace(parentEmail))
            {
                setFailed?.Invoke(true);
                dashboardPresenter?.SetError("Nao foi possivel criar o perfil demo sem o email do responsavel.");
                yield break;
            }

            dashboardPresenter?.SetHero("Criando perfil demo", "Somente para desenvolvimento: criando um menor novo quando a conta ainda nao tem o perfil desejado.");
            dashboardPresenter?.RenderLoadingState(sessionState, "Criando perfil demo...");

            var requestFailed = false;
            var createAdolescent = targetShell == AdolescentShellMode;
            var request = new CreateChildRequest
            {
                parentEmail = parentEmail,
                name = string.IsNullOrWhiteSpace(sessionState.DraftChildName)
                    ? (createAdolescent ? "Gau Teen" : "Gau")
                    : sessionState.DraftChildName,
                age = createAdolescent ? 13 : 6,
                avatar = sessionState.ActiveGauVariant?.id ?? "gau-rounded-pixel",
            };

            yield return apiClient.PostJson(
                "children",
                JsonUtility.ToJson(request),
                response =>
                {
                    var minor = JsonUtility.FromJson<ChildProfile>(response);
                    sessionState.SetActiveChild(minor);
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao criar perfil demo: {error}");
                });

            if (requestFailed)
            {
                setFailed?.Invoke(true);
                yield break;
            }

            yield return LoadFamilyOverview(value => requestFailed = value);
            if (requestFailed)
            {
                setFailed?.Invoke(true);
                yield break;
            }

            var createdMinor = FindMinorByRole(targetShell) ?? sessionState.SelectedMinor;
            sessionState.SelectMinorById(createdMinor?.id);
            PersistLocalSession();
            setFailed?.Invoke(false);
        }

        private IEnumerator DevCheckinFirstActivityRoutine()
        {
            if (sessionState.SelectedMinor == null || sessionState.Activities == null || sessionState.Activities.Length == 0)
            {
                dashboardPresenter?.SetError("Nenhuma atividade pronta para check-in.");
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SyncOnboardingControls(sessionState, true);
            dashboardPresenter?.SetStatus("Registrando check-in de desenvolvimento...");

            var request = new CreateCheckinRequest
            {
                childId = sessionState.SelectedMinor.id,
                activityId = sessionState.Activities[0].id,
                notes = "Check-in automatico do shell bootstrap",
            };

            var requestFailed = false;

            yield return apiClient.PostJson(
                "progress/checkins",
                JsonUtility.ToJson(request),
                response =>
                {
                    var result = JsonUtility.FromJson<CreateCheckinResponse>(response);
                    sessionState.ApplyCheckin(result);
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao registrar check-in: {error}");
                });

            if (requestFailed)
            {
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            yield return apiClient.GetJson(
                $"rewards?childId={sessionState.SelectedMinor.id}",
                response =>
                {
                    var rewards = JsonUtility.FromJson<RewardsResponse>(response);
                    sessionState.SetRewards(rewards.items, rewards.availablePoints);
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.MarkFlowFailed("Recompensas", "erro");
                    dashboardPresenter?.SetError($"Falha ao atualizar recompensas: {error}");
                });

            if (requestFailed)
            {
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            yield return LoadProgressSummary();
            dashboardPresenter?.Render(sessionState);
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
            dashboardPresenter?.SetStatus($"Check-in concluido via {apiClient.ActiveBaseUrl}.");
            isBusy = false;
        }

        private IEnumerator RefreshMonitoredInteractionsRoutine(bool manageBusyState, bool nonBlocking)
        {
            if (sessionState.SelectedMinor == null || sessionState.SelectedMinorPolicy == null)
            {
                if (!nonBlocking)
                {
                    dashboardPresenter?.SetStatus("Carregue o menor e a policy antes de atualizar salas monitoradas.");
                }
                yield break;
            }

            if (!sessionState.SelectedMinorPolicy.roomsEnabled)
            {
                sessionState.SetMonitoredRooms(new MonitoredRoomsEnvelope
                {
                    allowed = false,
                    reason = "Salas estruturadas bloqueadas pela policy deste menor.",
                    presenceEnabled = sessionState.SelectedMinorPolicy.presenceEnabled,
                    activeRoomId = null,
                    items = new MonitoredRoomRecord[0],
                });
                sessionState.ClearActiveRoom();
                PersistLocalSession();
                if (sessionState.HomeReady)
                {
                    dashboardPresenter?.Render(sessionState);
                }
                else
                {
                    dashboardPresenter?.RenderLoadingState(sessionState, "A policy atual bloqueia salas estruturadas.");
                }
                yield break;
            }

            if (manageBusyState)
            {
                isBusy = true;
                dashboardPresenter?.SyncOnboardingControls(sessionState, true);
                dashboardPresenter?.SetStatus("Atualizando salas monitoradas...");
            }

            var requestFailed = false;
            yield return apiClient.GetJson(
                $"rooms?minorProfileId={sessionState.SelectedMinor.id}",
                response =>
                {
                    var rooms = JsonUtility.FromJson<MonitoredRoomsEnvelope>(response);
                    sessionState.SetMonitoredRooms(rooms);
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    sessionState.SetMonitoredRooms(new MonitoredRoomsEnvelope
                    {
                        allowed = false,
                        reason = "Nao foi possivel atualizar as salas monitoradas agora.",
                        presenceEnabled = sessionState.SelectedMinorPolicy?.presenceEnabled ?? false,
                        activeRoomId = null,
                        items = new MonitoredRoomRecord[0],
                    });
                    if (!nonBlocking)
                    {
                        dashboardPresenter?.SetStatus($"Falha ao atualizar salas: {error}");
                    }
                });

            if (!requestFailed &&
                sessionState.ActiveRoom != null &&
                sessionState.SelectedMinorPolicy != null &&
                sessionState.SelectedMinorPolicy.presenceEnabled)
            {
                yield return LoadPresenceState(sessionState.ActiveRoom.id, true, nonBlocking);
            }

            PrimeRuntimeMonitoringTimers(Time.realtimeSinceStartup);
            PersistLocalSession();
            if (sessionState.HomeReady)
            {
                dashboardPresenter?.Render(sessionState);
                if (nonBlocking)
                {
                    var lifecycleStatus = sessionState.ResolveLifecycleHeadline();
                    var lifecycleMessage = sessionState.ResolveLifecycleMessage();
                    dashboardPresenter?.SetStatus(string.IsNullOrWhiteSpace(lifecycleMessage)
                        ? lifecycleStatus
                        : $"{lifecycleStatus} - {lifecycleMessage}");
                }
            }
            else if (!nonBlocking)
            {
                dashboardPresenter?.RenderLoadingState(sessionState, sessionState.RoomCatalogMessage);
            }

            if (!requestFailed && !nonBlocking)
            {
                dashboardPresenter?.SetStatus(sessionState.RoomsAllowed
                    ? $"Salas monitoradas atualizadas via {apiClient.ActiveBaseUrl}."
                    : ResolveRuntimeBlockedMessage());
            }

            if (manageBusyState)
            {
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
            }
        }

        private IEnumerator JoinFirstAvailableRoomRoutine()
        {
            if (sessionState.SelectedMinor == null || sessionState.SelectedMinorPolicy == null)
            {
                dashboardPresenter?.SetStatus("Selecione o menor e carregue a policy antes de entrar em uma sala.");
                yield break;
            }

            if (!sessionState.SelectedMinorPolicy.roomsEnabled)
            {
                dashboardPresenter?.SetStatus("A policy atual bloqueia salas estruturadas para este menor.");
                yield break;
            }

            if (!sessionState.RoomsAllowed)
            {
                dashboardPresenter?.SetStatus(ResolveRuntimeBlockedMessage());
                yield break;
            }

            if (!sessionState.HasAvailableRooms)
            {
                yield return RefreshMonitoredInteractionsRoutine(true, false);
                if (!sessionState.HasAvailableRooms)
                {
                    dashboardPresenter?.SetStatus(ResolveRuntimeBlockedMessage());
                    yield break;
                }
            }

            var targetRoom = sessionState.ActiveRoom ?? sessionState.AvailableRooms[0];
            if (targetRoom == null)
            {
                dashboardPresenter?.SetStatus("Nenhuma sala monitorada esta disponivel neste shell.");
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SyncOnboardingControls(sessionState, true);
            dashboardPresenter?.SetStatus($"Entrando em {targetRoom.title}...");

            var requestFailed = false;
            var request = new RoomActionRequest
            {
                minorProfileId = sessionState.SelectedMinor.id,
                activeShell = sessionState.ActiveShell,
            };

            yield return apiClient.PostJson(
                $"rooms/{targetRoom.id}/join",
                JsonUtility.ToJson(request),
                response =>
                {
                    var payload = JsonUtility.FromJson<RoomActionResponse>(response);
                    sessionState.SetActiveRoom(payload.room);
                    sessionState.SetPresenceState(payload.presence);
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetStatus($"Falha ao entrar na sala: {error}");
                });

            if (!requestFailed && sessionState.SelectedMinorPolicy.presenceEnabled && sessionState.ActiveRoom != null)
            {
                yield return LoadPresenceState(sessionState.ActiveRoom.id, false, false);
            }

            if (!requestFailed)
            {
                PrimeRuntimeMonitoringTimers(Time.realtimeSinceStartup);
                dashboardPresenter?.Render(sessionState);
                dashboardPresenter?.SetStatus($"Sala ativa: {sessionState.ActiveRoom?.title ?? targetRoom.title}.");
            }

            isBusy = false;
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
        }

        private IEnumerator LeaveActiveRoomRoutine()
        {
            if (sessionState.ActiveRoom == null || sessionState.SelectedMinor == null)
            {
                dashboardPresenter?.SetStatus("Nenhuma sala ativa para encerrar agora.");
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SyncOnboardingControls(sessionState, true);
            dashboardPresenter?.SetStatus($"Saindo de {sessionState.ActiveRoom.title}...");

            var requestFailed = false;
            var request = new RoomActionRequest
            {
                minorProfileId = sessionState.SelectedMinor.id,
                activeShell = sessionState.ActiveShell,
            };

            var activeRoomId = sessionState.ActiveRoom.id;
            yield return apiClient.PostJson(
                $"rooms/{activeRoomId}/leave",
                JsonUtility.ToJson(request),
                response =>
                {
                    var payload = JsonUtility.FromJson<RoomActionResponse>(response);
                    sessionState.SetPresenceState(payload.presence);
                    sessionState.ClearActiveRoom();
                    ResetRuntimeMonitoringTimers();
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetStatus($"Falha ao sair da sala: {error}");
                });

            if (!requestFailed)
            {
                dashboardPresenter?.Render(sessionState);
                dashboardPresenter?.SetStatus("Sala monitorada encerrada.");
            }

            isBusy = false;
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
        }

        private IEnumerator SendPresenceHeartbeatRoutine(bool manualTrigger)
        {
            if (sessionState.ActiveRoom == null || sessionState.SelectedMinor == null)
            {
                dashboardPresenter?.SetStatus("Entre em uma sala antes de enviar heartbeat.");
                yield break;
            }

            if (sessionState.SelectedMinorPolicy == null || !sessionState.SelectedMinorPolicy.presenceEnabled)
            {
                dashboardPresenter?.SetStatus(ResolveRuntimeBlockedMessage());
                yield break;
            }

            if (!sessionState.RoomsAllowed)
            {
                dashboardPresenter?.SetStatus(ResolveRuntimeBlockedMessage());
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SyncOnboardingControls(sessionState, true);
            dashboardPresenter?.SetStatus(manualTrigger
                ? $"Atualizando presenca em {sessionState.ActiveRoom.title}..."
                : $"Heartbeat automatico em {sessionState.ActiveRoom.title}...");

            var requestFailed = false;
            var request = new PresenceHeartbeatRequest
            {
                roomId = sessionState.ActiveRoom.id,
                minorProfileId = sessionState.SelectedMinor.id,
                activeShell = sessionState.ActiveShell,
            };

            yield return apiClient.PostJson(
                "presence/heartbeat",
                JsonUtility.ToJson(request),
                response =>
                {
                    var state = JsonUtility.FromJson<PresenceStateRecord>(response);
                    sessionState.SetPresenceState(state);
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetStatus($"Falha ao atualizar presenca: {error}");
                });

            if (!requestFailed)
            {
                PrimeRuntimeMonitoringTimers(Time.realtimeSinceStartup);
                dashboardPresenter?.Render(sessionState);
                dashboardPresenter?.SetStatus(manualTrigger
                    ? $"Heartbeat enviado. Participantes vistos: {sessionState.ActivePresence?.participantCount ?? 0}."
                    : $"Heartbeat automatico enviado. Participantes vistos: {sessionState.ActivePresence?.participantCount ?? 0}.");
            }

            isBusy = false;
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
        }

        private IEnumerator LoadProgressSummary()
        {
            var requestFailed = false;
            dashboardPresenter?.SetStatus("Carregando progresso do menor...");

            yield return apiClient.GetJson(
                $"progress/summary?childId={sessionState.SelectedMinor.id}",
                response =>
                {
                    var summary = JsonUtility.FromJson<ProgressSummaryResponse>(response);
                    sessionState.SetProgressSummary(summary);
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.MarkFlowFailed("Progresso", "erro");
                    dashboardPresenter?.SetError($"Falha ao carregar progresso: {error}");
                });

            if (requestFailed)
            {
                isBusy = false;
            }
        }

        private IEnumerator LoadPresenceState(string roomId, bool updateStatus, bool nonBlocking)
        {
            if (sessionState.SelectedMinor == null || string.IsNullOrWhiteSpace(roomId))
            {
                yield break;
            }

            var requestFailed = false;
            yield return apiClient.GetJson(
                $"presence/{roomId}?minorProfileId={sessionState.SelectedMinor.id}",
                response =>
                {
                    var state = JsonUtility.FromJson<PresenceStateRecord>(response);
                    sessionState.SetPresenceState(state);
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    if (!nonBlocking)
                    {
                        dashboardPresenter?.SetStatus($"Falha ao ler presenca monitorada: {error}");
                    }
                });

            if (!requestFailed && updateStatus)
            {
                dashboardPresenter?.SetStatus(sessionState.ActivePresence != null && !sessionState.ActivePresence.allowed
                    ? ResolvePresenceBlockedMessage()
                    : $"Presenca monitorada atualizada para {sessionState.ActiveRoom?.title ?? roomId}.");
            }
        }

        private string ResolveRuntimeBlockedMessage()
        {
            if (sessionState.IsRoomSessionClosedByTimeout)
            {
                return string.IsNullOrWhiteSpace(sessionState.ResolveLifecycleMessage())
                    ? "Sessao encerrada por timeout. Aguarde o lock expirar para recuperar o runtime."
                    : sessionState.ResolveLifecycleMessage();
            }

            if (sessionState.IsRoomSessionClosedByAdmin)
            {
                return string.IsNullOrWhiteSpace(sessionState.ResolveLifecycleMessage())
                    ? "Sala pausada pela operacao. O admin aplicou um lock temporario."
                    : sessionState.ResolveLifecycleMessage();
            }

            if (sessionState.IsRoomSessionParticipantRemoved)
            {
                return string.IsNullOrWhiteSpace(sessionState.ResolveLifecycleMessage())
                    ? "Participacao encerrada temporariamente. O participante foi removido da sessao."
                    : sessionState.ResolveLifecycleMessage();
            }

            if (sessionState.IsRoomSessionStale)
            {
                return string.IsNullOrWhiteSpace(sessionState.ResolveLifecycleMessage())
                    ? "Sessao em atraso. O heartbeat automatico vai tentar recuperar o runtime."
                    : sessionState.ResolveLifecycleMessage();
            }

            if (!string.IsNullOrWhiteSpace(sessionState.RoomCatalogMessage))
            {
                return sessionState.RoomCatalogMessage;
            }

            if (sessionState.RoomRequirements != null &&
                !string.IsNullOrWhiteSpace(sessionState.RoomRequirements.operationalMessage))
            {
                return sessionState.RoomRequirements.operationalMessage;
            }

            if (sessionState.RoomRequirements != null &&
                !string.IsNullOrWhiteSpace(sessionState.RoomRequirements.blockedReason))
            {
                return sessionState.RoomRequirements.blockedReason;
            }

            return "As salas monitoradas ainda nao estao liberadas para este menor. Ajuste os gates em /pais.";
        }

        private string ResolvePresenceBlockedMessage()
        {
            if (sessionState.IsRoomSessionClosedByTimeout ||
                sessionState.IsRoomSessionClosedByAdmin ||
                sessionState.IsRoomSessionParticipantRemoved ||
                sessionState.IsRoomSessionStale)
            {
                return sessionState.ResolveLifecycleHeadline() +
                       (string.IsNullOrWhiteSpace(sessionState.ResolveLifecycleMessage())
                           ? string.Empty
                           : $" - {sessionState.ResolveLifecycleMessage()}");
            }

            if (sessionState.ActivePresence != null && !string.IsNullOrWhiteSpace(sessionState.ActivePresence.reason))
            {
                return sessionState.ActivePresence.reason;
            }

            return ResolveRuntimeBlockedMessage();
        }

        private bool ShouldRunRuntimeMonitoring()
        {
            return environmentReady &&
                   !isBusy &&
                   sessionState != null &&
                   sessionState.HomeReady &&
                   sessionState.IsAuthenticated &&
                   sessionState.SelectedMinor != null &&
                   sessionState.ActiveRoom != null;
        }

        private void PrimeRuntimeMonitoringTimers(float now)
        {
            var roomRefreshDelay = ResolveRoomRefreshDelay();
            if (nextAutoRoomRefreshAt < 0f || nextAutoRoomRefreshAt > now + roomRefreshDelay)
            {
                nextAutoRoomRefreshAt = now + roomRefreshDelay;
            }

            if (sessionState.CanAutoHeartbeat)
            {
                if (nextAutoPresenceHeartbeatAt < 0f || nextAutoPresenceHeartbeatAt > now + AutoPresenceHeartbeatIntervalSeconds)
                {
                    nextAutoPresenceHeartbeatAt = now + AutoPresenceHeartbeatIntervalSeconds;
                }
            }
            else
            {
                nextAutoPresenceHeartbeatAt = -1f;
            }
        }

        private void ResetRuntimeMonitoringTimers()
        {
            nextAutoRoomRefreshAt = -1f;
            nextAutoPresenceHeartbeatAt = -1f;
            autoRoomRefreshInFlight = false;
            autoPresenceHeartbeatInFlight = false;
        }

        private float ResolveRoomRefreshDelay()
        {
            if (!sessionState.CanAutoRefreshRoomState)
            {
                return AutoRoomRecoveryRefreshIntervalSeconds;
            }

            if (sessionState.IsRoomSessionStale || sessionState.IsRoomSessionClosed || sessionState.IsLockExpired())
            {
                return AutoRoomRecoveryRefreshIntervalSeconds;
            }

            return AutoRoomRefreshIntervalSeconds;
        }

        private IEnumerator AutoRefreshMonitoredInteractionsRoutine()
        {
            yield return RefreshMonitoredInteractionsRoutine(false, true);
            autoRoomRefreshInFlight = false;
        }

        private IEnumerator AutoPresenceHeartbeatRoutine()
        {
            yield return SendPresenceHeartbeatRoutine(false);
            autoPresenceHeartbeatInFlight = false;
        }

        private void ApplyDevelopmentDefaults(AppEnvironment environment, string targetShell)
        {
            var email = string.IsNullOrWhiteSpace(environment.devLoginEmail) ? "parent@leggau.local" : environment.devLoginEmail;
            var name = string.IsNullOrWhiteSpace(environment.devLoginName) ? "Responsavel Demo" : environment.devLoginName;
            var password = string.IsNullOrWhiteSpace(environment.devAuthPassword) ? "Parent123!" : environment.devAuthPassword;
            sessionState.SetDraftResponsible(email, name, password);
            sessionState.SetDraftChildName(targetShell == AdolescentShellMode ? "Gau Teen" : "Gau");
            sessionState.SetDraftCreateAdolescent(targetShell == AdolescentShellMode);
            sessionState.SetDraftConsentsAccepted(false);
        }

        private bool TryRestoreLocalSession()
        {
            if (!LeggauLocalSessionStore.TryLoad(out var snapshot))
            {
                return false;
            }

            sessionState.RestoreFromSnapshot(snapshot);

            if (string.IsNullOrWhiteSpace(sessionState.DraftParentEmail))
            {
                sessionState.SetDraftResponsible(
                    sessionState.CurrentUserEmail,
                    sessionState.Parent?.name ?? sessionState.User?.displayName,
                    sessionState.DraftPassword);
            }

            if (string.IsNullOrWhiteSpace(sessionState.DraftChildName) && sessionState.SelectedMinor != null)
            {
                sessionState.SetDraftChildName(sessionState.SelectedMinor.name);
            }

            if (sessionState.IsAuthenticated)
            {
                apiClient.SetAccessToken(sessionState.AccessToken);
            }

            return true;
        }

        private void PersistLocalSession()
        {
            if (sessionState.HasPersistableState)
            {
                LeggauLocalSessionStore.Save(sessionState);
            }
            else
            {
                LeggauLocalSessionStore.Clear();
            }
        }

        private IEnumerator ResumePersistedOnboardingRoutine()
        {
            if (isBusy)
            {
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SyncOnboardingControls(sessionState, true);
            dashboardPresenter?.SetHero("Retomando o menor certo", "Vamos confirmar a sessao do responsavel, os menores vinculados e a policy antes de abrir o shell.");
            dashboardPresenter?.RenderLoadingState(sessionState, BuildResumeStatus());

            var requestFailed = false;

            if (sessionState.IsAuthenticated)
            {
                apiClient.SetAccessToken(sessionState.AccessToken);
            }

            if (sessionState.LinkedMinors == null)
            {
                yield return LoadFamilyOverview(value => requestFailed = value);
            }

            if (!requestFailed && sessionState.SelectedMinor != null && sessionState.SelectedMinorPolicy == null)
            {
                yield return EnsureSelectedMinorPolicyLoaded(value => requestFailed = value);
            }

            SyncFlowFromSession();
            isBusy = false;
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
            dashboardPresenter?.RenderLoadingState(sessionState, requestFailed ? "Retomada parcial concluida. Revise a etapa destacada." : BuildResumeStatus());
            PersistLocalSession();
        }

        private IEnumerator ResumePersistedHomeRoutine()
        {
            if (isBusy)
            {
                yield break;
            }

            dashboardPresenter?.SetHero("Sua home esta de volta", "Atualizando a experiencia do menor direto da vm2.");
            yield return CompleteHomeStepRoutine();
        }

        private void SyncFlowFromSession()
        {
            dashboardPresenter?.ResetFlow();

            if (sessionState.IsAuthenticated)
            {
                dashboardPresenter?.MarkFlowDone("Auth", sessionState.UsedDevLoginFallback ? "login de desenvolvimento" : "responsavel autenticado");
            }

            if (sessionState.LinkedMinors != null)
            {
                dashboardPresenter?.MarkFlowDone("Familia", sessionState.HasLinkedMinors
                    ? $"{sessionState.LinkedMinors.Length} perfil(is)"
                    : "sem menores ativos");
            }

            if (sessionState.SelectedMinor != null)
            {
                dashboardPresenter?.MarkFlowDone("Menor", sessionState.SelectedMinor.name);
            }
            else if (sessionState.LinkedMinors != null)
            {
                dashboardPresenter?.MarkFlowLoading("Menor", sessionState.HasLinkedMinors ? "selecao pendente" : "sem perfil");
            }

            if (sessionState.SelectedMinorPolicy != null)
            {
                dashboardPresenter?.MarkFlowDone("Politica", $"{sessionState.ResolvedAgeBand} · {sessionState.ActiveShell}");
            }
            else if (sessionState.SelectedMinor != null)
            {
                dashboardPresenter?.MarkFlowLoading("Politica", "aguardando policy");
            }

            if (sessionState.Activities != null)
            {
                dashboardPresenter?.MarkFlowDone("Atividades", $"{sessionState.Activities.Length} carregadas");
            }

            if (sessionState.Rewards != null)
            {
                dashboardPresenter?.MarkFlowDone("Recompensas", $"{sessionState.Rewards.Length} prontas");
            }

            if (sessionState.HomeReady)
            {
                dashboardPresenter?.MarkFlowDone("Progresso", "shell pronta");
            }
        }

        private string BuildResumeStatus()
        {
            if (sessionState.IsRoomSessionClosedByTimeout)
            {
                return "A sala salvo foi encerrada por timeout. O shell continua pronto enquanto o runtime tenta recuperar o estado.";
            }

            if (sessionState.IsRoomSessionClosedByAdmin)
            {
                return "A sala salvo foi pausada pela operacao. Aguarde o lock expirar ou abra outra sala.";
            }

            if (sessionState.IsRoomSessionParticipantRemoved)
            {
                return "A participacao foi encerrada temporariamente. O runtime continua pronto para recuperar o contexto.";
            }

            if (sessionState.IsRoomSessionStale)
            {
                return "A sessao ficou em atraso. O heartbeat automatico vai tentar recuperar o runtime.";
            }

            return sessionState.ResolveResumeStep() switch
            {
                "Home" => "Voltamos direto para o shell salvo. Atualizando a home do menor...",
                "Entrada" => "A policy ja foi carregada. Falta apenas abrir a experiencia do menor.",
                "Politica" => sessionState.SelectedMinor != null
                    ? $"Falta confirmar a policy de {sessionState.SelectedMinor.name}."
                    : "Falta carregar a policy do menor.",
                "Menor" => sessionState.HasLinkedMinors
                    ? "Escolha qual menor deve abrir o app."
                    : "Nenhum menor vinculado. Use /pais ou o atalho dev.",
                "Familia" => "Retomando a familia vinculada para descobrir os menores ativos.",
                _ => "Sua jornada continua na ativacao do responsavel.",
            };
        }

        private void TryLoadLocalGauCatalog()
        {
            try
            {
                var catalog = GauVariantsCatalogLoader.LoadFromStreamingAssets();
                sessionState.SetGauVariantsCatalog(catalog);
                gauVariantPreviewPresenter?.ShowVariant(sessionState.ActiveGauVariant);
            }
            catch (System.Exception exception)
            {
                dashboardPresenter?.SetStatus($"Catalogo local do Gau indisponivel: {exception.Message}");
            }
        }

        private void RenderSelectionState(string status)
        {
            dashboardPresenter?.SetHero("Escolha o menor certo", "A sessao do responsavel ja foi ativada. Agora confirme qual perfil deve abrir a experiencia.");
            dashboardPresenter?.RenderLoadingState(sessionState, status);
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
        }

        private string BuildSelectionStatus(bool triggeredByAuth)
        {
            if (!sessionState.HasLinkedMinors)
            {
                return "Nenhum menor ativo. Use /pais ou o atalho dev para criar um perfil demo.";
            }

            if (sessionState.SelectedMinorPolicy != null)
            {
                return triggeredByAuth
                    ? $"{sessionState.SelectedMinor.name} foi encontrada(o) e a policy ja esta pronta."
                    : $"Policy pronta para {sessionState.SelectedMinor.name}. Abra a experiencia.";
            }

            if (sessionState.HasMultipleLinkedMinors)
            {
                return $"Selecione o perfil correto. {sessionState.LinkedMinors.Length} menores estao vinculados a esta conta.";
            }

            return $"{sessionState.SelectedMinor?.name ?? "O menor"} foi encontrado(a). Confirme a policy para seguir.";
        }

        private string BuildShellOpeningCopy()
        {
            return sessionState.ResolvedAgeBand switch
            {
                "10-12" => "Entrando em uma apresentacao mais densa, com mais autonomia e atividades em destaque.",
                "13-17" => "Entrando em um shell mais calmo, com foco em progresso e objetivos.",
                _ => "Entrando em um shell mais ludico, com Gau em primeiro plano e passos mais curtos.",
            };
        }

        private MinorProfileRecord FindMinorByRole(string targetShell)
        {
            if (sessionState.LinkedMinors == null)
            {
                return null;
            }

            var desiredRole = targetShell == AdolescentShellMode ? "adolescent" : "child";
            for (var index = 0; index < sessionState.LinkedMinors.Length; index += 1)
            {
                var item = sessionState.LinkedMinors[index];
                if (item != null && item.role == desiredRole)
                {
                    return item;
                }
            }

            return null;
        }

        private void EnsureDevelopmentDrafts(string targetShell)
        {
            if (currentEnvironment == null)
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(sessionState.DraftParentEmail))
            {
                ApplyDevelopmentDefaults(currentEnvironment, targetShell);
                return;
            }

            if (string.IsNullOrWhiteSpace(sessionState.DraftChildName))
            {
                sessionState.SetDraftChildName(targetShell == AdolescentShellMode ? "Gau Teen" : "Gau");
            }

            sessionState.SetDraftCreateAdolescent(targetShell == AdolescentShellMode);
        }

        private IEnumerator EnsureProvisioningRequirementsForDevelopment(System.Action<bool> setFailed)
        {
            if (sessionState.ConsentsRecorded)
            {
                setFailed?.Invoke(false);
                yield break;
            }

            var requestFailed = false;
            yield return LoadLegalDocumentsOnly(value => requestFailed = value);
            if (requestFailed)
            {
                setFailed?.Invoke(true);
                yield break;
            }

            if (sessionState.LegalDocuments == null || sessionState.LegalDocuments.Length == 0)
            {
                setFailed?.Invoke(false);
                yield break;
            }

            if (currentEnvironment == null || !currentEnvironment.autoAcceptLegalConsents)
            {
                setFailed?.Invoke(true);
                dashboardPresenter?.SetError("O perfil demo exige consentimentos publicados e a autoaceitacao dev nao esta habilitada.");
                yield break;
            }

            sessionState.SetDraftConsentsAccepted(true);
            yield return RecordLegalConsents(value => requestFailed = value);
            setFailed?.Invoke(requestFailed);
        }

        private void ApplyRecognizedGuardianOverride(InteractionPolicyRecord policy)
        {
            if (policy?.guardianOverride == null)
            {
                return;
            }

            if (!string.IsNullOrWhiteSpace(policy.guardianOverride.preferredGauVariantId))
            {
                var preferredId = policy.guardianOverride.preferredGauVariantId;
                if (sessionState.GauVariantsCatalog?.variants != null)
                {
                    for (var index = 0; index < sessionState.GauVariantsCatalog.variants.Length; index += 1)
                    {
                        if (sessionState.GauVariantsCatalog.variants[index].id == preferredId)
                        {
                            while (sessionState.ActiveGauVariantIndex != index)
                            {
                                sessionState.SelectNextGauVariant();
                            }
                            break;
                        }
                    }
                }
            }
        }

        private bool IsSessionError(string error)
        {
            return !string.IsNullOrWhiteSpace(error) &&
                   (error.Contains("401") || error.Contains("403") || error.Contains("Unauthorized"));
        }

        private void HandleExpiredSession(string status)
        {
            var email = sessionState.CurrentUserEmail;
            var name = sessionState.Parent?.name ?? sessionState.User?.displayName;
            var password = sessionState.DraftPassword;

            apiClient.ClearAccessToken();
            sessionState.InvalidateAuthentication();
            ResetRuntimeMonitoringTimers();
            sessionState.SetDraftResponsible(email, name, password);
            dashboardPresenter?.ResetFlow();
            SyncFlowFromSession();
            dashboardPresenter?.SetHero("Sessao expirada", "Ative novamente o responsavel para voltar ao shell do menor.");
            dashboardPresenter?.RenderLoadingState(sessionState, status);
            PersistLocalSession();
        }
    }
}
