using Leggau.Gameplay;
using UnityEngine;
using UnityEngine.UI;

namespace Leggau.UI
{
    public class OnboardingControlView : MonoBehaviour
    {
        [SerializeField] private InputField parentEmailInput;
        [SerializeField] private InputField parentNameInput;
        [SerializeField] private InputField passwordInput;
        [SerializeField] private InputField childNameInput;
        [SerializeField] private Toggle consentToggle;
        [SerializeField] private TextValueView consentDocumentsLabel;
        [SerializeField] private TextValueView childSummaryLabel;
        [SerializeField] private TextValueView entrySummaryLabel;
        [SerializeField] private Button authButton;
        [SerializeField] private Button legalButton;
        [SerializeField] private Button childButton;
        [SerializeField] private Button homeButton;
        [SerializeField] private Button devButton;

        public void Bind(
            InputField responsibleEmail,
            InputField responsibleName,
            InputField responsiblePassword,
            InputField childName,
            Toggle legalConsent,
            TextValueView legalDocuments,
            TextValueView childSummary,
            TextValueView entrySummary,
            Button authAction,
            Button legalAction,
            Button childAction,
            Button homeAction,
            Button developmentAction)
        {
            parentEmailInput = responsibleEmail;
            parentNameInput = responsibleName;
            passwordInput = responsiblePassword;
            childNameInput = childName;
            consentToggle = legalConsent;
            consentDocumentsLabel = legalDocuments;
            childSummaryLabel = childSummary;
            entrySummaryLabel = entrySummary;
            authButton = authAction;
            legalButton = legalAction;
            childButton = childAction;
            homeButton = homeAction;
            devButton = developmentAction;
        }

        public void PopulateFromSession(LeggauSessionState session)
        {
            if (session == null)
            {
                return;
            }

            SetInput(parentEmailInput, session.DraftParentEmail);
            SetInput(parentNameInput, session.DraftParentName);
            SetInput(passwordInput, session.DraftPassword);
            SetInput(childNameInput, session.DraftChildName);

            if (consentToggle != null)
            {
                consentToggle.isOn = session.DraftConsentsAccepted;
            }

            consentDocumentsLabel?.SetText(BuildConsentSummary(session));
            childSummaryLabel?.SetText(BuildChildSummary(session));
            entrySummaryLabel?.SetText(BuildEntrySummary(session));
        }

        public void ReadDrafts(LeggauSessionState session)
        {
            if (session == null)
            {
                return;
            }

            session.SetDraftResponsible(
                parentEmailInput != null ? parentEmailInput.text : session.DraftParentEmail,
                parentNameInput != null ? parentNameInput.text : session.DraftParentName,
                passwordInput != null ? passwordInput.text : session.DraftPassword);
            session.SetDraftChildName(childNameInput != null ? childNameInput.text : session.DraftChildName);
            session.SetDraftConsentsAccepted(consentToggle != null && consentToggle.isOn);
        }

        public void SetConsentAccepted(bool accepted)
        {
            if (consentToggle != null)
            {
                consentToggle.isOn = accepted;
            }
        }

        public void ApplyState(LeggauSessionState session, bool busy)
        {
            var canEditResponsible = !busy && !session.IsAuthenticated;
            var legalReady = session.IsAuthenticated && !session.ConsentsRecorded;
            var childReady = session.IsAuthenticated && (session.ConsentsRecorded || !HasLegalDocuments(session)) && !session.HomeReady;
            var homeReady = session.ActiveChild != null && !session.HomeReady;

            SetInteractable(parentEmailInput, canEditResponsible);
            SetInteractable(parentNameInput, canEditResponsible);
            SetInteractable(passwordInput, canEditResponsible);
            SetInteractable(childNameInput, !busy && session.ActiveChild == null && childReady);

            if (consentToggle != null)
            {
                consentToggle.interactable = !busy && legalReady;
            }

            if (authButton != null)
            {
                authButton.interactable = canEditResponsible;
                SetButtonText(authButton, canEditResponsible ? "Continuar" : "Conta pronta");
            }

            if (legalButton != null)
            {
                legalButton.interactable = !busy && legalReady;
                SetButtonText(legalButton, legalReady ? "Aceitar e continuar" : "Consentimentos prontos");
            }

            if (childButton != null)
            {
                childButton.interactable = !busy && childReady;
                SetButtonText(childButton, BuildChildButtonText(session, busy));
            }

            if (homeButton != null)
            {
                homeButton.interactable = !busy && homeReady;
                SetButtonText(homeButton, homeReady ? "Abrir minha home" : "Aguardando etapa anterior");
            }

            if (devButton != null)
            {
                devButton.interactable = !busy;
            }
        }

        private static void SetInput(InputField input, string value)
        {
            if (input == null)
            {
                return;
            }

            input.SetTextWithoutNotify(value ?? string.Empty);
        }

        private static void SetInteractable(Selectable selectable, bool interactable)
        {
            if (selectable != null)
            {
                selectable.interactable = interactable;
            }
        }

        private static void SetButtonText(Button button, string value)
        {
            if (button == null)
            {
                return;
            }

            var text = button.GetComponentInChildren<Text>();
            if (text != null)
            {
                text.text = value;
            }
        }

        private static bool HasLegalDocuments(LeggauSessionState session)
        {
            return session?.LegalDocuments != null && session.LegalDocuments.Length > 0;
        }

        private static string BuildConsentSummary(LeggauSessionState session)
        {
            if (!HasLegalDocuments(session))
            {
                return "Consentimentos\nNenhum documento extra exigido nesta etapa.";
            }

            var lines = "Consentimentos";
            foreach (var document in session.LegalDocuments)
            {
                if (document == null)
                {
                    continue;
                }

                var status = session.ConsentsRecorded ? "aceito" : "pendente";
                lines += $"\n• {document.title} · {status}";
            }

            return lines;
        }

        private static string BuildChildSummary(LeggauSessionState session)
        {
            if (session?.ActiveChild != null)
            {
                return $"Perfil infantil\nEncontramos {session.ActiveChild.name} para continuar a jornada.";
            }

            if (!string.IsNullOrWhiteSpace(session?.DraftChildName))
            {
                return $"Perfil infantil\n{session.DraftChildName} sera usado como primeira crianca do app.";
            }

            return "Perfil infantil\nDigite o nome da crianca para criar o primeiro perfil.";
        }

        private static string BuildEntrySummary(LeggauSessionState session)
        {
            if (session == null)
            {
                return "Entrada na home\nAguardando informacoes do onboarding.";
            }

            if (session.HomeReady)
            {
                return $"Entrada na home\nHome salva para {session.ActiveChild?.name ?? "a crianca"} e pronta para continuar.";
            }

            if (session.ActiveChild != null)
            {
                return $"Entrada na home\nTudo pronto para abrir a home de {session.ActiveChild.name}.";
            }

            return "Entrada na home\nConclua as etapas anteriores para abrir a experiencia principal.";
        }

        private static string BuildChildButtonText(LeggauSessionState session, bool busy)
        {
            if (busy)
            {
                return "Processando...";
            }

            if (session?.ActiveChild != null)
            {
                return $"Usar {session.ActiveChild.name}";
            }

            return "Confirmar crianca";
        }
    }
}
