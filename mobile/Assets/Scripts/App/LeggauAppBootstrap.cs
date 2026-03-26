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
        private static bool automatedDevelopmentRunRequested;

        [SerializeField] private TextAsset environmentAsset;
        [SerializeField] private string environmentRelativePath = "config/dev-api.json";
        [SerializeField] private ApiClient apiClient;
        [SerializeField] private DashboardTextPresenter dashboardPresenter;
        [SerializeField] private GauVariantPreviewPresenter gauVariantPreviewPresenter;

        private readonly LeggauSessionState sessionState = new();
        private AppEnvironment currentEnvironment;
        private bool isBusy;
        private bool environmentReady;

        public static void RequestAutomatedDevelopmentRun()
        {
            automatedDevelopmentRunRequested = true;
            PlayerPrefs.SetInt(AutomatedDevelopmentRunKey, 1);
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

            StartCoroutine(SubmitConsentStepRoutine());
        }

        public void SubmitChildStep()
        {
            if (isBusy || !environmentReady)
            {
                return;
            }

            StartCoroutine(SubmitChildStepRoutine());
        }

        public void CompleteHomeStep()
        {
            if (isBusy || !environmentReady)
            {
                return;
            }

            StartCoroutine(CompleteHomeStepRoutine());
        }

        public void RunDevelopmentOnboarding()
        {
            if (isBusy || !environmentReady)
            {
                return;
            }

            StartCoroutine(RunDevelopmentOnboardingRoutine());
        }

        public void RetryBootstrap()
        {
            if (isBusy)
            {
                return;
            }

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
                dashboardPresenter?.RenderLoadingState(sessionState, "Mascote atualizado para o onboarding.");
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
                dashboardPresenter?.RenderLoadingState(sessionState, "Mascote atualizado para o onboarding.");
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
            sessionState.ResetForBootstrap();
            dashboardPresenter?.ResetFlow();
            dashboardPresenter?.SetHero("Bem-vindo ao Leggau", "Preparando a experiencia do responsavel e o mascote Gau.");
            dashboardPresenter?.RenderLoadingState(sessionState, "Carregando ambiente...");

            currentEnvironment = environmentAsset != null
                ? AppEnvironmentLoader.Load(environmentAsset)
                : AppEnvironmentLoader.LoadFromStreamingAssets(environmentRelativePath);

            apiClient.SetBaseUrls(currentEnvironment.apiBaseUrl, currentEnvironment.fallbackApiBaseUrl);
            TryLoadLocalGauCatalog();
            var restoredSession = TryRestoreLocalSession();
            if (!restoredSession)
            {
                ApplyDevelopmentDefaults(currentEnvironment);
            }

            SyncFlowFromSession();

            if (restoredSession)
            {
                dashboardPresenter?.SetHero("Bem-vindo de volta", "Sua jornada foi retomada do ultimo ponto salvo com o Gau.");
                dashboardPresenter?.RenderLoadingState(sessionState, BuildResumeStatus());
            }
            else
            {
                dashboardPresenter?.SetHero("Onboarding pronto para comecar", "Preencha os dados do responsavel, confirme consentimentos e prepare a crianca.");
                dashboardPresenter?.RenderLoadingState(sessionState, $"Conectado a {apiClient.ActiveBaseUrl}. Aguardando seu primeiro passo.");
            }

            environmentReady = true;
            isBusy = false;
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
            PersistLocalSession();

            if (restoredSession)
            {
                if (sessionState.HomeReady && sessionState.ActiveChild != null)
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

            if (ConsumeAutomatedDevelopmentRunFlag())
            {
                StartCoroutine(RunDevelopmentOnboardingRoutine());
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

        private static bool ConsumeAutomatedDevelopmentRunFlag()
        {
            var shouldRun = automatedDevelopmentRunRequested || PlayerPrefs.GetInt(AutomatedDevelopmentRunKey, 0) == 1;
            automatedDevelopmentRunRequested = false;
            PlayerPrefs.DeleteKey(AutomatedDevelopmentRunKey);
            return shouldRun;
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
            dashboardPresenter?.SetHero("Identificando o responsavel", "Tentando cadastro ou login da conta principal.");
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

            dashboardPresenter?.MarkFlowDone("Auth", sessionState.UsedDevLoginFallback ? "login dev" : "autenticado");
            dashboardPresenter?.MarkFlowLoading("Legal", "carregando documentos");
            PersistLocalSession();
            yield return LoadLegalDocumentsOnly(value => requestFailed = value);

            if (requestFailed)
            {
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            if (sessionState.LegalDocuments == null || sessionState.LegalDocuments.Length == 0)
            {
                dashboardPresenter?.MarkFlowDone("Legal", "sem documentos");
            }

            dashboardPresenter?.SetHero("Consentimentos prontos", "Revise os documentos e confirme os aceites para continuar.");
            dashboardPresenter?.RenderLoadingState(sessionState, "Responsavel autenticado. Aguarde a confirmacao dos consentimentos.");
            isBusy = false;
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
            PersistLocalSession();
        }

        private IEnumerator SubmitConsentStepRoutine()
        {
            dashboardPresenter?.ReadOnboardingDrafts(sessionState);
            PersistLocalSession();

            if (!sessionState.IsAuthenticated)
            {
                dashboardPresenter?.SetError("Autentique o responsavel antes de confirmar os consentimentos.");
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SyncOnboardingControls(sessionState, true);
            dashboardPresenter?.SetHero("Registrando consentimentos", "Gravando os aceites legais da jornada infantil.");
            dashboardPresenter?.MarkFlowLoading("Legal", "aceites");

            if (sessionState.LegalDocuments == null || sessionState.LegalDocuments.Length == 0)
            {
                dashboardPresenter?.MarkFlowDone("Legal", "sem documentos");
                isBusy = false;
                dashboardPresenter?.RenderLoadingState(sessionState, "Nenhum consentimento extra exigido. Prossiga para a crianca.");
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            if (!sessionState.DraftConsentsAccepted)
            {
                dashboardPresenter?.SetError("Confirme explicitamente os consentimentos para continuar.");
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            var requestFailed = false;
            yield return RecordLegalConsents(value => requestFailed = value);

            if (requestFailed)
            {
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            dashboardPresenter?.MarkFlowDone("Legal", "aceites gravados");
            dashboardPresenter?.SetHero("Crianca pronta para entrar", "Agora vamos reutilizar ou criar o primeiro perfil infantil.");
            dashboardPresenter?.RenderLoadingState(sessionState, "Consentimentos salvos. Prepare a crianca.");
            isBusy = false;
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
            PersistLocalSession();
        }

        private IEnumerator SubmitChildStepRoutine()
        {
            dashboardPresenter?.ReadOnboardingDrafts(sessionState);
            PersistLocalSession();

            if (!sessionState.IsAuthenticated)
            {
                dashboardPresenter?.SetError("Autentique o responsavel antes de preparar a crianca.");
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            if (sessionState.LegalDocuments != null && sessionState.LegalDocuments.Length > 0 && !sessionState.ConsentsRecorded)
            {
                dashboardPresenter?.SetError("Confirme os consentimentos legais antes de criar ou selecionar a crianca.");
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SyncOnboardingControls(sessionState, true);
            dashboardPresenter?.SetHero("Preparando a crianca", "Buscando a familia e criando o primeiro perfil infantil quando necessario.");
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

            dashboardPresenter?.MarkFlowDone("Familia", "familia carregada");

            if (sessionState.ActiveChild == null)
            {
                if (string.IsNullOrWhiteSpace(sessionState.DraftChildName))
                {
                    dashboardPresenter?.SetError("Informe o nome da crianca para criar o primeiro perfil.");
                    isBusy = false;
                    dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                    yield break;
                }

                dashboardPresenter?.MarkFlowLoading("Crianca", "criacao inicial");
                yield return EnsureFirstChildProfile(value => requestFailed = value);
            }
            else
            {
                dashboardPresenter?.MarkFlowDone("Crianca", "perfil existente");
            }

            if (requestFailed || sessionState.ActiveChild == null)
            {
                dashboardPresenter?.MarkFlowFailed("Crianca", "nao disponivel");
                dashboardPresenter?.SetError("Nao foi possivel preparar o perfil infantil.");
                isBusy = false;
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            dashboardPresenter?.MarkFlowDone("Crianca", "perfil ativo");
            dashboardPresenter?.SetHero("Tudo pronto para entrar", "Com responsavel, consentimentos e crianca definidos, a home pode ser carregada.");
            dashboardPresenter?.RenderLoadingState(sessionState, "Crianca preparada. Entre na home para concluir o onboarding.");
            isBusy = false;
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
            PersistLocalSession();
        }

        private IEnumerator CompleteHomeStepRoutine()
        {
            if (sessionState.ActiveChild == null)
            {
                dashboardPresenter?.SetError("Prepare a crianca antes de entrar na home.");
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SyncOnboardingControls(sessionState, true);
            dashboardPresenter?.SetHero("Montando a primeira home", "Carregando atividades, catalogo, recompensas e progresso.");
            dashboardPresenter?.MarkFlowLoading("Atividades", "catalogo diario");
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
                $"rewards?childId={sessionState.ActiveChild.id}",
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
            dashboardPresenter?.MarkFlowLoading("Progresso", "resumo diario");
            yield return LoadProgressSummary();

            if (!isBusy)
            {
                dashboardPresenter?.SyncOnboardingControls(sessionState, false);
                yield break;
            }

            sessionState.SetHomeReady(true);
            dashboardPresenter?.MarkFlowDone("Progresso", "painel pronto");
            dashboardPresenter?.SetHero("Tudo pronto", "Responsavel, crianca, Gau e home do MVP carregados.");
            dashboardPresenter?.Render(sessionState);
            dashboardPresenter?.SyncOnboardingControls(sessionState, false);
            gauVariantPreviewPresenter?.ShowVariant(sessionState.ActiveGauVariant);
            isBusy = false;
            PersistLocalSession();
        }

        private IEnumerator RunDevelopmentOnboardingRoutine()
        {
            if (!sessionState.IsAuthenticated)
            {
                yield return SubmitResponsibleStepRoutine(currentEnvironment != null && currentEnvironment.allowDevLoginFallback);
                if (!sessionState.IsAuthenticated)
                {
                    yield break;
                }
            }

            if (sessionState.LegalDocuments != null && sessionState.LegalDocuments.Length > 0 && !sessionState.ConsentsRecorded)
            {
                sessionState.SetDraftConsentsAccepted(true);
                dashboardPresenter?.SetConsentAccepted(true);
                yield return SubmitConsentStepRoutine();
                if (sessionState.LegalDocuments.Length > 0 && !sessionState.ConsentsRecorded)
                {
                    yield break;
                }
            }

            if (sessionState.ActiveChild == null)
            {
                if (string.IsNullOrWhiteSpace(sessionState.DraftChildName))
                {
                    sessionState.SetDraftChildName("Gau");
                }

                yield return SubmitChildStepRoutine();
                if (sessionState.ActiveChild == null)
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
                PersistLocalSession();
                setFailed?.Invoke(false);
                yield break;
            }

            if (allowDevFallback && currentEnvironment != null && currentEnvironment.allowDevLoginFallback)
            {
                dashboardPresenter?.SetStatus("Auth real indisponivel, usando o login dev para acelerar o onboarding.");
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
                    dashboardPresenter?.SetConsentAccepted(false);
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.MarkFlowFailed("Legal", "erro");
                    dashboardPresenter?.SetError($"Falha ao carregar documentos legais: {error}");
                });

            if (requestFailed)
            {
                setFailed?.Invoke(true);
                yield break;
            }

            setFailed?.Invoke(false);
        }

        private IEnumerator RecordLegalConsents(System.Action<bool> setFailed)
        {
            var requestFailed = false;
            var currentUserEmail = sessionState.CurrentUserEmail;
            if (string.IsNullOrWhiteSpace(currentUserEmail))
            {
                setFailed?.Invoke(true);
                dashboardPresenter?.MarkFlowFailed("Legal", "sem email");
                dashboardPresenter?.SetError("Nao foi possivel registrar consentimentos sem email do usuario.");
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
                        dashboardPresenter?.MarkFlowFailed("Legal", "erro");
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

        private IEnumerator EnsureFirstChildProfile(System.Action<bool> setFailed)
        {
            var parentEmail = sessionState.CurrentUserEmail;
            if (string.IsNullOrWhiteSpace(parentEmail))
            {
                setFailed?.Invoke(true);
                dashboardPresenter?.MarkFlowFailed("Crianca", "sem responsavel");
                dashboardPresenter?.SetError("Nao foi possivel criar a crianca sem email do responsavel.");
                yield break;
            }

            var requestFailed = false;
            var request = new CreateChildRequest
            {
                parentEmail = parentEmail,
                name = sessionState.DraftChildName,
                age = 6,
                avatar = sessionState.ActiveGauVariant?.id ?? "gau-rounded-pixel",
            };

            yield return apiClient.PostJson(
                "children",
                JsonUtility.ToJson(request),
                response =>
                {
                    var child = JsonUtility.FromJson<ChildProfile>(response);
                    sessionState.SetActiveChild(child);
                    PersistLocalSession();
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.MarkFlowFailed("Crianca", "erro");
                    dashboardPresenter?.SetError($"Falha ao criar perfil infantil: {error}");
                });

            setFailed?.Invoke(requestFailed);
        }

        private IEnumerator DevCheckinFirstActivityRoutine()
        {
            if (sessionState.ActiveChild == null || sessionState.Activities == null || sessionState.Activities.Length == 0)
            {
                dashboardPresenter?.SetError("Nenhuma atividade pronta para check-in.");
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SyncOnboardingControls(sessionState, true);
            dashboardPresenter?.SetStatus("Registrando check-in de desenvolvimento...");

            var request = new CreateCheckinRequest
            {
                childId = sessionState.ActiveChild.id,
                activityId = sessionState.Activities[0].id,
                notes = "Check-in automatico do dashboard bootstrap",
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
                $"rewards?childId={sessionState.ActiveChild.id}",
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

        private IEnumerator LoadProgressSummary()
        {
            var requestFailed = false;
            dashboardPresenter?.SetStatus("Carregando progresso diario...");

            yield return apiClient.GetJson(
                $"progress/summary?childId={sessionState.ActiveChild.id}",
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

        private void ApplyDevelopmentDefaults(AppEnvironment environment)
        {
            var email = string.IsNullOrWhiteSpace(environment.devLoginEmail) ? "parent@leggau.local" : environment.devLoginEmail;
            var name = string.IsNullOrWhiteSpace(environment.devLoginName) ? "Responsavel Demo" : environment.devLoginName;
            var password = string.IsNullOrWhiteSpace(environment.devAuthPassword) ? "Leggau123!" : environment.devAuthPassword;
            sessionState.SetDraftResponsible(email, name, password);
            sessionState.SetDraftChildName("Gau");
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

            if (string.IsNullOrWhiteSpace(sessionState.DraftChildName) && sessionState.ActiveChild != null)
            {
                sessionState.SetDraftChildName(sessionState.ActiveChild.name);
            }

            return true;
        }

        private void PersistLocalSession()
        {
            if (sessionState.HasPersistableState)
            {
                LeggauLocalSessionStore.Save(sessionState);
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
            dashboardPresenter?.SetHero("Retomando sua jornada", "Encontramos um progresso salvo e estamos posicionando voce no proximo passo.");
            dashboardPresenter?.RenderLoadingState(sessionState, BuildResumeStatus());

            var requestFailed = false;

            if (sessionState.IsAuthenticated && sessionState.LegalDocuments == null)
            {
                dashboardPresenter?.MarkFlowLoading("Legal", "carregando documentos");
                yield return LoadLegalDocumentsOnly(value => requestFailed = value);
            }

            if (!requestFailed &&
                sessionState.IsAuthenticated &&
                (sessionState.ConsentsRecorded || sessionState.LegalDocuments == null || sessionState.LegalDocuments.Length == 0) &&
                sessionState.ActiveChild == null)
            {
                dashboardPresenter?.MarkFlowLoading("Familia", "overview");
                yield return LoadFamilyOverview(value => requestFailed = value);
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

            dashboardPresenter?.SetHero("Sua home esta de volta", "Atualizando atividades, progresso e recompensas direto da vm2.");
            yield return CompleteHomeStepRoutine();
        }

        private void SyncFlowFromSession()
        {
            dashboardPresenter?.ResetFlow();

            if (sessionState.IsAuthenticated)
            {
                dashboardPresenter?.MarkFlowDone("Auth", sessionState.UsedDevLoginFallback ? "login de desenvolvimento" : "responsavel autenticado");
            }

            if (sessionState.LegalDocuments != null)
            {
                if (sessionState.LegalDocuments.Length == 0)
                {
                    dashboardPresenter?.MarkFlowDone("Legal", "sem consentimentos extras");
                }
                else if (sessionState.ConsentsRecorded)
                {
                    dashboardPresenter?.MarkFlowDone("Legal", "consentimentos confirmados");
                }
                else if (sessionState.IsAuthenticated)
                {
                    dashboardPresenter?.MarkFlowLoading("Legal", "aguardando aceite");
                }
            }

            if (sessionState.Parent != null)
            {
                dashboardPresenter?.MarkFlowDone("Familia", "responsavel identificado");
            }

            if (sessionState.ActiveChild != null)
            {
                dashboardPresenter?.MarkFlowDone("Crianca", "perfil infantil pronto");
            }
            else if (sessionState.IsAuthenticated && (sessionState.ConsentsRecorded || sessionState.LegalDocuments == null || sessionState.LegalDocuments.Length == 0))
            {
                dashboardPresenter?.MarkFlowLoading("Crianca", "aguardando definicao");
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
                dashboardPresenter?.MarkFlowDone("Progresso", "home pronta");
            }
        }

        private string BuildResumeStatus()
        {
            return sessionState.ResolveResumeStep() switch
            {
                "Home" => "Voltamos direto para a home salva. Atualizando dados do dia...",
                "Entrada" => "A crianca ja esta pronta. Falta apenas entrar na home.",
                "Crianca" => sessionState.ActiveChild != null
                    ? $"Encontramos a crianca {sessionState.ActiveChild.name}. Confirme para continuar."
                    : "Seu onboarding continua na etapa da crianca.",
                "Legal" => "Seu onboarding continua na confirmacao dos consentimentos.",
                _ => "Seu onboarding continua na etapa do responsavel.",
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
    }
}
