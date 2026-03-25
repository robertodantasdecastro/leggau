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
        [SerializeField] private TextAsset environmentAsset;
        [SerializeField] private string environmentRelativePath = "config/dev-api.json";
        [SerializeField] private ApiClient apiClient;
        [SerializeField] private DashboardTextPresenter dashboardPresenter;
        [SerializeField] private GauVariantPreviewPresenter gauVariantPreviewPresenter;

        private readonly LeggauSessionState sessionState = new();
        private bool isBusy;

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
            StartCoroutine(Bootstrap());
        }

        private IEnumerator Bootstrap()
        {
            if (isBusy)
            {
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SetStatus("Carregando ambiente...");

            var environment = environmentAsset != null
                ? AppEnvironmentLoader.Load(environmentAsset)
                : AppEnvironmentLoader.LoadFromStreamingAssets(environmentRelativePath);
            apiClient.SetBaseUrls(environment.apiBaseUrl, environment.fallbackApiBaseUrl);
            TryLoadLocalGauCatalog();

            var requestFailed = false;

            if (environment.useRealAuthBootstrap)
            {
                yield return AuthenticateWithRealAuth(environment, value => requestFailed = value);
            }
            else
            {
                yield return AuthenticateWithDevLogin(environment, value => requestFailed = value);
            }

            if (requestFailed || string.IsNullOrWhiteSpace(sessionState.CurrentUserEmail))
            {
                isBusy = false;
                yield break;
            }

            if (environment.autoAcceptLegalConsents && !sessionState.UsedDevLoginFallback)
            {
                yield return LoadAndAcceptLegalConsents(value => requestFailed = value);
            }

            if (requestFailed)
            {
                isBusy = false;
                yield break;
            }

            dashboardPresenter?.SetStatus($"Carregando familia via {apiClient.ActiveBaseUrl}...");

            yield return apiClient.GetJson(
                $"families/overview?email={sessionState.CurrentUserEmail}",
                response =>
                {
                    var family = JsonUtility.FromJson<FamilyOverviewResponse>(response);
                    sessionState.SetFamily(family);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao carregar familia: {error}");
                }
            );

            if (!requestFailed && sessionState.ActiveChild == null)
            {
                yield return EnsureFirstChildProfile(value => requestFailed = value);
            }

            if (requestFailed || sessionState.ActiveChild == null)
            {
                dashboardPresenter?.SetError("Nao foi possivel preparar o perfil infantil inicial.");
                isBusy = false;
                yield break;
            }

            dashboardPresenter?.SetStatus("Carregando atividades...");

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
                    dashboardPresenter?.SetError($"Falha ao carregar atividades: {error}");
                }
            );

            if (requestFailed)
            {
                isBusy = false;
                yield break;
            }

            dashboardPresenter?.SetStatus("Carregando catalogo 3D...");

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
                }
            );

            if (requestFailed)
            {
                isBusy = false;
                yield break;
            }

            dashboardPresenter?.SetStatus("Carregando recompensas...");

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
                    dashboardPresenter?.SetError($"Falha ao carregar recompensas: {error}");
                }
            );

            if (requestFailed)
            {
                isBusy = false;
                yield break;
            }

            yield return LoadProgressSummary();
            dashboardPresenter?.Render(sessionState);
            gauVariantPreviewPresenter?.ShowVariant(sessionState.ActiveGauVariant);
            isBusy = false;
        }

        private IEnumerator AuthenticateWithRealAuth(AppEnvironment environment, System.Action<bool> setFailed)
        {
            dashboardPresenter?.SetStatus("Registrando sessao de desenvolvimento...");

            var email = string.IsNullOrWhiteSpace(environment.devLoginEmail) ? "parent@leggau.local" : environment.devLoginEmail;
            var name = string.IsNullOrWhiteSpace(environment.devLoginName) ? "Responsavel Demo" : environment.devLoginName;
            var password = string.IsNullOrWhiteSpace(environment.devAuthPassword) ? "Leggau123!" : environment.devAuthPassword;
            var registerSucceeded = false;
            var shouldTryLogin = false;
            string authError = null;

            var registerRequest = new RegisterRequest
            {
                email = email,
                password = password,
                displayName = name,
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
                dashboardPresenter?.SetStatus("Conta existente, entrando com login real...");

                var loginRequest = new LoginRequest
                {
                    email = email,
                    password = password,
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
                    error =>
                    {
                        authError = error;
                    });
            }

            if (registerSucceeded)
            {
                yield break;
            }

            if (environment.allowDevLoginFallback)
            {
                dashboardPresenter?.SetStatus("Auth real indisponivel, usando fallback dev...");
                yield return AuthenticateWithDevLogin(environment, setFailed);
                yield break;
            }

            setFailed?.Invoke(true);
            dashboardPresenter?.SetError($"Falha na autenticacao real: {authError}");
        }

        private IEnumerator AuthenticateWithDevLogin(AppEnvironment environment, System.Action<bool> setFailed)
        {
            dashboardPresenter?.SetStatus("Entrando com login dev...");

            var loginRequest = new DevLoginRequest
            {
                email = string.IsNullOrWhiteSpace(environment.devLoginEmail) ? "parent@leggau.local" : environment.devLoginEmail,
                name = string.IsNullOrWhiteSpace(environment.devLoginName) ? "Responsavel Demo" : environment.devLoginName,
            };

            var requestFailed = false;

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
                    dashboardPresenter?.SetError($"Falha no login dev: {error}");
                }
            );

            if (requestFailed)
            {
                setFailed?.Invoke(true);
            }
        }

        private IEnumerator LoadAndAcceptLegalConsents(System.Action<bool> setFailed)
        {
            dashboardPresenter?.SetStatus("Carregando documentos legais...");

            var requestFailed = false;

            yield return apiClient.GetJson(
                "legal/documents",
                response =>
                {
                    var wrapped = $"{{\"items\":{response}}}";
                    var documents = JsonUtility.FromJson<LegalDocumentsEnvelope>(wrapped);
                    sessionState.SetLegalDocuments(documents?.items);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao carregar documentos legais: {error}");
                });

            if (requestFailed)
            {
                setFailed?.Invoke(true);
                yield break;
            }

            if (sessionState.LegalDocuments == null || sessionState.LegalDocuments.Length == 0)
            {
                yield break;
            }

            var currentUserEmail = sessionState.CurrentUserEmail;
            if (string.IsNullOrWhiteSpace(currentUserEmail))
            {
                setFailed?.Invoke(true);
                dashboardPresenter?.SetError("Nao foi possivel registrar consentimentos sem email do usuario.");
                yield break;
            }

            foreach (var document in sessionState.LegalDocuments)
            {
                if (document == null || string.IsNullOrWhiteSpace(document.key))
                {
                    continue;
                }

                dashboardPresenter?.SetStatus($"Registrando aceite: {document.title}...");

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
        }

        private IEnumerator EnsureFirstChildProfile(System.Action<bool> setFailed)
        {
            var parentEmail = sessionState.CurrentUserEmail;
            if (string.IsNullOrWhiteSpace(parentEmail))
            {
                setFailed?.Invoke(true);
                dashboardPresenter?.SetError("Nao foi possivel criar a crianca inicial sem email do responsavel.");
                yield break;
            }

            dashboardPresenter?.SetStatus("Criando primeiro perfil infantil...");

            var parentName = sessionState.Parent?.name;
            var firstName = string.IsNullOrWhiteSpace(parentName) ? "Explorador Gau" : $"Filho de {parentName.Split(' ')[0]}";
            var request = new CreateChildRequest
            {
                parentEmail = parentEmail,
                name = firstName,
                age = 6,
                avatar = sessionState.ActiveGauVariant?.id ?? "gau-rounded-pixel",
            };

            var requestFailed = false;

            yield return apiClient.PostJson(
                "children",
                JsonUtility.ToJson(request),
                response =>
                {
                    var child = JsonUtility.FromJson<ChildProfile>(response);
                    sessionState.SetActiveChild(child);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao criar perfil infantil: {error}");
                });

            if (requestFailed)
            {
                setFailed?.Invoke(true);
            }
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
            dashboardPresenter?.Render(sessionState);
            gauVariantPreviewPresenter?.ShowVariant(sessionState.ActiveGauVariant);
            dashboardPresenter?.SetStatus($"Mascote ativo: {sessionState.ActiveGauVariant?.displayName ?? "-"}");
        }

        public void SelectPreviousGauVariant()
        {
            sessionState.SelectPreviousGauVariant();
            dashboardPresenter?.Render(sessionState);
            gauVariantPreviewPresenter?.ShowVariant(sessionState.ActiveGauVariant);
            dashboardPresenter?.SetStatus($"Mascote ativo: {sessionState.ActiveGauVariant?.displayName ?? "-"}");
        }

        private IEnumerator DevCheckinFirstActivityRoutine()
        {
            if (sessionState.ActiveChild == null || sessionState.Activities == null || sessionState.Activities.Length == 0)
            {
                dashboardPresenter?.SetError("Nenhuma atividade pronta para check-in.");
                yield break;
            }

            isBusy = true;
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
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao registrar check-in: {error}");
                }
            );

            if (requestFailed)
            {
                isBusy = false;
                yield break;
            }

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
                    dashboardPresenter?.SetError($"Falha ao atualizar recompensas: {error}");
                }
            );

            if (requestFailed)
            {
                isBusy = false;
                yield break;
            }

            yield return LoadProgressSummary();
            dashboardPresenter?.Render(sessionState);
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
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao carregar progresso: {error}");
                }
            );

            if (requestFailed)
            {
                isBusy = false;
            }
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
