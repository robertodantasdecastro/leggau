using System.Text;
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
        [SerializeField] private InputField developmentMinorNameInput;
        [SerializeField] private Toggle developmentAdolescentToggle;
        [SerializeField] private TextValueView familySummaryLabel;
        [SerializeField] private TextValueView minorSummaryLabel;
        [SerializeField] private TextValueView policySummaryLabel;
        [SerializeField] private TextValueView entrySummaryLabel;
        [SerializeField] private Button authButton;
        [SerializeField] private Button familyButton;
        [SerializeField] private Button previousMinorButton;
        [SerializeField] private Button nextMinorButton;
        [SerializeField] private Button minorButton;
        [SerializeField] private Button homeButton;
        [SerializeField] private Button devButton;

        public void Bind(
            InputField responsibleEmail,
            InputField responsibleName,
            InputField responsiblePassword,
            InputField devMinorName,
            Toggle devAdolescent,
            TextValueView familySummary,
            TextValueView minorSummary,
            TextValueView policySummary,
            TextValueView entrySummary,
            Button authAction,
            Button familyAction,
            Button previousMinorAction,
            Button nextMinorAction,
            Button minorAction,
            Button homeAction,
            Button developmentAction)
        {
            parentEmailInput = responsibleEmail;
            parentNameInput = responsibleName;
            passwordInput = responsiblePassword;
            developmentMinorNameInput = devMinorName;
            developmentAdolescentToggle = devAdolescent;
            familySummaryLabel = familySummary;
            minorSummaryLabel = minorSummary;
            policySummaryLabel = policySummary;
            entrySummaryLabel = entrySummary;
            authButton = authAction;
            familyButton = familyAction;
            previousMinorButton = previousMinorAction;
            nextMinorButton = nextMinorAction;
            minorButton = minorAction;
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
            SetInput(developmentMinorNameInput, session.DraftChildName);

            if (developmentAdolescentToggle != null)
            {
                developmentAdolescentToggle.isOn = session.DraftCreateAdolescent;
            }

            familySummaryLabel?.SetText(BuildFamilySummary(session));
            minorSummaryLabel?.SetText(BuildMinorSummary(session));
            policySummaryLabel?.SetText(BuildPolicySummary(session));
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
            session.SetDraftChildName(
                developmentMinorNameInput != null ? developmentMinorNameInput.text : session.DraftChildName);
            session.SetDraftCreateAdolescent(developmentAdolescentToggle != null && developmentAdolescentToggle.isOn);
        }

        public void ApplyState(LeggauSessionState session, bool busy)
        {
            var hasSession = session != null && session.IsAuthenticated;
            var hasMinor = session != null && session.SelectedMinor != null;
            var hasPolicy = session != null && session.SelectedMinorPolicy != null;
            var noLinkedMinors = session == null || !session.HasLinkedMinors;
            var multipleMinors = session != null && session.HasMultipleLinkedMinors;

            SetInteractable(parentEmailInput, !busy && !hasSession);
            SetInteractable(parentNameInput, !busy && !hasSession);
            SetInteractable(passwordInput, !busy && !hasSession);
            SetInteractable(developmentMinorNameInput, !busy && hasSession && noLinkedMinors);

            if (developmentAdolescentToggle != null)
            {
                developmentAdolescentToggle.interactable = !busy && hasSession && noLinkedMinors;
            }

            SetInteractable(authButton, !busy && !hasSession);
            SetButtonText(authButton, hasSession ? "Responsavel ativo" : "Ativar responsavel");

            SetInteractable(familyButton, !busy && hasSession);
            SetButtonText(familyButton, hasSession ? "Atualizar perfis" : "Aguardando sessao");

            SetInteractable(previousMinorButton, !busy && multipleMinors);
            SetInteractable(nextMinorButton, !busy && multipleMinors);
            SetInteractable(minorButton, !busy && hasSession && hasMinor);
            SetButtonText(minorButton, BuildMinorButtonText(session, busy));

            SetInteractable(homeButton, !busy && hasMinor && hasPolicy && !session.HomeReady);
            SetButtonText(homeButton, BuildHomeButtonText(session, busy));

            SetInteractable(devButton, !busy && hasSession);
            SetButtonText(devButton, BuildDevelopmentButtonText(session, busy));
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

        private static string BuildFamilySummary(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Sessao e vinculos");

            if (!session.IsAuthenticated)
            {
                builder.AppendLine("Ative a sessao do responsavel para carregar os menores vinculados.");
                return builder.ToString();
            }

            builder.AppendLine($"Responsavel: {session.Parent?.name ?? session.User?.displayName ?? "Conta ativa"}");

            if (!session.HasLinkedMinors)
            {
                builder.AppendLine("Nenhum menor vinculado nesta conta.");
                builder.AppendLine("Use /pais para provisionar ou o atalho dev abaixo para validar o editor.");
                return builder.ToString();
            }

            builder.AppendLine($"Perfis vinculados: {session.LinkedMinors.Length}");
            builder.AppendLine(session.HasMultipleLinkedMinors
                ? "Escolha qual menor deve abrir a experiencia do app."
                : "Um perfil ativo foi encontrado para esta conta.");
            return builder.ToString();
        }

        private static string BuildMinorSummary(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Perfil selecionado");

            if (session.SelectedMinor == null)
            {
                builder.AppendLine("Nenhum menor selecionado ainda.");
                return builder.ToString();
            }

            builder.AppendLine(session.SelectedMinor.name);
            builder.AppendLine($"{ResolveRoleLabel(session.SelectedMinor.role)} · {session.SelectedMinor.age} anos · {session.SelectedMinor.ageBand}");

            if (session.LinkedMinors != null && session.LinkedMinors.Length > 1)
            {
                builder.AppendLine($"Selecao {ResolveMinorPosition(session) + 1}/{session.LinkedMinors.Length}");
            }

            builder.AppendLine($"Avatar: {session.SelectedMinor.avatar}");
            return builder.ToString();
        }

        private static string BuildPolicySummary(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Policy ativa");

            if (session.SelectedMinor == null)
            {
                builder.AppendLine("Escolha um menor para carregar a policy de interacao.");
                return builder.ToString();
            }

            if (session.SelectedMinorPolicy == null)
            {
                builder.AppendLine("Aguardando carregamento da policy desse menor.");
                return builder.ToString();
            }

            builder.AppendLine($"Shell: {ResolveShellLabel(session.ActiveShell)} · Faixa {session.ResolvedAgeBand}");
            builder.AppendLine(session.SelectedMinorPolicy.roomsEnabled ? "Salas estruturadas liberadas" : "Salas estruturadas bloqueadas");
            builder.AppendLine(session.SelectedMinorPolicy.presenceEnabled ? "Presenca monitorada liberada" : "Presenca monitorada bloqueada");
            builder.AppendLine(session.SelectedMinorPolicy.messagingMode == "none"
                ? "Mensageria livre indisponivel"
                : $"Mensageria: {session.SelectedMinorPolicy.messagingMode}");
            builder.AppendLine(session.SelectedMinorPolicy.therapistParticipationAllowed
                ? "Participacao clinica permitida pela policy"
                : "Acoes clinicas interativas ocultas nesta fase");
            return builder.ToString();
        }

        private static string BuildEntrySummary(LeggauSessionState session)
        {
            if (!session.IsAuthenticated)
            {
                return "Entrada no shell\nAguardando a ativacao da sessao do responsavel.";
            }

            if (session.HomeReady)
            {
                var builder = new StringBuilder();
                builder.AppendLine("Entrada no shell");
                builder.AppendLine($"{ResolveShellLabel(session.ActiveShell)} pronta para {session.SelectedMinor?.name ?? "o menor"} continuar.");

                if (!string.IsNullOrWhiteSpace(session.ResolveSessionStatus()))
                {
                    builder.AppendLine($"Lifecycle: {session.ResolveSessionStatus()}");
                }

                if (!string.IsNullOrWhiteSpace(session.ResolveLifecycleHeadline()))
                {
                    builder.AppendLine(session.ResolveLifecycleHeadline());
                }

                if (!string.IsNullOrWhiteSpace(session.ResolveLifecycleMessage()))
                {
                    builder.AppendLine(session.ResolveLifecycleMessage());
                }

                return builder.ToString();
            }

            if (session.SelectedMinorPolicy != null)
            {
                var builder = new StringBuilder();
                builder.AppendLine("Entrada no shell");
                builder.AppendLine($"Tudo pronto para abrir a experiencia {ResolveShellLabel(session.ActiveShell)}.");
                if (!string.IsNullOrWhiteSpace(session.ResolveLifecycleHeadline()))
                {
                    builder.AppendLine(session.ResolveLifecycleHeadline());
                }
                return builder.ToString();
            }

            if (session.SelectedMinor != null)
            {
                return $"Entrada no shell\nConfirme a policy de {session.SelectedMinor.name} antes de seguir.";
            }

            if (session.HasLinkedMinors)
            {
                return "Entrada no shell\nEscolha qual menor deve seguir para a home.";
            }

            return "Entrada no shell\nSem menor vinculado ainda. O fluxo web em /pais continua sendo o caminho canonico.";
        }

        private static string BuildMinorButtonText(LeggauSessionState session, bool busy)
        {
            if (busy)
            {
                return "Processando...";
            }

            if (session?.SelectedMinor == null)
            {
                return "Escolher perfil";
            }

            return $"Usar {session.SelectedMinor.name}";
        }

        private static string BuildHomeButtonText(LeggauSessionState session, bool busy)
        {
            if (busy)
            {
                return "Entrando...";
            }

            if (session == null)
            {
                return "Aguardando sessao";
            }

            if (session.HomeReady)
            {
                return "Shell pronta";
            }

            if (session.ActiveRoom != null &&
                (session.IsRoomSessionStale ||
                 session.IsRoomSessionClosedByTimeout ||
                 session.IsRoomSessionClosedByAdmin ||
                 session.IsRoomSessionParticipantRemoved ||
                 session.IsLockExpired()))
            {
                return "Recuperar runtime";
            }

            if (session.SelectedMinorPolicy == null)
            {
                return "Aguardando policy";
            }

            return "Abrir experiencia";
        }

        private static string BuildDevelopmentButtonText(LeggauSessionState session, bool busy)
        {
            if (busy)
            {
                return "Modo dev em andamento";
            }

            if (session == null || !session.IsAuthenticated)
            {
                return "Modo dev rapido";
            }

            if (!session.HasLinkedMinors)
            {
                return session.DraftCreateAdolescent
                    ? "Criar adolescente demo"
                    : "Criar crianca demo";
            }

            if (!session.HomeReady)
            {
                return "Completar fluxo demo";
            }

            return "Atualizar shell demo";
        }

        private static int ResolveMinorPosition(LeggauSessionState session)
        {
            if (session?.LinkedMinors == null || session.SelectedMinor == null)
            {
                return 0;
            }

            for (var index = 0; index < session.LinkedMinors.Length; index += 1)
            {
                if (session.LinkedMinors[index]?.id == session.SelectedMinor.id)
                {
                    return index;
                }
            }

            return 0;
        }

        private static string ResolveRoleLabel(string role)
        {
            return role == "adolescent" ? "Adolescente" : "Crianca";
        }

        private static string ResolveShellLabel(string shell)
        {
            return shell == "adolescent" ? "shell adolescente" : "shell infantil";
        }
    }
}
