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
            }

            if (legalButton != null)
            {
                legalButton.interactable = !busy && legalReady;
            }

            if (childButton != null)
            {
                childButton.interactable = !busy && childReady;
            }

            if (homeButton != null)
            {
                homeButton.interactable = !busy && homeReady;
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

        private static bool HasLegalDocuments(LeggauSessionState session)
        {
            return session?.LegalDocuments != null && session.LegalDocuments.Length > 0;
        }

        private static string BuildConsentSummary(LeggauSessionState session)
        {
            if (!HasLegalDocuments(session))
            {
                return "Documentos legais\nNenhum documento exigido no momento.";
            }

            var lines = "Documentos legais";
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
    }
}
